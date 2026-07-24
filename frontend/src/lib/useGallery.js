import { useEffect, useState } from "react";
import { api } from "./api";

/**
 * Module-level cache for the full gallery payload. This means switching
 * between subcategory tabs (Kitchens ↔ Bedrooms) no longer re-fires the
 * /api/gallery network call — the second tab render just reads from cache.
 * A TTL keeps the data fresh (invalidated after 45 s to catch admin edits).
 */
const TTL_MS = 45_000;
let _cache = null;         // { data, ts }
let _inflight = null;      // Promise while a fetch is running

async function fetchGallery(force = false) {
  const now = Date.now();
  if (!force && _cache && now - _cache.ts < TTL_MS) return _cache.data;
  if (_inflight) return _inflight;
  _inflight = api.get("/gallery")
    .then((r) => {
      _cache = { data: r.data || [], ts: Date.now() };
      return _cache.data;
    })
    .finally(() => { _inflight = null; });
  return _inflight;
}

/**
 * Public hook — returns { photos, loading, refresh }.
 * Reads from the shared cache so cross-tab switches are instant.
 *
 * Real-time sync (iter 24) — every 20s the hook silently re-fetches the
 * gallery in the background. Admin edits published from another tab or
 * device are picked up within one poll cycle without a manual refresh.
 */
export function useGallery() {
  const [photos, setPhotos] = useState(() => (_cache ? _cache.data : []));
  const [loading, setLoading] = useState(!_cache);

  useEffect(() => {
    let cancelled = false;
    const load = async (force = false) => {
      try {
        const data = await fetchGallery(force);
        if (!cancelled) setPhotos(data);
      } catch {
        if (!cancelled) setPhotos([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    // Periodic silent refresh so instant real-time propagation works
    // even for anonymous visitors already sitting on a page.
    const t = setInterval(() => load(true), 20_000);
    // When the tab regains focus, force a fresh fetch immediately.
    const onFocus = () => load(true);
    window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      clearInterval(t);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const refresh = async () => {
    setLoading(true);
    const data = await fetchGallery(true);
    setPhotos(data);
    setLoading(false);
  };

  return { photos, loading, refresh };
}

export function invalidateGalleryCache() { _cache = null; }

/**
 * Warm the browser's image cache for a set of URLs. Used by folder cards
 * `onMouseEnter` — by the time the user clicks, the first few photos in
 * the folder modal are already decoded and instant to render.
 */
const _prefetched = new Set();
export function prefetchImageUrls(urls, limit = 8) {
  if (!urls || !urls.length || typeof window === "undefined") return;
  for (const u of urls.slice(0, limit)) {
    if (!u || _prefetched.has(u)) continue;
    _prefetched.add(u);
    const img = new Image();
    img.decoding = "async";
    img.src = u;
  }
}
