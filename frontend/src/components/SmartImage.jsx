import { useEffect, useRef, useState } from "react";
import { thumbUrl } from "../lib/thumb";

/**
 * SmartImage — resilient image element for the public site.
 *
 * - Rewrites Google-Drive URLs to a smaller `=w<size>` variant so grid/card
 *   thumbnails are lightweight (full-res is fetched only when a photo is
 *   opened in the lightbox).
 * - Uses native `loading="lazy"` + `decoding="async"` so nothing off-screen
 *   ever blocks rendering.
 * - Handles broken image URLs gracefully — never shows the browser's default
 *   "?" placeholder. Falls back to a subtle "coming soon" tone card.
 * - Locks the container's aspect-ratio so layout shift is eliminated during
 *   the fetch, and so a failed image doesn't collapse the surrounding grid.
 * - Handles the browser-cache race where an <img> can `complete` BEFORE
 *   React attaches the onLoad handler — checks `img.complete` on mount so
 *   fast/cached images never get stuck at opacity 0.
 */
export default function SmartImage({
  src,
  alt = "",
  width = 800,               // requested thumbnail width — used for Drive rewrite
  aspect = "4/5",            // CSS aspect-ratio for the container
  className = "",
  imgClassName = "",
  eager = false,             // set true for above-the-fold hero-adjacent images
  onLoadedChange,
  fallbackText = "Coming soon",
}) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => { setFailed(false); setLoaded(false); }, [src]);
  useEffect(() => { if (onLoadedChange) onLoadedChange(loaded); }, [loaded, onLoadedChange]);

  // Race-condition guard: if the browser has already finished loading this
  // image before React attaches `onLoad` (very common for cached assets or
  // when the img is created client-side after HTTP cache is warm), the
  // handler will never fire and the fade-in state stays at opacity-0
  // forever. Check `complete` on mount + after src changes.
  useEffect(() => {
    const el = imgRef.current;
    if (!el) return;
    if (el.complete && el.naturalWidth > 0) setLoaded(true);
    else if (el.complete && el.naturalWidth === 0) setFailed(true);
  }, [src]);

  const finalSrc = thumbUrl(src, width);

  return (
    <div
      className={`relative overflow-hidden bg-[var(--bg-1)] ${className}`}
      style={{ aspectRatio: aspect }}
    >
      {/* Blur-up skeleton — a soft pulsing neutral tone that stays visible
          until the image reports `onLoad`. Prevents the "broken card"
          glitch that happens when a cover URL 404s or takes a moment to
          resolve from cold-start object storage. */}
      {!loaded && !failed && finalSrc && (
        <div
          aria-hidden="true"
          className="absolute inset-0 smartimg-skeleton"
        />
      )}
      {!failed && finalSrc ? (
        <img
          ref={imgRef}
          src={finalSrc}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={eager ? "high" : "low"}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"} ${imgClassName}`}
        />
      ) : null}
      {(failed || !finalSrc) && (
        <div className="absolute inset-0 flex items-center justify-center text-[10px] tracking-[0.28em] uppercase text-[var(--muted)] bg-[var(--bg-2)]">
          {fallbackText}
        </div>
      )}
    </div>
  );
}
