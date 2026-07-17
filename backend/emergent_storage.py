"""
Emergent Object Storage helper — fully async version.

Uses httpx.AsyncClient so a burst of concurrent uploads doesn't starve the
FastAPI worker thread pool. Adds retry-with-backoff on transient 5xx errors
so a momentary edge hiccup doesn't cause the whole upload to fail.
"""
from __future__ import annotations
import asyncio
import logging
import os
from pathlib import Path
from typing import Optional, Tuple

import httpx

logger = logging.getLogger(__name__)

STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
APP_NAME = "caremanto"
EMERGENT_LLM_KEY: Optional[str] = os.environ.get("EMERGENT_LLM_KEY")

_storage_key: Optional[str] = None
_init_lock = asyncio.Lock()


async def init_storage(force: bool = False) -> Optional[str]:
    """Fetch a session-scoped storage key. Lazy-retries on failure."""
    global _storage_key
    if _storage_key and not force:
        return _storage_key
    if not EMERGENT_LLM_KEY:
        logger.warning("EMERGENT_LLM_KEY not set — object storage disabled.")
        return None
    async with _init_lock:
        if _storage_key and not force:
            return _storage_key
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.post(
                    f"{STORAGE_URL}/init",
                    json={"emergent_key": EMERGENT_LLM_KEY},
                )
                resp.raise_for_status()
                _storage_key = resp.json()["storage_key"]
                logger.info("Emergent object storage initialized.")
                return _storage_key
        except Exception as e:
            logger.error(f"Object storage init failed: {e}")
            _storage_key = None
            return None


async def _read_file_async(file_path: Path):
    """Async generator that yields chunks of a local file (1 MB blocks)."""
    loop = asyncio.get_running_loop()
    CHUNK = 1024 * 1024
    with open(file_path, "rb") as fh:
        while True:
            chunk = await loop.run_in_executor(None, fh.read, CHUNK)
            if not chunk:
                break
            yield chunk


async def put_object_from_file(path: str, file_path: Path, content_type: str) -> dict:
    """Upload a file to Emergent object storage. Reads the file bytes and
    sends them with a proper Content-Length header (chunked transfer encoding
    is not supported by the upstream). Retries up to 3 times on transient
    5xx errors with exponential backoff. Session-key refresh on 403.
    """
    key = await init_storage()
    if not key:
        raise RuntimeError("Object storage unavailable — EMERGENT_LLM_KEY missing or init failed.")

    # Read the file bytes off the event-loop thread so we don't block.
    loop = asyncio.get_running_loop()
    data: bytes = await loop.run_in_executor(None, file_path.read_bytes)

    last_exc = None
    for attempt in range(3):
        try:
            timeout = httpx.Timeout(connect=30.0, read=60 * 30, write=60 * 30, pool=None)
            async with httpx.AsyncClient(timeout=timeout) as client:
                resp = await client.put(
                    f"{STORAGE_URL}/objects/{path}",
                    headers={"X-Storage-Key": key, "Content-Type": content_type},
                    content=data,
                )
                if resp.status_code == 403:
                    key = await init_storage(force=True)
                    continue
                if resp.status_code >= 500:
                    raise httpx.HTTPStatusError(
                        f"Upstream {resp.status_code}",
                        request=resp.request, response=resp,
                    )
                resp.raise_for_status()
                return resp.json()
        except Exception as e:
            last_exc = e
            backoff = min(4.0, 0.5 * (2 ** attempt))
            logger.warning(f"Object storage PUT attempt {attempt + 1} failed: {e}. Retrying in {backoff}s.")
            await asyncio.sleep(backoff)

    raise RuntimeError(f"Failed to upload to object storage after 3 attempts: {last_exc}")


async def get_object_stream(path: str) -> Tuple[httpx.Response, str]:
    """Streaming download — returns an open httpx response so the caller can
    async-iterate over chunks and forward them to the client.
    NOTE: The returned response MUST be closed by the caller (await resp.aclose()).
    """
    key = await init_storage()
    if not key:
        raise RuntimeError("Object storage unavailable.")

    client = httpx.AsyncClient(timeout=httpx.Timeout(connect=30, read=60 * 30, write=30, pool=None))
    try:
        for attempt in range(2):
            req = client.build_request(
                "GET",
                f"{STORAGE_URL}/objects/{path}",
                headers={"X-Storage-Key": key},
            )
            resp = await client.send(req, stream=True)
            if resp.status_code == 403 and attempt == 0:
                await resp.aclose()
                key = await init_storage(force=True)
                continue
            resp.raise_for_status()
            content_type = resp.headers.get("Content-Type", "application/octet-stream")
            # Attach the client to the response object so caller can close both
            resp._caremanto_client = client   # type: ignore[attr-defined]
            return resp, content_type
        raise RuntimeError("Auth refresh loop exceeded")
    except Exception:
        await client.aclose()
        raise
