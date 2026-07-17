"""Iteration 6: Gallery taxonomy restructure (3 top categories) tests."""
import os
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # fallback to reading frontend .env
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")

EXPECTED_CATS = ["RESIDENTIAL", "COMMERCIAL", "RESTORATION & RENOVATIONS"]
EXPECTED_SUBS = {
    "RESIDENTIAL": ["Hall & Dining", "Bedrooms", "Bathrooms", "Kitchens", "Balcony / Dry Area / Temple"],
    "COMMERCIAL":  ["Office spaces", "Retail Design", "Hospitality"],
    "RESTORATION & RENOVATIONS": [],
}
OLD_SUBS = {"Kitchen", "Balcony & Dry area", "Offices", "Retail", "Office Spaces", "Balcony - Dry Area", "Temple"}


def test_taxonomy_endpoint():
    r = requests.get(f"{BASE_URL}/api/gallery/taxonomy", timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert data["categories"] == EXPECTED_CATS, f"Got categories={data['categories']}"
    for k, v in EXPECTED_SUBS.items():
        assert data["subcategories"].get(k) == v, f"subcategory mismatch for {k}: {data['subcategories'].get(k)}"


def test_legacy_migration_no_old_subs():
    r = requests.get(f"{BASE_URL}/api/gallery", timeout=15)
    assert r.status_code == 200
    photos = r.json()
    print(f"Total photos: {len(photos)}")
    bad = [p for p in photos if p.get("subcategory") in OLD_SUBS]
    assert not bad, f"Legacy sub names still present in {len(bad)} photos: {[(p.get('id'), p.get('subcategory')) for p in bad[:5]]}"


def test_legacy_restoration_practice_migrated():
    r = requests.get(f"{BASE_URL}/api/gallery", timeout=15)
    photos = r.json()
    stragglers = [p for p in photos if p.get("practice") == "restoration" and p.get("category") != "RESTORATION & RENOVATIONS"]
    assert not stragglers, f"Legacy practice=restoration not migrated: {stragglers[:3]}"


def _admin_session():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/passless-login", timeout=15)
    assert r.status_code == 200, f"passless-login failed: {r.status_code} {r.text}"
    return s


def test_restoration_ingest_no_sub_required():
    s = _admin_session()
    payload = {
        "title": "TEST_ITER6 Restoration",
        "image": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c",
        "category": "RESTORATION & RENOVATIONS",
        "subcategory": "",
    }
    r = s.post(f"{BASE_URL}/api/admin/gallery", json=payload, timeout=15)
    assert r.status_code == 200, f"POST failed: {r.status_code} {r.text}"
    created = r.json()
    photo_id = created.get("id")
    assert photo_id
    assert created.get("category") == "RESTORATION & RENOVATIONS"
    assert created.get("subcategory") in ("", None)

    # Filter test
    r2 = requests.get(f"{BASE_URL}/api/gallery", params={"category": "RESTORATION & RENOVATIONS"}, timeout=15)
    assert r2.status_code == 200
    items = r2.json()
    assert all(p.get("category") == "RESTORATION & RENOVATIONS" for p in items), "Filter returned non-restoration items"
    assert any(p.get("id") == photo_id for p in items), "Newly created restoration item not in filtered list"

    # Cleanup
    d = s.delete(f"{BASE_URL}/api/admin/gallery/{photo_id}", timeout=15)
    assert d.status_code in (200, 204)


def test_all_photos_have_valid_taxonomy():
    r = requests.get(f"{BASE_URL}/api/gallery", timeout=15)
    photos = r.json()
    for p in photos:
        cat = p.get("category")
        sub = p.get("subcategory") or ""
        # allow legacy uncategorized? require category valid
        if cat not in EXPECTED_CATS:
            # Some might still be legacy — flag but not fail hard? Let's fail.
            pytest.fail(f"Photo {p.get('id')} has invalid category '{cat}'")
        allowed_subs = EXPECTED_SUBS[cat]
        if cat == "RESTORATION & RENOVATIONS":
            assert sub == "", f"Restoration photo {p.get('id')} has sub='{sub}' (expected empty)"
        else:
            assert sub in allowed_subs or sub == "", f"Photo {p.get('id')} in {cat} has invalid sub '{sub}'"
