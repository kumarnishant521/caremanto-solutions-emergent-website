"""Backend tests for Caremanto Solutions API (iteration 2 taxonomy + upload)."""
import io
import os
import struct
import uuid
import zlib

import pytest
import requests

BASE_URL = os.environ['REACT_APP_BACKEND_URL'].rstrip('/')
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@caremanto.com"
ADMIN_PASSWORD = "Caremanto@2026"


def _tiny_png_bytes() -> bytes:
    """1x1 red PNG, ~70 bytes, valid enough for content_type sniffing."""
    sig = b'\x89PNG\r\n\x1a\n'
    def chunk(t, d):
        return (struct.pack('>I', len(d)) + t + d +
                struct.pack('>I', zlib.crc32(t + d) & 0xffffffff))
    ihdr = struct.pack('>IIBBBBB', 1, 1, 8, 2, 0, 0, 0)
    idat = zlib.compress(b'\x00\xff\x00\x00', 9)
    return sig + chunk(b'IHDR', ihdr) + chunk(b'IDAT', idat) + chunk(b'IEND', b'')


@pytest.fixture(scope="session")
def s():
    return requests.Session()


@pytest.fixture(scope="session")
def admin_session():
    sess = requests.Session()
    r = sess.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    return sess


# ------------ Health / Public ------------
def test_health(s):
    r = s.get(f"{API}/")
    assert r.status_code == 200
    assert r.json().get("status") == "ok"


def test_list_projects_public(s):
    r = s.get(f"{API}/projects")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list) and len(data) >= 3
    assert all("_id" not in p and "id" in p for p in data)


def test_list_projects_filter_interiors(s):
    r = s.get(f"{API}/projects", params={"category": "interiors"})
    assert r.status_code == 200
    assert all(p["category"] == "interiors" for p in r.json())


# ------------ Taxonomy (new schema) ------------
EXPECTED_TAXONOMY = {
    "categories": ["RESIDENTIAL", "COMMERCIAL"],
    "subcategories": {
        "RESIDENTIAL": ["Bedrooms", "Bathrooms", "Kitchen", "Hall & Dining", "Balcony - Dry Area", "Temple"],
        "COMMERCIAL":  ["Hospitality", "Retail Design", "Office Spaces"],
    },
}


def test_gallery_taxonomy(s):
    r = s.get(f"{API}/gallery/taxonomy")
    assert r.status_code == 200
    data = r.json()
    assert data["categories"] == EXPECTED_TAXONOMY["categories"]
    assert data["subcategories"] == EXPECTED_TAXONOMY["subcategories"]


def test_gallery_list_public(s):
    r = s.get(f"{API}/gallery")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


# ------------ Auth ------------
def test_login_invalid():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong"})
    assert r.status_code == 401


def test_login_success_sets_cookie():
    sess = requests.Session()
    r = sess.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200
    body = r.json()
    assert body["email"] == ADMIN_EMAIL and body["role"] == "admin"
    assert "access_token" in sess.cookies


def test_admin_endpoints_401_without_auth():
    assert requests.get(f"{API}/admin/leads").status_code == 401
    assert requests.post(f"{API}/admin/upload", files={"file": ("x.png", b"", "image/png")}).status_code == 401


def test_auth_me(admin_session):
    r = admin_session.get(f"{API}/auth/me")
    assert r.status_code == 200
    assert r.json()["email"] == ADMIN_EMAIL


# ------------ Leads ------------
def test_create_lead_public(s):
    payload = {
        "name": "TEST_Lead",
        "email": f"test_{uuid.uuid4().hex[:6]}@example.com",
        "phone": "+91 9999999999",
        "project_type": "Interiors",
        "budget": "50L+",
        "message": "Test consultation message",
    }
    r = s.post(f"{API}/leads", json=payload)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["id"] and body["status"] == "new"
    assert body["email"] == payload["email"]


# ------------ Gallery CRUD (new schema: category/subcategory) ------------
def test_gallery_crud_new_schema(admin_session):
    payload = {
        "title": "TEST_Photo",
        "description": "",
        "category": "RESIDENTIAL",
        "subcategory": "Bedrooms",
        "image": "https://example.com/g.jpg",
    }
    r = admin_session.post(f"{API}/admin/gallery", json=payload)
    assert r.status_code == 200, r.text
    pid = r.json()["id"]
    assert r.json()["category"] == "RESIDENTIAL"
    assert r.json()["subcategory"] == "Bedrooms"

    # Filter list by category+subcategory
    r = admin_session.get(f"{API}/gallery",
                          params={"category": "RESIDENTIAL", "subcategory": "Bedrooms"})
    assert r.status_code == 200
    assert any(p["id"] == pid for p in r.json())

    # Update
    r = admin_session.put(f"{API}/admin/gallery/{pid}",
                          json={**payload, "title": "TEST_Photo_Updated"})
    assert r.status_code == 200
    assert r.json()["title"] == "TEST_Photo_Updated"

    # Delete
    r = admin_session.delete(f"{API}/admin/gallery/{pid}")
    assert r.status_code == 200


# ------------ Upload (POST /api/admin/upload) ------------
def test_upload_requires_auth():
    r = requests.post(f"{API}/admin/upload",
                      files={"file": ("x.png", _tiny_png_bytes(), "image/png")})
    assert r.status_code == 401


def test_upload_rejects_bad_mime(admin_session):
    r = admin_session.post(f"{API}/admin/upload",
                           files={"file": ("x.txt", b"hello", "text/plain")})
    assert r.status_code == 400


def test_upload_success_and_static_fetch(admin_session, s):
    data = _tiny_png_bytes()
    r = admin_session.post(f"{API}/admin/upload",
                           files={"file": ("shot.png", data, "image/png")})
    assert r.status_code == 200, r.text
    body = r.json()
    assert "url" in body and "filename" in body and "size" in body
    assert body["url"].startswith("/api/uploads/")
    assert body["size"] == len(data)

    # Fetch the file publicly via static mount
    fetch_url = f"{BASE_URL}{body['url']}"
    r2 = s.get(fetch_url)
    assert r2.status_code == 200, f"static fetch failed: {r2.status_code} {fetch_url}"
    assert r2.content == data


# ------------ Taxonomy update round-trip ------------
def test_taxonomy_update_restore(admin_session, s):
    original = s.get(f"{API}/gallery/taxonomy").json()
    modified = {
        "categories": original["categories"] + ["TEST_TMP"],
        "subcategories": {**original["subcategories"], "TEST_TMP": ["one"]},
    }
    r = admin_session.put(f"{API}/admin/gallery/taxonomy", json=modified)
    assert r.status_code == 200
    assert "TEST_TMP" in r.json()["categories"]

    # restore
    r = admin_session.put(f"{API}/admin/gallery/taxonomy", json=original)
    assert r.status_code == 200


# ------------ Passless login (iteration_4) ------------
def test_passless_login_sets_cookie_and_returns_admin():
    sess = requests.Session()
    r = sess.post(f"{API}/auth/passless-login")
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["role"] == "admin"
    assert body["email"] == ADMIN_EMAIL
    assert "token" in body and body["token"]
    assert "access_token" in sess.cookies
    # /auth/me works with just the cookie
    r2 = sess.get(f"{API}/auth/me")
    assert r2.status_code == 200
    assert r2.json()["email"] == ADMIN_EMAIL


# ------------ Gallery seed of 48 Drive photos ------------
def test_gallery_has_48_drive_photos(s):
    r = s.get(f"{API}/gallery")
    assert r.status_code == 200
    docs = r.json()
    assert isinstance(docs, list)
    assert len(docs) >= 48, f"expected >=48 gallery photos, got {len(docs)}"
    drive_docs = [d for d in docs if "lh3.googleusercontent.com/d/" in (d.get("image") or "")]
    assert len(drive_docs) >= 48, f"expected >=48 googleusercontent drive photos, got {len(drive_docs)}"
    cats = {d.get("category") for d in drive_docs}
    assert cats.issubset({"RESIDENTIAL", "COMMERCIAL"}), f"unexpected categories: {cats}"
    for d in drive_docs[:5]:
        assert d["image"].startswith("https://lh3.googleusercontent.com/d/")
        assert "=w" in d["image"]


# ------------ Covers (public) ------------
def test_covers_public(s):
    r = s.get(f"{API}/covers")
    assert r.status_code == 200
    body = r.json()
    assert "interiors_cover" in body and "restoration_cover" in body


# ------------ Video upload (tiny mp4) ------------
def _tiny_mp4_bytes() -> bytes:
    # Minimal-ish MP4: ftyp + free box. Not playable but has correct sniff signature.
    ftyp = b'\x00\x00\x00\x20ftypisom\x00\x00\x02\x00isomiso2avc1mp41'
    free = b'\x00\x00\x00\x08free'
    return ftyp + free


def test_upload_video_success(admin_session, s):
    data = _tiny_mp4_bytes()
    r = admin_session.post(
        f"{API}/admin/upload",
        files={"file": ("clip.mp4", data, "video/mp4")},
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["content_type"] == "video/mp4"
    assert body["size"] == len(data)
    assert body["url"].startswith("/api/uploads/")
    fetched = s.get(f"{BASE_URL}{body['url']}")
    assert fetched.status_code == 200
    assert fetched.content == data


# ------------ Video CRUD (iteration_4) ------------
def test_videos_crud_end_to_end(admin_session):
    payload = {
        "title": "TEST_Video",
        "description": "e2e test",
        "url": "https://example.com/clip.mp4",
        "poster": "https://example.com/poster.jpg",
        "featured_home": True,
    }
    r = admin_session.post(f"{API}/admin/videos", json=payload)
    assert r.status_code == 200, r.text
    vid = r.json()
    assert vid["id"] and vid["title"] == "TEST_Video"
    vid_id = vid["id"]

    # public list
    r = requests.get(f"{API}/videos")
    assert r.status_code == 200
    assert any(v["id"] == vid_id for v in r.json())

    # update
    r = admin_session.put(f"{API}/admin/videos/{vid_id}",
                          json={**payload, "title": "TEST_Video_Updated"})
    assert r.status_code == 200
    assert r.json()["title"] == "TEST_Video_Updated"

    # unauth guard
    r = requests.put(f"{API}/admin/videos/{vid_id}", json=payload)
    assert r.status_code == 401

    # delete
    r = admin_session.delete(f"{API}/admin/videos/{vid_id}")
    assert r.status_code == 200

    # confirm gone
    r = admin_session.delete(f"{API}/admin/videos/{vid_id}")
    assert r.status_code == 404


# ------------ Gallery CRUD via passless cookie ------------
def test_gallery_crud_via_passless_cookie():
    sess = requests.Session()
    r = sess.post(f"{API}/auth/passless-login")
    assert r.status_code == 200
    payload = {
        "title": "TEST_Passless_Photo",
        "description": "",
        "category": "COMMERCIAL",
        "subcategory": "Office Spaces",
        "image": "https://example.com/x.jpg",
        "featured_home": False,
    }
    r = sess.post(f"{API}/admin/gallery", json=payload)
    assert r.status_code == 200, r.text
    pid = r.json()["id"]
    r = sess.put(f"{API}/admin/gallery/{pid}", json={**payload, "featured_home": True})
    assert r.status_code == 200
    assert r.json()["featured_home"] is True
    r = sess.delete(f"{API}/admin/gallery/{pid}")
    assert r.status_code == 200


# ------------ Logout ------------
def test_logout(admin_session):
    r = admin_session.post(f"{API}/auth/logout")
    assert r.status_code == 200
