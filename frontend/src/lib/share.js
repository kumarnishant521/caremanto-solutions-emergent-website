/**
 * Turn a Google-usercontent Drive URL like:
 *   https://lh3.googleusercontent.com/d/<ID>=w1600
 * into a stable direct-view URL every social platform can unfurl:
 *   https://drive.google.com/uc?export=view&id=<ID>
 *
 * Local /api/uploads/<file> URLs are returned as absolute site URLs so a
 * paste of the URL shows an image preview.
 */
export function toShareableImageUrl(raw) {
  if (!raw) return "";
  try {
    // googleusercontent hosted (Drive)
    const m = raw.match(/googleusercontent\.com\/d\/([^=/?]+)/);
    if (m) return `https://drive.google.com/uc?export=view&id=${m[1]}`;
  } catch { /* ignore */ }

  // Local uploads
  if (raw.startsWith("/")) {
    if (typeof window !== "undefined") return `${window.location.origin}${raw}`;
    return raw;
  }
  return raw;
}

/**
 * Share a photo as a rich pin.
 * - Mobile / capable browsers: uses the native Web Share API so the OS pin
 *   sheet appears (WhatsApp / Instagram DM / X / LinkedIn all show a
 *   large-image preview because the URL is a direct image resource).
 * - Desktop / unsupported browsers: copies the shareable URL to the
 *   clipboard so the studio can paste it anywhere.
 *
 * Returns a small status string describing what happened.
 */
export async function sharePhoto(photo) {
  const url = toShareableImageUrl(photo.image);
  const title = photo.title || photo.subcategory || "Caremanto Solutions";
  const text = `${title} — Caremanto Solutions`;

  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return "shared";
    } catch (e) {
      // user dismissed OR share failed → fall through to clipboard
      if (e && e.name === "AbortError") return "cancelled";
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    return "copied";
  } catch {
    return "unsupported";
  }
}
