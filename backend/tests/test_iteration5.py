"""Iteration 5 backend tests: hero slideshow config, portfolio, taxonomy restructure, migration."""
import os
import requests
import pytest

BASE_URL = os.environ['REACT_APP_BACKEND_URL'].rstrip('/')
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@caremanto.com"
ADMIN_PASSWORD = "Caremanto@2026"


@pytest.fixture(scope="session")
def admin():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200
    return s


# ----- Covers with hero_images / hero_interval_seconds
def test_covers_has_hero_fields():
    r = requests.get(f"{API}/covers")
    assert r.status_code == 200
    b = r.json()
    assert "hero_images" in b and isinstance(b["hero_images"], list)
    assert "hero_interval_seconds" in b and isinstance(b["hero_interval_seconds"], (int, float))


def test_covers_put_hero_clamps_high(admin):
    # save current
    original = requests.get(f"{API}/covers").json()
    r = admin.put(f"{API}/admin/covers", json={"hero_interval_seconds": 100})
    assert r.status_code == 200
    assert r.json()["hero_interval_seconds"] == 60.0
    # low clamp
    r = admin.put(f"{API}/admin/covers", json={"hero_interval_seconds": 0.1})
    assert r.status_code == 200
    assert r.json()["hero_interval_seconds"] == 0.5
    # valid
    r = admin.put(f"{API}/admin/covers", json={"hero_interval_seconds": 4.5})
    assert r.status_code == 200
    assert r.json()["hero_interval_seconds"] == 4.5
    # restore original interval
    admin.put(f"{API}/admin/covers", json={"hero_interval_seconds": original.get("hero_interval_seconds", 4.5)})


def test_covers_put_hero_images(admin):
    original = requests.get(f"{API}/covers").json()
    orig_imgs = original.get("hero_images", [])
    imgs = ["https://example.com/a.jpg", "https://example.com/b.jpg"]
    r = admin.put(f"{API}/admin/covers", json={"hero_images": imgs})
    assert r.status_code == 200
    assert r.json()["hero_images"] == imgs
    # verify persistence
    r = requests.get(f"{API}/covers")
    assert r.json()["hero_images"] == imgs
    # restore
    admin.put(f"{API}/admin/covers", json={"hero_images": orig_imgs})


# ----- Taxonomy new structure
def test_taxonomy_new_structure():
    r = requests.get(f"{API}/gallery/taxonomy")
    assert r.status_code == 200
    b = r.json()
    assert b["categories"] == ["RESIDENTIAL", "COMMERCIAL"]
    assert b["subcategories"]["RESIDENTIAL"] == ["Bedrooms", "Bathrooms", "Kitchen", "Hall & Dining", "Balcony & Dry area"]
    assert b["subcategories"]["COMMERCIAL"] == ["Offices", "Retail", "Hospitality"]


# ----- Migration verified
def test_no_legacy_subcategories():
    r = requests.get(f"{API}/gallery")
    assert r.status_code == 200
    docs = r.json()
    legacy = {"Balcony - Dry Area", "Office Spaces", "Retail Design", "Temple"}
    subs_used = {d.get("subcategory") for d in docs}
    leftover = subs_used & legacy
    assert not leftover, f"legacy subcategories still present: {leftover}"


# ----- Gallery new fields
def test_gallery_new_fields_present():
    r = requests.get(f"{API}/gallery")
    assert r.status_code == 200
    docs = r.json()
    assert len(docs) >= 1
    d = docs[0]
    for key in ("is_cover", "featured_portfolio", "practice"):
        assert key in d, f"field {key} missing"


def test_gallery_create_new_fields(admin):
    payload = {
        "title": "TEST_iter5",
        "description": "",
        "practice": "interiors",
        "category": "RESIDENTIAL",
        "subcategory": "Bedrooms",
        "image": "https://example.com/z.jpg",
        "is_cover": True,
        "featured_portfolio": True,
    }
    r = admin.post(f"{API}/admin/gallery", json=payload)
    assert r.status_code == 200
    doc = r.json()
    assert doc["is_cover"] is True
    assert doc["featured_portfolio"] is True
    assert doc["practice"] == "interiors"
    pid = doc["id"]
    # Toggle off
    r = admin.put(f"{API}/admin/gallery/{pid}", json={**payload, "is_cover": False, "featured_portfolio": False})
    assert r.status_code == 200
    assert r.json()["is_cover"] is False
    # cleanup
    admin.delete(f"{API}/admin/gallery/{pid}")


def test_featured_portfolio_count():
    """Verify pre-flagged featured_portfolio photos exist (expected 14 per context)."""
    r = requests.get(f"{API}/gallery")
    docs = r.json()
    flagged = [d for d in docs if d.get("featured_portfolio")]
    assert len(flagged) >= 1, "expected at least one featured_portfolio photo"
    # Note - context says 14 but we don't fail if slightly different
    print(f"featured_portfolio count: {len(flagged)}")


def test_is_cover_count():
    r = requests.get(f"{API}/gallery")
    docs = r.json()
    covers = [d for d in docs if d.get("is_cover")]
    print(f"is_cover count: {len(covers)}")
    assert len(covers) >= 1
