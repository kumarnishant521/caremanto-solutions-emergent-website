"""
Emergent Object Storage helper.

Wraps the managed object-store HTTPS API so the studio can upload images and
videos of any size without local disk fill-up or memory spikes. Files upload
straight from a temp file on disk (streaming), and are then served back to
the browser through `/api/files/<path>` in server.py.

Fail-open: if the storage service is unreachable at boot, `init_storage()`
will retry lazily on first upload — the site never crashes on init.
"""
from __future__ import annotations
import logging
import os
from pathlib import Path
from typing import Optional, Tuple

import requests

logger = logging.getLogger(__name__)

STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
APP_NAME = "caremanto"                                        # bucket-prefix
EMERGENT_LLM_KEY: Optional[str] = os.environ.get("EMERGENT_LLM_KEY")

_storage_key: Optional[str] = None


def init_storage(force: bool = False) -> Optional[str]:
    """Fetch a session-scoped storage key. Retries lazily on any failure."""
    global _storage_key
    if _storage_key and not force:
        return _storage_key
    if not EMERGENT_LLM_KEY:
        logger.warning("EMERGENT_LLM_KEY not set — object storage disabled.")
        return None
    try:
        resp = requests.post(
            f"{STORAGE_URL}/init",
            json={"emergent_key": EMERGENT_LLM_KEY},
            timeout=30,
        )
        resp.raise_for_status()
        _storage_key = resp.json()["storage_key"]
        logger.info("Emergent object storage initialized.")
        return _storage_key
    except Exception as e:
        logger.error(f"Object storage init failed: {e}")
        _storage_key = None
        return None


def put_object_from_file(path: str, file_path: Path, content_type: str) -> dict:
    """Stream a file from disk to Emergent object storage using requests.
    The `requests` library will stream the file handle in chunks so RAM stays
    flat regardless of file size.
    """
    key = init_storage()
    if not key:
        raise RuntimeError("Object storage unavailable — EMERGENT_LLM_KEY missing or init failed.")
    with open(file_path, "rb") as fh:
        for attempt in range(2):     # one retry on stale key
            resp = requests.put(
                f"{STORAGE_URL}/objects/{path}",
                headers={"X-Storage-Key": key, "Content-Type": content_type},
                data=fh,
                timeout=(30, 60 * 30),   # (connect, read) — allow big videos
            )
            if resp.status_code == 403 and attempt == 0:
                # Stale session key — refresh and retry once.
                key = init_storage(force=True)
                fh.seek(0)
                continue
            resp.raise_for_status()
            return resp.json()
    raise RuntimeError("Failed to upload to object storage.")


def get_object(path: str) -> Tuple[bytes, str]:
    """Download from storage. Returns (bytes, content-type)."""
    key = init_storage()
    if not key:
        raise RuntimeError("Object storage unavailable.")
    for attempt in range(2):
        resp = requests.get(
            f"{STORAGE_URL}/objects/{path}",
            headers={"X-Storage-Key": key},
            timeout=(30, 120),
        )
        if resp.status_code == 403 and attempt == 0:
            key = init_storage(force=True)
            continue
        resp.raise_for_status()
        return resp.content, resp.headers.get("Content-Type", "application/octet-stream")
    raise RuntimeError("Failed to download from object storage.")


def get_object_stream(path: str) -> Tuple[requests.Response, str]:
    """Streaming download — returns the raw Response so the caller can iterate
    over chunks and forward them to the client without buffering the whole
    file in memory (essential for multi-GB videos).
    """
    key = init_storage()
    if not key:
        raise RuntimeError("Object storage unavailable.")
    resp = requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key},
        timeout=(30, 60 * 30),
        stream=True,
    )
    if resp.status_code == 403:
        # Refresh and retry once
        init_storage(force=True)
        resp = requests.get(
            f"{STORAGE_URL}/objects/{path}",
            headers={"X-Storage-Key": _storage_key},
            timeout=(30, 60 * 30),
            stream=True,
        )
    resp.raise_for_status()
    return resp, resp.headers.get("Content-Type", "application/octet-stream")
