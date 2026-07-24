import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";
import { toast } from "sonner";
import { thumbUrl } from "../../lib/thumb";
import Lightbox from "../Lightbox";

/**
 * Portfolio Feature Manager
 *
 * A single-purpose view for toggling `featured_portfolio` on every gallery
 * photograph. The public /works portfolio page reads only assets flagged
 * true here.
 */
export default function AdminPortfolio() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState("ALL");
  const [showOnly, setShowOnly] = useState("all"); // "all" | "featured"
  const [lightbox, setLightbox] = useState(null); // { photos, index }

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get("/gallery");
      setPhotos(r.data || []);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let out = photos;
    if (filterCat !== "ALL") out = out.filter((p) => p.category === filterCat);
    if (showOnly === "featured") out = out.filter((p) => p.featured_portfolio);
    return out;
  }, [photos, filterCat, showOnly]);

  const toggle = async (p) => {
    // optimistic update
    setPhotos((prev) => prev.map((x) => x.id === p.id ? { ...x, featured_portfolio: !x.featured_portfolio } : x));
    try {
      await api.put(`/admin/gallery/${p.id}`, { ...p, featured_portfolio: !p.featured_portfolio });
    } catch {
      toast.error("Save failed — reverting.");
      setPhotos((prev) => prev.map((x) => x.id === p.id ? { ...x, featured_portfolio: p.featured_portfolio } : x));
    }
  };

  const bulkSet = async (val) => {
    if (!filtered.length) return;
    const targets = filtered.filter((p) => !!p.featured_portfolio !== val);
    if (!targets.length) return;
    if (!window.confirm(`${val ? "Feature" : "Un-feature"} ${targets.length} photograph(s) on Portfolio?`)) return;
    for (const p of targets) {
      try { await api.put(`/admin/gallery/${p.id}`, { ...p, featured_portfolio: val }); }
      catch { /* skip */ }
    }
    toast.success(`${targets.length} photograph(s) updated.`);
    load();
  };

  const featuredCount = photos.filter((p) => p.featured_portfolio).length;

  return (
    <section className="space-y-6" data-testid="admin-portfolio-panel">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h2 className="font-serif text-[32px]">Portfolio Feature Manager</h2>
          <p className="text-[13px] text-[#F5EEE0]/60 mt-2 max-w-2xl">
            Toggle which gallery photographs appear on the public <strong>Portfolio</strong> page
            (the Explore Portfolio landing). Changes publish instantly.
          </p>
          <div className="text-[11px] tracking-widest uppercase text-[var(--gold-hi)] mt-3">
            {featuredCount} featured · {photos.length} total
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="admin-input"
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            data-testid="portfolio-filter-cat"
          >
            <option value="ALL">All Categories</option>
            <option value="RESIDENTIAL">Residential</option>
            <option value="COMMERCIAL">Commercial</option>
            <option value="RESTORATION & RENOVATIONS">Restoration & Renovations</option>
          </select>
          <select
            className="admin-input"
            value={showOnly}
            onChange={(e) => setShowOnly(e.target.value)}
            data-testid="portfolio-filter-featured"
          >
            <option value="all">All Photos</option>
            <option value="featured">Featured Only</option>
          </select>
          <button onClick={() => bulkSet(true)}  className="admin-btn ghost text-[11px]" data-testid="portfolio-feature-all">Feature Visible</button>
          <button onClick={() => bulkSet(false)} className="admin-btn ghost text-[11px]" data-testid="portfolio-unfeature-all">Un-feature Visible</button>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center overline">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-[#F5EEE0]/60">No photographs match this filter.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((p, i) => (
            <div key={p.id} className="admin-card p-3">
              <button
                type="button"
                onClick={() => setLightbox({ photos: filtered, index: i })}
                data-testid={`portfolio-preview-${p.id}`}
                title="Click to preview at full size"
                className="block w-full aspect-square overflow-hidden bg-[#241D16] mb-3 relative focus:outline focus:outline-1 focus:outline-[var(--gold-hi)]"
              >
                <img
                  src={thumbUrl(p.image, 300)}
                  alt={p.alt_text || p.title || ""}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
                {p.featured_portfolio && (
                  <span className="absolute top-2 right-2 bg-[var(--gold-hi)] text-black text-[9px] tracking-widest uppercase px-2 py-1 font-medium">★ Portfolio</span>
                )}
              </button>
              <div className="overline text-[9px] mb-2">
                {p.category}{p.subcategory ? ` · ${p.subcategory}` : ""}
              </div>
              <button
                onClick={() => toggle(p)}
                data-testid={`portfolio-toggle-${p.id}`}
                className={`admin-btn w-full text-[11px] ${p.featured_portfolio ? "" : "ghost"}`}
              >
                {p.featured_portfolio ? "★ Featured on Portfolio" : "☆ Feature on Portfolio"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Shared Lightbox — same prev/next/keyboard/swipe as the public viewer. */}
      <Lightbox
        photos={lightbox?.photos || []}
        index={lightbox?.index}
        onIndex={(i) => setLightbox((lb) => (lb ? { ...lb, index: i } : lb))}
        onClose={() => setLightbox(null)}
        testIdPrefix="admin-portfolio"
      />
    </section>
  );
}
