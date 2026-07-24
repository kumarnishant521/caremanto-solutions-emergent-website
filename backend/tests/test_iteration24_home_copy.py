"""Iteration 24 — home_copy backend tests."""
import os
import copy
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")


@pytest.fixture(scope="module")
def admin_session():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/passless-login", timeout=30)
    assert r.status_code == 200, r.text
    tok = r.json().get("access_token") or r.json().get("token")
    if tok:
        s.headers.update({"Authorization": f"Bearer {tok}"})
    return s


# --- GET /api/seo returns home_copy with defaults ---
def test_seo_returns_home_copy_defaults():
    r = requests.get(f"{BASE_URL}/api/seo", timeout=30)
    assert r.status_code == 200
    data = r.json()
    assert "home_copy" in data
    hc = data["home_copy"]
    for blk in ("hero", "divisions", "sections"):
        assert blk in hc, f"missing block {blk}"
    # hero fields
    hero = hc["hero"]
    for k in ("line1", "accent", "subhead", "cta_primary",
              "chip_1_label", "chip_2_label", "chip_3_label", "chip_4_label"):
        assert k in hero and isinstance(hero[k], str) and hero[k], f"hero.{k} missing/empty"
    # divisions & sections field presence
    assert "title" in hc["divisions"]
    assert "gallery_title" in hc["sections"]
    assert "cta_band_button" in hc["sections"]


# --- PUT partial home_copy updates single field, preserves others ---
def test_put_home_copy_partial_update(admin_session):
    original = requests.get(f"{BASE_URL}/api/seo", timeout=30).json()
    orig_hc = copy.deepcopy(original["home_copy"])

    new_line1 = "Reimagining"
    payload = {"home_copy": {"hero": {"line1": new_line1}}}
    r = admin_session.put(f"{BASE_URL}/api/admin/seo", json=payload, timeout=30)
    assert r.status_code == 200, r.text

    after = requests.get(f"{BASE_URL}/api/seo", timeout=30).json()
    assert after["home_copy"]["hero"]["line1"] == new_line1
    # other hero fields unchanged
    for k in ("accent", "subhead", "cta_primary",
              "chip_1_label", "chip_2_label", "chip_3_label", "chip_4_label"):
        assert after["home_copy"]["hero"][k] == orig_hc["hero"][k], f"hero.{k} mutated unexpectedly"
    # other blocks unchanged
    assert after["home_copy"]["divisions"] == orig_hc["divisions"]
    assert after["home_copy"]["sections"] == orig_hc["sections"]
    # sections/footer/nav preserved
    assert after["sections"] == original["sections"]
    assert after["footer"] == original["footer"]
    assert after["nav"] == original["nav"]

    # cleanup restore
    admin_session.put(f"{BASE_URL}/api/admin/seo",
                      json={"home_copy": {"hero": {"line1": orig_hc["hero"]["line1"]}}},
                      timeout=30)


# --- Empty strings do NOT overwrite defaults ---
def test_empty_home_copy_string_ignored(admin_session):
    original = requests.get(f"{BASE_URL}/api/seo", timeout=30).json()
    orig_accent = original["home_copy"]["hero"]["accent"]

    r = admin_session.put(f"{BASE_URL}/api/admin/seo",
                          json={"home_copy": {"hero": {"accent": "   "}}}, timeout=30)
    assert r.status_code == 200
    after = requests.get(f"{BASE_URL}/api/seo", timeout=30).json()
    assert after["home_copy"]["hero"]["accent"] == orig_accent, "Empty/whitespace overwrote default"


# --- Regression: existing SEO PUT still works ---
def test_seo_footer_regression(admin_session):
    original = requests.get(f"{BASE_URL}/api/seo", timeout=30).json()
    orig_footer_line = original["footer"].get("tagline") or original["footer"].get("copyright") or ""
    # Pick any string key from footer
    key = None
    for k, v in original["footer"].items():
        if isinstance(v, str) and v:
            key = k
            break
    assert key
    new_val = "TEST_footer_iter24"
    r = admin_session.put(f"{BASE_URL}/api/admin/seo", json={"footer": {key: new_val}}, timeout=30)
    assert r.status_code == 200
    after = requests.get(f"{BASE_URL}/api/seo", timeout=30).json()
    assert after["footer"][key] == new_val
    # restore
    admin_session.put(f"{BASE_URL}/api/admin/seo",
                      json={"footer": {key: original["footer"][key]}}, timeout=30)


# --- Gallery CRUD sanity ---
def test_gallery_crud_and_alt(admin_session):
    payload = {"folder": "TEST_iter24", "category": "TEST_iter24", "image": "https://example.com/test.jpg", "src": "https://example.com/test.jpg", "title": "TEST photo iter24"}
    r = admin_session.post(f"{BASE_URL}/api/admin/gallery", json=payload, timeout=30)
    assert r.status_code in (200, 201), r.text
    created = r.json()
    pid = created.get("id") or created.get("_id")
    assert pid
    # auto alt
    assert created.get("alt_text")
    # list
    r = requests.get(f"{BASE_URL}/api/gallery", timeout=30)
    assert r.status_code == 200
    # delete
    r = admin_session.delete(f"{BASE_URL}/api/admin/gallery/{pid}", timeout=30)
    assert r.status_code in (200, 204)


# --- Passless login returns cookie ---
def test_passless_login_cookie():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/passless-login", timeout=30)
    assert r.status_code == 200
    # cookie set
    assert any(c.name == "access_token" for c in s.cookies), f"no access_token cookie; got {s.cookies}"
