"""Tests for Dynamic SEO / Footer / Nav Manager (iteration 20)."""
import os
import copy
import pytest
import requests

_BASE = os.environ.get("REACT_APP_BACKEND_URL")
if not _BASE:
    # try frontend .env
    try:
        with open("/app/frontend/.env") as fh:
            for ln in fh:
                if ln.startswith("REACT_APP_BACKEND_URL="):
                    _BASE = ln.split("=", 1)[1].strip().strip('"').strip("'")
                    break
    except Exception:
        pass
assert _BASE, "REACT_APP_BACKEND_URL must be set"
BASE_URL = _BASE.rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def anon():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{API}/auth/passless-login")
    assert r.status_code == 200, f"passless-login failed: {r.status_code} {r.text}"
    tok = r.json().get("access_token") or r.json().get("token")
    if tok:
        s.headers.update({"Authorization": f"Bearer {tok}"})
    return s


@pytest.fixture(scope="module")
def original_settings(anon):
    r = anon.get(f"{API}/seo")
    assert r.status_code == 200
    return copy.deepcopy(r.json())


# ---------- GET /api/seo shape ----------
class TestGetSEO:
    def test_shape(self, anon):
        r = anon.get(f"{API}/seo")
        assert r.status_code == 200
        d = r.json()
        assert set(["sections", "footer", "nav"]).issubset(d.keys())
        for k in ["home", "residential", "commercial", "restoration", "portfolio", "studio"]:
            assert k in d["sections"], f"missing section {k}"
            sec = d["sections"][k]
            assert "title" in sec and "description" in sec and "og_image" in sec
            assert isinstance(sec.get("keywords"), list)
        assert "labels" in d["nav"]
        assert isinstance(d["nav"].get("interior_items"), list)


# ---------- Auth guard ----------
class TestAuthGuard:
    def test_put_requires_auth(self):
        r = requests.put(f"{API}/admin/seo", json={"sections": {"home": {"title": "hack"}}})
        assert r.status_code == 401, f"expected 401, got {r.status_code}"


# ---------- Partial updates preserve other fields ----------
class TestPartialUpdates:
    def test_sections_home_title(self, admin, anon, original_settings):
        new_title = "TEST_Home Title Alpha"
        r = admin.put(f"{API}/admin/seo", json={"sections": {"home": {"title": new_title}}})
        assert r.status_code == 200, r.text
        got = anon.get(f"{API}/seo").json()
        assert got["sections"]["home"]["title"] == new_title
        # description untouched (matches original merged)
        assert got["sections"]["home"]["description"] == original_settings["sections"]["home"]["description"]

    def test_footer_email_preserves_others(self, admin, anon):
        before = anon.get(f"{API}/seo").json()["footer"]
        new_email = "test_seo@example.com"
        r = admin.put(f"{API}/admin/seo", json={"footer": {"email": new_email}})
        assert r.status_code == 200
        after = anon.get(f"{API}/seo").json()["footer"]
        assert after["email"] == new_email
        for k, v in before.items():
            if k == "email":
                continue
            assert after.get(k) == v, f"footer field {k} changed unexpectedly"

    def test_nav_labels_portfolio(self, admin, anon):
        before = anon.get(f"{API}/seo").json()["nav"]["labels"]
        r = admin.put(f"{API}/admin/seo", json={"nav": {"labels": {"portfolio": "TEST_Portfolio"}}})
        assert r.status_code == 200
        after = anon.get(f"{API}/seo").json()["nav"]["labels"]
        assert after["portfolio"] == "TEST_Portfolio"
        # other labels preserved
        for k, v in before.items():
            if k == "portfolio":
                continue
            assert after.get(k) == v

    def test_nav_interior_items_replace(self, admin, anon):
        items = ["TEST_Living", "TEST_Kitchen", "TEST_Bedroom"]
        r = admin.put(f"{API}/admin/seo", json={"nav": {"interior_items": items}})
        assert r.status_code == 200
        after = anon.get(f"{API}/seo").json()["nav"]["interior_items"]
        assert after == items


# ---------- Sanitize/Dedup keywords ----------
class TestKeywordSanitize:
    def test_dedup_and_strip_tags(self, admin, anon):
        raw = [
            "Luxury Interiors",
            "luxury interiors",   # duplicate case-differ but sanitize_short may normalize (assume strict dedup)
            "Luxury Interiors",   # exact duplicate
            "<script>alert(1)</script>Design",
            "  Modern  ",
        ]
        r = admin.put(f"{API}/admin/seo", json={"sections": {"home": {"keywords": raw}}})
        assert r.status_code == 200
        got = anon.get(f"{API}/seo").json()["sections"]["home"]["keywords"]
        # no HTML tags remain
        for k in got:
            assert "<script" not in k.lower() and "</script" not in k.lower()
            assert "<" not in k and ">" not in k
        # duplicates removed - length should be <= raw length
        assert len(got) < len(raw)
        # exact duplicates gone
        assert len(got) == len(set(got))


# ---------- Footer socials list-of-dicts ----------
class TestFooterSocials:
    def test_socials_persist_and_drop_empty(self, admin, anon):
        socials = [
            {"key": "instagram", "label": "Instagram", "href": "https://instagram.com/test"},
            {"key": "", "label": "empty-key", "href": "https://x.com"},  # dropped (empty key)
            {"key": "linkedin", "label": "LinkedIn", "href": ""},        # dropped (empty href)
            {"key": "facebook", "label": "FB", "href": "https://fb.com/test"},
        ]
        r = admin.put(f"{API}/admin/seo", json={"footer": {"socials": socials}})
        assert r.status_code == 200
        got = anon.get(f"{API}/seo").json()["footer"]["socials"]
        keys = [s["key"] for s in got]
        assert "instagram" in keys
        assert "facebook" in keys
        assert "" not in keys
        assert "linkedin" not in keys  # dropped due to empty href
        assert len(got) == 2


# ---------- Regression on existing endpoints ----------
class TestRegression:
    def test_gallery(self, anon):
        r = anon.get(f"{API}/gallery")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_covers(self, anon):
        r = anon.get(f"{API}/covers")
        assert r.status_code == 200

    def test_leads_requires_auth(self):
        r = requests.get(f"{API}/admin/leads")
        assert r.status_code == 401

    def test_leads_post(self, anon):
        r = anon.post(f"{API}/leads", json={
            "name": "TEST_SEO Regression",
            "email": "test_seo@example.com",
            "phone": "9999999999",
            "project_type": "residential",
        })
        assert r.status_code in (200, 201), r.text


# ---------- Cleanup: restore defaults ----------
@pytest.fixture(scope="module", autouse=True)
def _restore_after(admin, original_settings):
    yield
    # Restore original settings (best-effort)
    try:
        admin.put(f"{API}/admin/seo", json={
            "sections": original_settings.get("sections") or {},
            "footer":   original_settings.get("footer")   or {},
            "nav":      original_settings.get("nav")      or {},
        })
    except Exception:
        pass
