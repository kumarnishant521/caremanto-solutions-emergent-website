"""
Caremanto — on-the-fly media transcoding.

`/api/files/{path}` uses these helpers to serve the smallest format the
browser can decode:

  * AVIF ≈ 50 % smaller than JPEG at visually-identical quality
  * WebP ≈ 30 % smaller than JPEG
  * The original file (JPEG/PNG) is served as a safe fallback

Behaviour
---------
* Transcoded artefacts are cached on-disk at `MEDIA_CACHE_DIR` keyed by a
  sha-1 of `path` + target format. First request pays the ~200 ms encode
  cost; every subsequent request is served from disk in a single sendfile.
* Browsers that don't advertise `image/webp` or `image/avif` in their
  Accept header get the raw stream unchanged — nothing is broken for old
  clients.
* Non-image content (videos, PDFs) always passes through untouched.

Videos
------
`ensure_video_transcoded()` invokes ffmpeg to produce an H.265 / HEVC MP4
sibling of any uploaded video. This is called once on upload; requests to
the transcoded copy hit the same `/api/files/` proxy and are cached
forever.
"""

from __future__ import annotations

import asyncio
import hashlib
import io
import logging
import os
import shutil
import subprocess
from pathlib import Path
from typing import Optional, Tuple

from PIL import Image, ImageFile

# Some studio uploads are progressively-encoded JPEGs — allow Pillow to load
# them even if the byte stream is briefly truncated during network reads.
ImageFile.LOAD_TRUNCATED_IMAGES = True

logger = logging.getLogger(__name__)

# --- cache location (persistent under /app so it survives pod restarts) --

MEDIA_CACHE_DIR = Path(os.environ.get(
    "MEDIA_CACHE_DIR",
    "/app/backend/.media_cache"
)).resolve()
MEDIA_CACHE_DIR.mkdir(parents=True, exist_ok=True)


# --- format negotiation --------------------------------------------------

_IMAGE_MIMES = {"image/jpeg", "image/jpg", "image/png", "image/webp", "image/avif"}
_TRANSCODABLE_MIMES = {"image/jpeg", "image/jpg", "image/png"}


def negotiate_image_format(accept: str) -> Optional[str]:
    """
    Return the best target format for the given HTTP `Accept` header.

    * "avif"  — browser explicitly says it supports AVIF (Chrome, Firefox,
                Safari 16+).
    * "webp"  — browser supports WebP but not AVIF (older Safari, Edge < 90).
    * None    — no modern format supported; serve the original.
    """
    if not accept:
        return None
    a = accept.lower()
    if "image/avif" in a:
        return "avif"
    if "image/webp" in a:
        return "webp"
    return None


def is_transcodable_image(content_type: str) -> bool:
    return (content_type or "").split(";")[0].strip().lower() in _TRANSCODABLE_MIMES


# --- cache primitives ----------------------------------------------------

def _cache_key(path: str, fmt: str) -> Path:
    h = hashlib.sha1(path.encode("utf-8")).hexdigest()
    return MEDIA_CACHE_DIR / f"{h}.{fmt}"


def cached_bytes(path: str, fmt: str) -> Optional[bytes]:
    p = _cache_key(path, fmt)
    if p.exists() and p.stat().st_size > 0:
        try:
            return p.read_bytes()
        except Exception:
            return None
    return None


def write_cache(path: str, fmt: str, data: bytes) -> None:
    p = _cache_key(path, fmt)
    tmp = p.with_suffix(p.suffix + ".tmp")
    try:
        tmp.write_bytes(data)
        tmp.replace(p)
    except Exception as e:
        logger.warning(f"media cache write failed for {path} → {fmt}: {e}")


# --- image transcoding ---------------------------------------------------

_MIME_FOR = {"avif": "image/avif", "webp": "image/webp"}
_QUALITY  = {"avif": 60, "webp": 75}


def transcode_image_bytes(raw: bytes, target: str) -> Tuple[bytes, str]:
    """
    Encode `raw` (JPEG/PNG bytes) into `target` ("avif" or "webp") and
    return `(encoded_bytes, mime_type)`.

    Raises on any Pillow error — caller decides whether to fall back.
    """
    if target not in _MIME_FOR:
        raise ValueError(f"unsupported target format: {target}")

    with Image.open(io.BytesIO(raw)) as img:
        # Normalise mode to something the encoder likes; AVIF prefers RGB(A).
        if img.mode not in ("RGB", "RGBA"):
            img = img.convert("RGBA" if "A" in img.mode else "RGB")

        buf = io.BytesIO()
        if target == "webp":
            img.save(
                buf, format="WEBP",
                quality=_QUALITY["webp"],
                method=4,        # 0=fastest, 6=slowest — 4 is the sweet spot
            )
        elif target == "avif":
            img.save(
                buf, format="AVIF",
                quality=_QUALITY["avif"],
                speed=6,         # 0=slow, 10=fast — 6 keeps encode under 200 ms
            )
    return buf.getvalue(), _MIME_FOR[target]


def maybe_transcoded_bytes(
    path: str,
    raw: bytes,
    content_type: str,
    accept_header: str,
) -> Optional[Tuple[bytes, str, str]]:
    """
    High-level façade used by `/api/files/{path}`.

    Returns `(bytes, mime, "avif"|"webp")` if a smaller version was produced
    or cached; `None` if the request should fall back to the raw stream.
    """
    if not is_transcodable_image(content_type):
        return None
    target = negotiate_image_format(accept_header)
    if not target:
        return None

    # 1) cache hit
    cached = cached_bytes(path, target)
    if cached is not None:
        return cached, _MIME_FOR[target], target

    # 2) encode & cache
    try:
        data, mime = transcode_image_bytes(raw, target)
    except Exception as e:
        logger.warning(f"transcode failed for {path} → {target}: {e}")
        return None
    write_cache(path, target, data)
    return data, mime, target


# --- video (H.265) -------------------------------------------------------

def ffmpeg_available() -> bool:
    return shutil.which("ffmpeg") is not None


def transcode_video_h265(src_path: str, dst_path: str, max_bitrate_kbps: int = 2500) -> bool:
    """
    Produce an H.265 / HEVC MP4 sibling at `dst_path` capped at
    `max_bitrate_kbps`. Returns True on success.

    Runs synchronously — call inside `asyncio.to_thread` from an async
    context so we don't block the event loop.
    """
    if not ffmpeg_available():
        logger.info("ffmpeg not on PATH — skipping H.265 transcode")
        return False

    cmd = [
        "ffmpeg", "-y",
        "-i", src_path,
        "-c:v", "libx265",
        "-preset", "medium",
        "-crf", "28",
        "-tag:v", "hvc1",              # broad Safari / iOS compatibility
        "-b:v", f"{max_bitrate_kbps}k",
        "-maxrate", f"{max_bitrate_kbps}k",
        "-bufsize", f"{max_bitrate_kbps * 2}k",
        "-c:a", "aac", "-b:a", "128k",
        "-movflags", "+faststart",     # progressive playback
        "-loglevel", "error",
        dst_path,
    ]
    try:
        subprocess.run(cmd, check=True, capture_output=True, timeout=600)
        return True
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired) as e:
        logger.error(f"ffmpeg failure for {src_path}: {getattr(e, 'stderr', b'')!r}")
        try: os.remove(dst_path)
        except OSError: pass
        return False


async def transcode_video_h265_async(src_path: str, dst_path: str, max_bitrate_kbps: int = 2500) -> bool:
    """Async wrapper — offload the ffmpeg subprocess to a worker thread."""
    return await asyncio.to_thread(
        transcode_video_h265, src_path, dst_path, max_bitrate_kbps
    )
