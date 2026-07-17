/**
 * Return a smaller thumbnail URL for admin previews so the dashboard loads
 * fast even with hundreds of photographs.
 *
 * - Google Drive `lh3.googleusercontent.com/d/<ID>=w1600` → rewrites to `=w<size>`
 * - Anything else is returned unchanged (real thumbnail generation would
 *   require an image-processing worker on the server).
 */
export function thumbUrl(url, size = 400) {
  if (!url) return "";
  if (typeof url !== "string") return url;
  const m = url.match(/^(https:\/\/lh3\.googleusercontent\.com\/d\/[^=]+)=/);
  if (m) return `${m[1]}=w${size}`;
  return url;
}
