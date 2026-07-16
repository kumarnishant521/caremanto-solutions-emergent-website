"""Backend tests for Caremanto Solutions API"""
import os
import pytest
import requests
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL') or 'https://design-restore-pro.preview.emergentagent.com'
BASE_URL = BASE_URL.rstrip('/')
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@caremanto.com"
ADMIN_PASSWORD = "Caremanto@2026"


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
    assert isinstance(data, list)
    assert len(data) >= 3, "expected seeded projects"
    for p in data:
        assert "_id" not in p
        assert "id" in p


def test_list_projects_filter(s):
    r = s.get(f"{API}/projects", params={"category": "interiors"})
    assert r.status_code == 200
    for p in r.json():
        assert p["category"] == "interiors"


def test_gallery_taxonomy(s):
    r = s.get(f"{API}/gallery/taxonomy")
    assert r.status_code == 200
    data = r.json()
    assert "spaces" in data and "segments" in data
    assert "Bathroom" in data["spaces"]


def test_gallery_list(s):
    r = s.get(f"{API}/gallery")
    assert r.status_code == 200
    assert isinstance(r.json(), list)
    assert len(r.json()) >= 3


# ------------ Auth ------------
def test_login_invalid():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong"})
    assert r.status_code == 401


def test_login_success_sets_cookie():
    sess = requests.Session()
    r = sess.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200
    body = r.json()
    assert body["email"] == ADMIN_EMAIL
    assert body["role"] == "admin"
    assert "access_token" in sess.cookies


def test_admin_endpoints_401_without_auth():
    r = requests.get(f"{API}/admin/leads")
    assert r.status_code == 401


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


def test_admin_leads_flow(admin_session):
    # list
    r = admin_session.get(f"{API}/admin/leads")
    assert r.status_code == 200
    leads = r.json()
    assert isinstance(leads, list)
    if leads:
        lid = leads[0]["id"]
        # update status
        r = admin_session.patch(f"{API}/admin/leads/{lid}", params={"status": "in-progress"})
        assert r.status_code == 200


# ------------ Projects admin CRUD ------------
def test_project_crud(admin_session):
    payload = {
        "title": "TEST_Project",
        "category": "interiors",
        "subcategory": "Residential",
        "location": "Test City",
        "year": "2026",
        "story": "A test project",
        "cover_image": "https://example.com/x.jpg",
        "images": ["https://example.com/x.jpg"],
        "featured": False,
    }
    r = admin_session.post(f"{API}/admin/projects", json=payload)
    assert r.status_code == 200, r.text
    pid = r.json()["id"]

    # GET verify
    r = admin_session.get(f"{API}/projects/{pid}")
    assert r.status_code == 200
    assert r.json()["title"] == "TEST_Project"

    # UPDATE
    payload["title"] = "TEST_Project_Updated"
    r = admin_session.put(f"{API}/admin/projects/{pid}", json=payload)
    assert r.status_code == 200
    assert r.json()["title"] == "TEST_Project_Updated"

    # DELETE
    r = admin_session.delete(f"{API}/admin/projects/{pid}")
    assert r.status_code == 200

    # verify gone
    r = admin_session.get(f"{API}/projects/{pid}")
    assert r.status_code == 404


# ------------ Gallery admin CRUD ------------
def test_gallery_crud(admin_session):
    payload = {
        "title": "TEST_Photo",
        "description": "",
        "space": "Bathroom",
        "segment": "Wall Finishes",
        "image": "https://example.com/g.jpg",
    }
    r = admin_session.post(f"{API}/admin/gallery", json=payload)
    assert r.status_code == 200
    pid = r.json()["id"]

    # verify appears in public list
    r = admin_session.get(f"{API}/gallery", params={"space": "Bathroom"})
    assert any(p["id"] == pid for p in r.json())

    r = admin_session.put(f"{API}/admin/gallery/{pid}",
                          json={**payload, "title": "TEST_Photo_Updated"})
    assert r.status_code == 200
    assert r.json()["title"] == "TEST_Photo_Updated"

    r = admin_session.delete(f"{API}/admin/gallery/{pid}")
    assert r.status_code == 200


# ------------ Taxonomy update ------------
def test_taxonomy_update(admin_session, s):
    # get current
    original = s.get(f"{API}/gallery/taxonomy").json()
    new_spaces = list(original["spaces"]) + ["TEST_Terrace"]
    r = admin_session.put(f"{API}/admin/gallery/taxonomy",
                          json={"spaces": new_spaces, "segments": original["segments"]})
    assert r.status_code == 200
    assert "TEST_Terrace" in r.json()["spaces"]

    # verify public
    now = s.get(f"{API}/gallery/taxonomy").json()
    assert "TEST_Terrace" in now["spaces"]

    # restore
    admin_session.put(f"{API}/admin/gallery/taxonomy",
                      json={"spaces": original["spaces"], "segments": original["segments"]})


# ------------ Logout ------------
def test_logout(admin_session):
    r = admin_session.post(f"{API}/auth/logout")
    assert r.status_code == 200
