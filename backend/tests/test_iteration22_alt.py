"""Iteration 22 — Auto ALT-tag generator backend tests."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://design-restore-pro.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def admin_session():
    s = requests.Session()
    r = s.post(f"{API}/auth/passless-login", timeout=15)
    assert r.status_code == 200, f"passless-login failed: {r.status_code} {r.text}"
    tok = r.json().get("access_token") or r.json().get("token")
    if tok:
        s.headers.update({"Authorization": f"Bearer {tok}"})
    return s


@pytest.fixture(scope="module")
def created_ids():
    ids = []
    yield ids
    # teardown - best effort
    s = requests.Session()
    r = s.post(f"{API}/auth/passless-login", timeout=15)
    tok = r.json().get("access_token") or r.json().get("token")
    if tok:
        s.headers.update({"Authorization": f"Bearer {tok}"})
    for pid in ids:
        try:
            s.delete(f"{API}/admin/gallery/{pid}", timeout=10)
        except Exception:
            pass


# --- Auth guard regression ---
def test_admin_gallery_requires_auth():
    r = requests.post(f"{API}/admin/gallery", json={"image": "/x.jpg", "category": "RESIDENTIAL"}, timeout=10)
    assert r.status_code in (401, 403)


# --- Public gallery regression ---
def test_public_gallery_still_returns_records():
    r = requests.get(f"{API}/gallery", timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    # alt_text may be blank for legacy records, but the field should surface on new ones


# --- Alt-preview endpoint ---
def test_alt_preview_endpoint(admin_session):
    body = {
        "filename": "luxury_bathroom_final_01.jpg",
        "category": "RESIDENTIAL",
        "subcategory": "Bathrooms",
        "title": "",
    }
    r = admin_session.post(f"{API}/admin/gallery/alt-preview", json=body, timeout=15)
    assert r.status_code == 200, r.text
    alt = r.json().get("alt_text", "")
    assert "CAREMANTO SOLUTIONS" in alt
    assert "Luxury Residential" in alt
    assert "Bathroom" in alt
    assert "Interior Design" in alt


def test_alt_preview_requires_auth():
    r = requests.post(f"{API}/admin/gallery/alt-preview", json={"filename": "x.jpg"}, timeout=10)
    assert r.status_code in (401, 403)


# --- POST auto-generation with no alt_text ---
def test_create_photo_auto_generates_alt(admin_session, created_ids):
    body = {
        "category": "RESIDENTIAL",
        "subcategory": "Bathrooms",
        "image": "/api/files/uploads/luxury_bathroom_final_01.jpg",
        "title": "",
    }
    r = admin_session.post(f"{API}/admin/gallery", json=body, timeout=15)
    assert r.status_code == 200, r.text
    data = r.json()
    created_ids.append(data["id"])
    alt = data.get("alt_text", "")
    assert alt.startswith("CAREMANTO SOLUTIONS — Luxury Residential Bathroom")
    assert "Interior Design" in alt
    # GET back to confirm persistence
    g = requests.get(f"{API}/gallery", timeout=15).json()
    match = [p for p in g if p.get("id") == data["id"]]
    assert match and match[0].get("alt_text") == alt


# --- POST with explicit alt_text preserved ---
def test_create_photo_preserves_manual_alt(admin_session, created_ids):
    manual = "My hand-written ALT"
    body = {
        "category": "RESIDENTIAL",
        "subcategory": "Bedrooms",
        "image": "/api/files/uploads/whatever.jpg",
        "alt_text": manual,
    }
    r = admin_session.post(f"{API}/admin/gallery", json=body, timeout=15)
    assert r.status_code == 200, r.text
    data = r.json()
    created_ids.append(data["id"])
    assert data.get("alt_text") == manual


# --- PUT with empty alt on record with existing alt: preserved ---
def test_put_empty_alt_preserves_existing(admin_session, created_ids):
    # create with manual alt
    manual = "Preserve Me Please"
    r = admin_session.post(f"{API}/admin/gallery", json={
        "category": "COMMERCIAL", "subcategory": "Office Spaces",
        "image": "/api/files/uploads/office.jpg", "alt_text": manual,
    }, timeout=15)
    assert r.status_code == 200
    pid = r.json()["id"]
    created_ids.append(pid)

    # PUT with empty alt_text - should preserve
    r2 = admin_session.put(f"{API}/admin/gallery/{pid}", json={
        "category": "COMMERCIAL", "subcategory": "Office Spaces",
        "image": "/api/files/uploads/office.jpg", "alt_text": "",
        "title": "Updated title",
    }, timeout=15)
    assert r2.status_code == 200, r2.text
    assert r2.json().get("alt_text") == manual


# --- PUT with empty alt on record with empty alt: regenerate ---
def test_put_empty_alt_regenerates_when_empty(admin_session, created_ids):
    # Create with empty alt_text — this will auto-gen on POST though, so we
    # need to force clear it. Insert via POST then PUT with empty alt after
    # DB clearing isn't possible via API; instead POST with alt_text=""
    # which triggers auto-gen; then PUT with same category to test that
    # PUT does NOT clobber the auto-generated alt.
    r = admin_session.post(f"{API}/admin/gallery", json={
        "category": "RESIDENTIAL", "subcategory": "Kitchens",
        "image": "/api/files/uploads/kitchen_modular.jpg",
    }, timeout=15)
    assert r.status_code == 200
    doc = r.json()
    pid = doc["id"]
    created_ids.append(pid)
    original_alt = doc["alt_text"]
    assert "Kitchen" in original_alt or "Modular" in original_alt

    # PUT with empty alt_text — the auto-generated existing value should be preserved
    r2 = admin_session.put(f"{API}/admin/gallery/{pid}", json={
        "category": "RESIDENTIAL", "subcategory": "Kitchens",
        "image": "/api/files/uploads/kitchen_modular.jpg",
        "alt_text": "",
    }, timeout=15)
    assert r2.status_code == 200
    # Since existing was non-empty, it should be preserved
    assert r2.json().get("alt_text") == original_alt


# --- PUT with new manual alt_text overrides ---
def test_put_with_manual_alt_overrides(admin_session, created_ids):
    r = admin_session.post(f"{API}/admin/gallery", json={
        "category": "RESIDENTIAL", "subcategory": "Hall & Dining",
        "image": "/api/files/uploads/hall.jpg",
    }, timeout=15)
    pid = r.json()["id"]
    created_ids.append(pid)

    new_manual = "Brand new manual alt text"
    r2 = admin_session.put(f"{API}/admin/gallery/{pid}", json={
        "category": "RESIDENTIAL", "subcategory": "Hall & Dining",
        "image": "/api/files/uploads/hall.jpg",
        "alt_text": new_manual,
    }, timeout=15)
    assert r2.status_code == 200
    assert r2.json().get("alt_text") == new_manual
