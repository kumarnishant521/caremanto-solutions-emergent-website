"""Iteration 11 regression tests: security headers, XSS sanitization, gzip, static SEO files."""
import os
import gzip
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/") or "https://design-restore-pro.preview.emergentagent.com"


@pytest.fixture(scope="module")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


EXPECTED_SEC_HEADERS = {
    "x-frame-options": "DENY",
    "x-content-type-options": "nosniff",
    "referrer-policy": "strict-origin-when-cross-origin",
}


class TestSecurityHeaders:
    """Security headers must be present on every /api response."""

    @pytest.mark.parametrize("path", ["/api/gallery", "/api/covers"])
    def test_security_headers_present(self, s, path):
        r = s.get(f"{BASE_URL}{path}")
        assert r.status_code == 200, f"{path} returned {r.status_code}"
        h = {k.lower(): v for k, v in r.headers.items()}
        for k, v in EXPECTED_SEC_HEADERS.items():
            assert k in h, f"missing {k}: got {list(h)}"
            assert v.lower() in h[k].lower(), f"{k}={h[k]} expected {v}"
        assert "permissions-policy" in h
        assert "strict-transport-security" in h
        assert "content-security-policy-report-only" in h


class TestGzip:
    def test_gallery_gzipped(self, s):
        headers = {"Accept-Encoding": "gzip"}
        r_gz = requests.get(f"{BASE_URL}/api/gallery", headers=headers)
        assert r_gz.status_code == 200
        # requests auto-decodes; use raw content
        raw_len = len(r_gz.content)
        encoding = r_gz.headers.get("Content-Encoding", "").lower()
        # If payload > 500 bytes gzip should apply
        r_plain = requests.get(f"{BASE_URL}/api/gallery", headers={"Accept-Encoding": "identity"})
        plain_len = len(r_plain.content)
        if plain_len > 500:
            assert encoding == "gzip", f"expected gzip, got {encoding}"
            # requests already decompressed; check raw stream via urllib3
            r_raw = requests.get(f"{BASE_URL}/api/gallery", headers=headers, stream=True)
            raw_bytes = r_raw.raw.read(decode_content=False)
            assert len(raw_bytes) < plain_len, f"compressed {len(raw_bytes)} not smaller than plain {plain_len}"


class TestFilesCache:
    def test_files_cache_control(self, s):
        # find a real file path via gallery
        r = s.get(f"{BASE_URL}/api/gallery")
        photos = r.json()
        api_file = None
        for p in photos:
            img = p.get("image", "")
            if "/api/files/" in img:
                api_file = img
                break
        if not api_file:
            pytest.skip("No /api/files/ asset in current gallery")
        url = api_file if api_file.startswith("http") else f"{BASE_URL}{api_file}"
        rf = requests.get(url, stream=True)
        assert rf.status_code == 200
        cc = rf.headers.get("Cache-Control", "")
        # NOTE: Cloudflare in the preview environment may override Cache-Control
        # to `no-store, no-cache, must-revalidate` due to the __cf_bm cookie.
        # We verify the origin behaviour by hitting localhost:8001 as well.
        try:
            local = requests.get(f"http://localhost:8001{api_file.split('/api')[-1] and '/api'+api_file.split('/api',1)[1]}", stream=True, timeout=5)
            local_cc = local.headers.get("Cache-Control", "")
            local.close()
        except Exception:
            local_cc = ""
        assert ("max-age=31536000" in cc and "immutable" in cc) or ("max-age=31536000" in local_cc and "immutable" in local_cc), \
            f"edge cc={cc!r}, origin cc={local_cc!r}"
        rf.close()


class TestLeadSanitization:
    """XSS hardening on POST /api/leads."""

    def test_lead_html_stripped(self, s):
        payload = {
            "name": "<script>alert(1)</script>Bob",
            "email": "test_iter11@example.com",
            "phone": "9876543210",
            "service_type": "other",
            "pincode": "400078",
            "message": "<img src=x onerror=alert(2)>Hi",
        }
        r = s.post(f"{BASE_URL}/api/leads", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["name"] == "alert(1)Bob", f"name={data['name']!r}"
        # bleach with strip=True removes the img tag and content inside — should just be 'Hi'
        assert data["message"] == "Hi", f"message={data['message']!r}"
        assert data["customer_uid"].startswith("CS-"), data["customer_uid"]
        assert data["phone"] == "9876543210"
        # cleanup — need admin
        lead_id = data["id"]
        auth = s.post(f"{BASE_URL}/api/auth/passless-login")
        token = auth.json().get("token")
        s.headers.update({"Authorization": f"Bearer {token}"})
        d = s.delete(f"{BASE_URL}/api/admin/leads/{lead_id}")
        assert d.status_code == 200

    def test_lead_plain_text_unchanged(self, s):
        payload = {
            "name": "Jane Doe",
            "email": "test_iter11_plain@example.com",
            "phone": "9999999999",
            "service_type": "interiors",
            "message": "Please contact me about a project.",
        }
        r = s.post(f"{BASE_URL}/api/leads", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["name"] == "Jane Doe"
        assert data["message"] == "Please contact me about a project."
        assert data["phone"] == "9999999999"
        # cleanup
        auth = s.post(f"{BASE_URL}/api/auth/passless-login")
        token = auth.json().get("token")
        s.headers.update({"Authorization": f"Bearer {token}"})
        s.delete(f"{BASE_URL}/api/admin/leads/{data['id']}")


class TestGalleryRegression:
    def test_gallery_schema(self, s):
        r = s.get(f"{BASE_URL}/api/gallery")
        assert r.status_code == 200
        arr = r.json()
        assert isinstance(arr, list)
        if arr:
            g = arr[0]
            # schema must include the fields (even if None)
            for k in ["id", "category", "image", "created_at"]:
                assert k in g
            # folder_order + home_order should be part of the model
            assert "folder_order" in g or arr[0].get("folder_order", "missing") != "missing"

    def test_home_sequence_endpoint(self, s):
        r = s.get(f"{BASE_URL}/api/gallery/home-sequence")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_admin_folder_order_requires_auth(self, s):
        # unauthenticated should be 401
        r = requests.put(f"{BASE_URL}/api/admin/gallery/folder-order", json={"order": []})
        assert r.status_code == 401

    def test_admin_home_sequence_requires_auth(self, s):
        r = requests.put(f"{BASE_URL}/api/admin/gallery/home-sequence", json={"order": []})
        assert r.status_code == 401


class TestStaticSEO:
    def test_robots_txt(self, s):
        r = requests.get(f"{BASE_URL}/robots.txt")
        assert r.status_code == 200
        ct = r.headers.get("Content-Type", "")
        assert "text/plain" in ct, ct
        assert "User-agent" in r.text
        assert "Sitemap" in r.text

    def test_sitemap_xml(self, s):
        r = requests.get(f"{BASE_URL}/sitemap.xml")
        assert r.status_code == 200
        ct = r.headers.get("Content-Type", "")
        assert "xml" in ct.lower(), ct
        assert "<urlset" in r.text


class TestCovers:
    def test_covers_endpoint(self, s):
        r = s.get(f"{BASE_URL}/api/covers")
        assert r.status_code == 200
        d = r.json()
        for k in ["interiors_cover", "restoration_cover", "marquee_items", "hero_interval_seconds"]:
            assert k in d
