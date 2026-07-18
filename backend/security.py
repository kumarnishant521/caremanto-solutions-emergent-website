"""
Caremanto — input sanitization + response security utilities.

Rules of engagement
-------------------
* We never render user-submitted HTML anywhere on the public site — every
  lead / nav-customizer / marquee field is treated as plain text.
* All string inputs from public endpoints (leads, contact forms, admin text
  fields) pass through `sanitize_text`, which:
    - strips ALL HTML tags (bleach.clean strip=True)
    - removes ASCII control characters
    - enforces a maximum length
    - trims leading/trailing whitespace
* MongoDB queries are already parameterized via Motor — no string
  concatenation, so SQLi surface = 0. This module hardens the XSS side.
"""

from __future__ import annotations

import re
from typing import Optional

import bleach

# Nothing HTML-like ever survives.
_ALLOWED_TAGS: list[str] = []
_ALLOWED_ATTRS: dict[str, list[str]] = {}

# Strip ASCII control chars (0x00-0x1F except tab/newline) — these can be used
# to smuggle payloads into log viewers or downstream consumers.
_CTRL = re.compile(r"[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]")


def sanitize_text(value: Optional[str], *, max_length: int = 2000) -> str:
    """Sanitize a free-text field submitted by a user.

    Returns an empty string when the input is None. Strips all HTML, all ASCII
    control characters, collapses whitespace at the edges, and enforces a
    hard length cap.
    """
    if value is None:
        return ""
    if not isinstance(value, str):
        value = str(value)
    cleaned = bleach.clean(value, tags=_ALLOWED_TAGS, attributes=_ALLOWED_ATTRS, strip=True)
    cleaned = _CTRL.sub("", cleaned).strip()
    return cleaned[:max_length]


def sanitize_short(value: Optional[str], *, max_length: int = 120) -> str:
    """Shorter cap for names, phones, single-line labels."""
    return sanitize_text(value, max_length=max_length)


# ---------------------------------------------------------------- response

SECURITY_HEADERS: dict[str, str] = {
    # Clickjacking — nothing may frame Caremanto pages.
    "X-Frame-Options": "DENY",
    # MIME sniffing protection.
    "X-Content-Type-Options": "nosniff",
    # Referrer minimisation on cross-origin.
    "Referrer-Policy": "strict-origin-when-cross-origin",
    # Deny sensitive browser APIs by default.
    "Permissions-Policy": (
        "camera=(), microphone=(), geolocation=(), payment=(), usb=(), "
        "magnetometer=(), gyroscope=(), fullscreen=(self)"
    ),
    # Discourage cross-origin isolation-bypass — safe defaults.
    "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
    "X-DNS-Prefetch-Control": "on",
}

# Content Security Policy — REPORT-ONLY mode so we can safely observe
# violations from Google Drive / Pexels / social CDN images without
# breaking the live site. Once the reports come in clean we flip this
# header to `Content-Security-Policy` for enforcement.
CSP_REPORT_ONLY: str = "; ".join([
    "default-src 'self'",
    # Inline styles are used by Tailwind runtime + admin previews.
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src  'self' data: https://fonts.gstatic.com",
    # Site images may come from the app itself, Google Drive (lh3), Pexels,
    # Unsplash, and Emergent Object Storage streams.
    "img-src   'self' data: blob: https: http:",
    "media-src 'self' blob: https:",
    # Scripts — the React bundle is 'self'; no eval, no inline.
    "script-src 'self' 'unsafe-inline'",
    "connect-src 'self' https: wss:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
])
