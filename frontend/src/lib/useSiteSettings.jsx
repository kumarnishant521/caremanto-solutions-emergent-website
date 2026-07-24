import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "./api";
import { KEYWORDS, pageTitleFor as staticTitleFor } from "./seo";

/**
 * SiteSettingsProvider — hydrates the app's SEO/footer/nav settings from the
 * admin-controlled `/api/seo` endpoint. Falls back to the compiled-in static
 * constants (see `lib/seo.js`) if the network call hasn't completed yet, so
 * every route can still render meta immediately.
 *
 * Cache strategy:
 *   • Read `localStorage['caremanto:site-settings']` synchronously on first
 *     render — zero flicker on repeat visits.
 *   • Fire an authenticated-agnostic GET in the background; on success,
 *     overwrite the cache and re-render.
 */

const STORAGE_KEY = "caremanto:site-settings";

const FALLBACK_SECTIONS = {
  home:        { keywords: [] },
  residential: { keywords: KEYWORDS.residential },
  commercial:  { keywords: KEYWORDS.commercial },
  restoration: { keywords: KEYWORDS.restoration },
  portfolio:   { keywords: [] },
  studio:      { keywords: [] },
};

const FALLBACK_SETTINGS = {
  sections: FALLBACK_SECTIONS,
  footer:   null,   // components fall back to their compiled defaults
  nav:      null,
};

function readCache() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.sections) return parsed;
  } catch {}
  return null;
}

const SiteSettingsContext = createContext({ settings: FALLBACK_SETTINGS, reload: async () => {} });

export function SiteSettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => readCache() || FALLBACK_SETTINGS);

  const load = async () => {
    try {
      const r = await api.get("/seo");
      if (r?.data && r.data.sections) {
        setSettings(r.data);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(r.data)); } catch {}
      }
    } catch {
      // silent — components still work off fallback
    }
  };

  useEffect(() => {
    load();
    // Real-time sync (iter 24) — silent poll every 20s so admin edits
    // (SEO, footer, nav, home copy) publish across every open tab
    // without a manual refresh. focus event forces an immediate re-fetch
    // when the visitor returns to the tab.
    const t = setInterval(() => { load(); }, 20_000);
    const onFocus = () => { load(); };
    window.addEventListener("focus", onFocus);
    return () => { clearInterval(t); window.removeEventListener("focus", onFocus); };
  }, []);

  const value = useMemo(() => ({ settings, reload: load }), [settings]);
  return (
    <SiteSettingsContext.Provider value={value}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}

/**
 * useHomeCopy — resolve editable home-page text blocks from context.
 *   block: "hero" | "divisions" | "sections"
 * Returns an object of strings; missing values fall back to the caller's
 * `defaults` map so a blank admin field never blanks the site.
 */
export function useHomeCopy(block, defaults = {}) {
  const { settings } = useSiteSettings();
  const stored = (settings.home_copy && settings.home_copy[block]) || {};
  const out = { ...defaults };
  for (const [k, v] of Object.entries(stored)) {
    if (typeof v === "string" && v.trim()) out[k] = v;
  }
  return out;
}

/**
 * useSEOFor — resolve the SEO meta bundle for a given surface.
 *   sectionKey — "home" | "residential" | "commercial" | "restoration" |
 *                "portfolio" | "studio"
 *   folder     — optional sub-folder name (only used for the browser <title>)
 *
 * Returns { title, description, keywords, image } — every field is a string.
 * Missing values fall through to the static `seo.js` defaults so the site
 * never renders empty meta.
 */
export function useSEOFor({ sectionKey = "home", folder = null, category = null } = {}) {
  const { settings } = useSiteSettings();
  const section = (settings.sections && settings.sections[sectionKey]) || {};
  const home    = (settings.sections && settings.sections.home) || {};

  const staticTitle = staticTitleFor({ category, folder });
  const title       = folder ? staticTitle : (section.title || staticTitle);
  const description = section.description || home.description || "";
  const keywordsArr = (section.keywords && section.keywords.length) ? section.keywords
                   : (home.keywords || []);
  const image       = section.og_image || home.og_image || "";

  // Dedupe while preserving order
  const keywords = Array.from(new Set(keywordsArr.filter(Boolean))).join(", ");
  return { title, description, keywords, image };
}
