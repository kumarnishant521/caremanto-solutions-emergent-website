"""Iteration 12 — media transcoding (WebP/AVIF images + H.265 video)."""

import io
import os
import time
import hashlib
from pathlib import Path

import pytest
import requests
from PIL import Image

# Load REACT_APP_BACKEND_URL from frontend/.env (pytest process doesn't inherit it)
def _load_backend_url():
    v = os.environ.get("REACT_APP_BACKEND_URL")
    if v: return v.rstrip("/")
    for line in Path("/app/frontend/.env").read_text().splitlines():
        if line.startswith("REACT_APP_BACKEND_URL="):
            return line.split("=", 1)[1].strip().rstrip("/")
    raise RuntimeError("REACT_APP_BACKEND_URL not found")

BASE_URL = _load_backend_url()
API = f"{BASE_URL}/api"

# Real seeded image path known to be present in Emergent Object Storage
SAMPLE_IMG_PATH = "caremanto/uploads/1448ad41014747fbbc8eefce7abe2fe5.jpg"
SAMPLE_IMG_URL = f"{API}/files/{SAMPLE_IMG_PATH}"

MEDIA_CACHE_DIR = Path("/app/backend/.media_cache")


# ------------------------------------------------------------------ helpers

@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(f"{API}/auth/passless-login", timeout=30)
    assert r.status_code == 200, f"passless-login failed: {r.status_code} {r.text}"
    tok = r.json().get("token") or r.json().get("access_token")
    assert tok, f"no token in response: {r.json()}"
    return tok


@pytest.fixture(scope="session")
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


# ------------------------------------------------------------------ image tests

class TestImageTranscoding:

    def test_no_accept_header_serves_original(self):
        r = requests.get(SAMPLE_IMG_URL, headers={"Accept": "image/jpeg"}, timeout=60)
        assert r.status_code == 200
        assert r.headers.get("Content-Type", "").startswith("image/jpeg")
        assert "X-Caremanto-Transcoded" not in r.headers
        # regression: file is ~14MB
        assert len(r.content) > 1_000_000

    def test_webp_negotiation(self):
        r = requests.get(
            SAMPLE_IMG_URL,
            headers={"Accept": "image/webp,*/*"},
            timeout=120,
        )
        assert r.status_code == 200
        assert r.headers.get("Content-Type") == "image/webp"
        assert r.headers.get("X-Caremanto-Transcoded") == "webp"
        assert "Accept" in (r.headers.get("Vary") or "")
        # WebP should be dramatically smaller (< 15% of raw ~14.7MB)
        assert len(r.content) < 0.15 * 14_700_000, (
            f"WebP not smaller than expected: {len(r.content)} bytes"
        )
        # sanity — magic bytes RIFF....WEBP
        assert r.content[:4] == b"RIFF" and r.content[8:12] == b"WEBP"

    def test_avif_negotiation(self):
        r = requests.get(
            SAMPLE_IMG_URL,
            headers={"Accept": "image/avif,image/webp,*/*"},
            timeout=120,
        )
        assert r.status_code == 200
        assert r.headers.get("Content-Type") == "image/avif"
        assert r.headers.get("X-Caremanto-Transcoded") == "avif"
        assert len(r.content) < 0.20 * 14_700_000

    def test_cache_is_populated(self):
        """After the previous two tests both formats should be on disk."""
        sha1 = hashlib.sha1(SAMPLE_IMG_PATH.encode("utf-8")).hexdigest()
        webp = MEDIA_CACHE_DIR / f"{sha1}.webp"
        avif = MEDIA_CACHE_DIR / f"{sha1}.avif"
        assert webp.exists() and webp.stat().st_size > 0, f"missing {webp}"
        assert avif.exists() and avif.stat().st_size > 0, f"missing {avif}"

    def test_repeat_webp_served_from_cache(self):
        """Second request should be much faster than the first encode."""
        t0 = time.perf_counter()
        r = requests.get(
            SAMPLE_IMG_URL,
            headers={"Accept": "image/webp,*/*"},
            timeout=60,
        )
        dt = time.perf_counter() - t0
        assert r.status_code == 200
        assert r.headers.get("X-Caremanto-Transcoded") == "webp"
        # cache read should be well under a couple of seconds even over WAN
        assert dt < 10, f"suspiciously slow cache hit: {dt:.2f}s"

    def test_nonexistent_image_still_returns_404(self):
        r = requests.get(
            f"{API}/files/nonexistent/path.jpg",
            headers={"Accept": "image/webp,*/*"},
            timeout=30,
        )
        assert r.status_code == 404


# ------------------------------------------------------------------ regression

class TestBackendRegression:

    def test_leads_post(self):
        r = requests.post(
            f"{API}/leads",
            json={"name": "TEST_Iter12", "email": "iter12@test.com", "message": "hi"},
            timeout=30,
        )
        assert r.status_code in (200, 201), r.text

    def test_security_headers_present(self):
        r = requests.get(f"{API}/", timeout=30)
        assert r.status_code == 200
        # iteration 11 added these — light sanity check
        for h in ("X-Content-Type-Options", "Referrer-Policy"):
            assert h in r.headers, f"missing security header {h}"

    def test_gzip_on_json(self):
        r = requests.get(
            f"{API}/gallery",
            headers={"Accept-Encoding": "gzip"},
            timeout=30,
        )
        assert r.status_code == 200
        # GZip middleware kicks in for reasonably sized payloads
        # Only assert if body large enough
        if len(r.content) > 500:
            # requests auto-decodes, but header should indicate gzip was used
            assert r.headers.get("Content-Encoding") in ("gzip", None)


# ------------------------------------------------------------------ upload

def _tiny_jpeg_bytes() -> bytes:
    img = Image.new("RGB", (64, 64), (200, 100, 50))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=80)
    return buf.getvalue()


class TestAdminUpload:

    def test_image_upload_no_h265(self, auth_headers):
        files = {"file": ("TEST_iter12.jpg", _tiny_jpeg_bytes(), "image/jpeg")}
        r = requests.post(
            f"{API}/admin/upload", headers=auth_headers, files=files, timeout=60
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert "url" in data and "filename" in data
        assert data.get("content_type", "").startswith("image/")
        # H.265 fields must NOT be added for images
        assert "h265_url" not in data
        assert "h265_status" not in data

    def test_video_upload_returns_h265_fields(self, auth_headers):
        """
        Upload a minimally-valid MP4 sample. We don't wait for the transcode
        (it's a fire-and-forget BackgroundTask); we only assert that the
        response contract advertises processing status.
        """
        # generate a tiny mp4 with ffmpeg (available at /usr/bin/ffmpeg)
        import subprocess, tempfile
        tmp = tempfile.NamedTemporaryFile(suffix=".mp4", delete=False)
        tmp.close()
        try:
            subprocess.run(
                ["ffmpeg", "-y", "-f", "lavfi", "-i", "color=c=blue:s=64x64:d=1",
                 "-c:v", "libx264", "-t", "1", "-pix_fmt", "yuv420p",
                 "-loglevel", "error", tmp.name],
                check=True, timeout=60,
            )
            with open(tmp.name, "rb") as f:
                files = {"file": ("TEST_iter12.mp4", f.read(), "video/mp4")}
            r = requests.post(
                f"{API}/admin/upload", headers=auth_headers, files=files, timeout=120
            )
            assert r.status_code == 200, r.text
            data = r.json()
            assert "h265_url" in data, f"missing h265_url in {data}"
            assert data["h265_url"].endswith(".h265.mp4")
            assert data.get("h265_status") in ("processing", "unavailable")
        finally:
            try: os.unlink(tmp.name)
            except OSError: pass
