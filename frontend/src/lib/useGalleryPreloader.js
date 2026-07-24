import { useEffect } from "react";
import { thumbUrl } from "./thumb";
import { prefetchImageUrls } from "./useGallery";

/**
 * useGalleryPreloader — background asset preloading queue.
 *
 * Given a paginated photo list and the currently-active page, this hook
 * warms Page N-1 and Page N+1 image URLs into the browser cache via
 * `new Image()` instances. When the user hits Next or Prev, the assets
 * are already decoded — zero loading lag, zero layout shift.
 *
 * Kept as a small named hook so both `/works` and `/gallery` share the
 * exact same preload semantics (was previously duplicated as inline
 * useEffects across two pages, iter 22/24). Does NOT downgrade source
 * resolution — asks for the same width the visible page uses (900px).
 */
export function useGalleryPreloader(photos, page, pageSize) {
  useEffect(() => {
    if (!Array.isArray(photos) || photos.length <= pageSize) return;
    const totalPages = Math.max(1, Math.ceil(photos.length / pageSize));
    const urls = [];
    if (page > 1) {
      const prevStart = (page - 2) * pageSize;
      urls.push(...photos.slice(prevStart, prevStart + pageSize).map((p) => thumbUrl(p.image, 900)));
    }
    if (page < totalPages) {
      const nextStart = page * pageSize;
      urls.push(...photos.slice(nextStart, nextStart + pageSize).map((p) => thumbUrl(p.image, 900)));
    }
    if (urls.length) prefetchImageUrls(urls, 24);
  }, [photos, page, pageSize]);
}
