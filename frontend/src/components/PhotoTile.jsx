import { useEffect, useState } from "react";

/**
 * PhotoTile — a resilient <img> wrapper used inside the gallery masonry.
 *
 * On decode error the browser normally renders a broken-image icon and
 * the surrounding column collapses. Instead we swap to a muted Apple-neutral
 * `bg-[#EAE8E3]` block with `animate-pulse` so the failed card holds its
 * space and every neighbour stays put. Successfully-loaded photos are
 * completely unaffected.
 *
 * Preserves the strict zero-crop rule — the real <img> uses `object-fit:
 * contain` styles (see `.portfolio-item-card img` in index.css). The
 * fallback placeholder sits INSIDE the same wrapper so masonry heights
 * never shrink mid-fetch.
 */
export default function PhotoTile({ src, alt, priority = false }) {
  const [failed, setFailed] = useState(false);
  // Reset failure state whenever the underlying source changes so a
  // retry on a new URL isn't blocked by a prior 404.
  useEffect(() => { setFailed(false); }, [src]);

  if (failed) {
    return (
      <div
        data-testid="photo-tile-error"
        role="img"
        aria-label="Image unavailable"
        className="w-full animate-pulse"
        style={{
          background: "#EAE8E3",
          aspectRatio: "3 / 4",   // stable slot height while the neighbour photos remain
          minHeight: "220px",
        }}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
      onError={() => setFailed(true)}
      style={{
        width: "100%",
        height: "auto",
        objectFit: "contain",
        display: "block",
        background: "var(--bg-2)",
      }}
    />
  );
}
