"""Iteration 9 backend tests — folder-order, home-sequence, leads.other."""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL") or open("/app/frontend/.env").read().split("REACT_APP_BACKEND_URL=")[1].strip().splitlines()[0]
BASE_URL = BASE_URL.rstrip("/")


@pytest.fixture(scope="module")
def token():
    r = requests.post(f"{BASE_URL}/api/auth/passless-login")
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="module")
def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


# ---- folder-order auth guard ----
def test_folder_order_requires_auth():
    r = requests.put(f"{BASE_URL}/api/admin/gallery/folder-order", json={"order": ["x"]})
    assert r.status_code in (401, 403), f"expected 401/403 got {r.status_code}"


# ---- home-sequence order ----
def test_home_sequence_sorted(auth_headers):
    # seed two featured photos with distinct home_order values
    p1 = requests.post(f"{BASE_URL}/api/admin/gallery", headers=auth_headers, json={
        "title": "TEST_home_A", "category": "residential", "subcategory": "TEST", "image": "https://example.com/a.jpg", "featured_home": True
    })
    p2 = requests.post(f"{BASE_URL}/api/admin/gallery", headers=auth_headers, json={
        "title": "TEST_home_B", "category": "residential", "subcategory": "TEST", "image": "https://example.com/b.jpg", "featured_home": True
    })
    assert p1.status_code == 200 and p2.status_code == 200, (p1.text, p2.text)
    id1, id2 = p1.json()["id"], p2.json()["id"]
    # set order: B first, A second
    r = requests.put(f"{BASE_URL}/api/admin/gallery/home-sequence", headers=auth_headers, json={"order": [id2, id1]})
    assert r.status_code == 200
    seq = requests.get(f"{BASE_URL}/api/gallery/home-sequence").json()
    ids = [d["id"] for d in seq if d["id"] in (id1, id2)]
    assert ids == [id2, id1], f"home-sequence order wrong: {ids}"
    # cleanup
    for pid in (id1, id2):
        requests.delete(f"{BASE_URL}/api/admin/gallery/{pid}", headers=auth_headers)


# ---- folder-order persistence ----
def test_folder_order_persists(auth_headers):
    p1 = requests.post(f"{BASE_URL}/api/admin/gallery", headers=auth_headers, json={
        "title": "TEST_fo_A", "category": "residential", "subcategory": "TEST", "image": "https://example.com/fa.jpg"
    })
    p2 = requests.post(f"{BASE_URL}/api/admin/gallery", headers=auth_headers, json={
        "title": "TEST_fo_B", "category": "residential", "subcategory": "TEST", "image": "https://example.com/fb.jpg"
    })
    id1, id2 = p1.json()["id"], p2.json()["id"]
    r = requests.put(f"{BASE_URL}/api/admin/gallery/folder-order", headers=auth_headers, json={"order": [id2, id1]})
    assert r.status_code == 200
    body = r.json()
    assert body.get("ok") is True and body.get("count") == 2
    # verify via GET /api/gallery
    all_photos = requests.get(f"{BASE_URL}/api/gallery").json()
    by_id = {p["id"]: p for p in all_photos}
    assert by_id[id2].get("folder_order") == 0
    assert by_id[id1].get("folder_order") == 1
    # cleanup
    for pid in (id1, id2):
        requests.delete(f"{BASE_URL}/api/admin/gallery/{pid}", headers=auth_headers)


# ---- leads accept 'other' ----
def test_lead_other_service():
    r = requests.post(f"{BASE_URL}/api/leads", json={
        "name": "TEST_other", "phone": "9876543210", "email": "test@example.com",
        "pincode": "560001", "service_type": "other", "message": "TEST"
    })
    assert r.status_code == 200, r.text
    d = r.json()
    assert d.get("service_type") == "other"
    assert "id" in d
