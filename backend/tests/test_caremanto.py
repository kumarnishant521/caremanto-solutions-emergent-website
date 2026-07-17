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


# ------------ Logout ------------
def test_logout(admin_session):
    r = admin_session.post(f"{API}/auth/logout")
    assert r.status_code == 200
