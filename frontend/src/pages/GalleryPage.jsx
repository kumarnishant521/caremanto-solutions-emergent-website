import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../lib/api";
import { Rise } from "../components/Rise";

const OUR_WORK = "Our Work";

export default function GalleryPage() {
  const [params, setParams] = useSearchParams();
  const cat = params.get("cat") || OUR_WORK;
  const sub = params.get("sub") || "";

  const [taxonomy, setTaxonomy] = useState({ categories: [OUR_WORK], subcategories: {} });
  const [allPhotos, setAllPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);

  // Load taxonomy once
  useEffect(() => {
    api.get("/gallery/taxonomy").then((r) => setTaxonomy(r.data)).catch(() => {});
  }, []);

  // Load photos — fetch all (client-side filter for smooth transitions)
  useEffect(() => {
    setLoading(true);
    api.get("/gallery")
      .then((r) => setAllPhotos(r.data))
      .catch(() => setAllPhotos([]))
      .finally(() => setLoading(false));
  }, []);

  const setCat = (c) => {
    const p = new URLSearchParams();
    if (c && c !== OUR_WORK) p.set("cat", c);
    setParams(p);
  };
  const setSub = (s) => {
    const p = new URLSearchParams(params);
    if (!s) p.delete("sub");
    else p.set("sub", s);
    setParams(p);
  };

  const subOptions = useMemo(
    () => (taxonomy.subcategories && taxonomy.subcategories[cat]) || [],
    [taxonomy, cat]
  );

  const filtered = useMemo(() => {
    if (cat === OUR_WORK) return allPhotos;
    let out = allPhotos.filter((p) => p.category === cat);
    if (sub) out = out.filter((p) => p.subcategory === sub);
    return out;
  }, [allPhotos, cat, sub]);

  return (
    <main data-testid="gallery-page" className="pt-[100px] bg-[var(--bg-0)] min-h-screen">
      {/* Editorial header */}
      <section className="max-w-[1500px] mx-auto px-6 md:px-14 pt-16 md:pt-24 pb-10">
        <Rise>
          <div className="flex items-center gap-3 mb-8">
            <span className="w-10 h-[1px] bg-[var(--gold)]" />
            <span className="overline">Gallery · Reference Library</span>
          </div>
        </Rise>
        <Rise delay={80}>
          <h1 className="font-serif text-[clamp(3rem,9vw,8rem)] tracking-[-0.02em] leading-[0.88] max-w-[1100px] text-[var(--ink)]">
            A living library of<br />
            <span className="italic text-[var(--gold)]">details</span> and moments.
          </h1>
        </Rise>
        <Rise delay={160}>
          <p className="mt-8 max-w-2xl text-[15px] md:text-[16px] leading-relaxed text-[var(--ink)]/85">
            Browse our reference library across four collections. Two of them —
            Home Spaces & Corners and Commercial Spaces — carry finer sub-filters
            so you can zero in on exactly the room or context you're studying.
          </p>
        </Rise>
      </section>

      {/* Main category tabs */}
      <section className="max-w-[1500px] mx-auto px-6 md:px-14 pt-2 border-t border-[var(--line)]">
        <div
          role="tablist"
          data-testid="gallery-main-tabs"
          className="flex flex-wrap items-center gap-x-2 md:gap-x-4 gap-y-2 py-5"
        >
          {(taxonomy.categories || [OUR_WORK]).map((c, i) => {
            const isActive = cat === c;
            return (
              <button
                key={c}
                role="tab"
                aria-selected={isActive}
                data-testid={`gallery-tab-${i}`}
                onClick={() => setCat(c)}
                className={`relative px-4 md:px-5 py-3 nav-label transition-colors ${
                  isActive ? "text-[var(--ink)]" : "text-[var(--muted)] hover:text-[var(--ink)]"
                }`}
              >
                {c}
                {isActive && (
                  <motion.span
                    layoutId="gallery-tab-underline"
                    className="absolute left-4 right-4 -bottom-[1px] h-[2px] bg-[var(--gold)]"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Sub-filter row (only when the current category has sub-filters) */}
        <AnimatePresence initial={false} mode="wait">
          {subOptions.length > 0 && (
            <motion.div
              key={cat + "-subs"}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.2, 0.7, 0.15, 1] }}
              className="overflow-hidden border-t border-[var(--line)]"
            >
              <div
                data-testid="gallery-sub-tabs"
                className="flex flex-wrap items-center gap-x-4 gap-y-2 py-4"
              >
                <span className="overline text-[10px] text-[var(--muted)] mr-2">Filter:</span>
                <SubChip
                  label={`All ${cat === "Commercial Spaces" ? "Segments" : "Rooms"}`}
                  active={!sub}
                  onClick={() => setSub("")}
                  testid="gallery-sub-all"
                />
                {subOptions.map((s, i) => (
                  <SubChip
                    key={s}
                    label={s}
                    active={sub === s}
                    onClick={() => setSub(s)}
                    testid={`gallery-sub-${i}`}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Grid */}
      <section className="max-w-[1500px] mx-auto px-6 md:px-14 py-16 md:py-24">
        {loading ? (
          <div className="py-32 text-center overline text-[var(--muted)]">Loading references…</div>
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center">
            <div className="font-serif text-[26px] mb-2 text-[var(--ink)]">
              No photographs in this filter yet.
            </div>
            <div className="text-[14px] text-[var(--muted)]">
              Try a different sub-filter — or check back soon.
            </div>
          </div>
        ) : (
          <motion.div
            key={cat + "|" + sub}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="columns-1 sm:columns-2 lg:columns-3 gap-4 md:gap-6 [column-fill:_balance]"
          >
            {filtered.map((ph, i) => (
              <Rise
                key={ph.id}
                delay={(i % 6) * 40}
                className="mb-4 md:mb-6 break-inside-avoid"
              >
                <button
                  data-testid={`gallery-item-${i}`}
                  onClick={() => setLightbox(ph)}
                  className="w-full text-left proj-card block group"
                >
                  <img
                    src={ph.image}
                    alt={ph.title || ""}
                    loading="lazy"
                    className="w-full h-auto object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 z-10 p-4 md:p-5 flex items-end justify-between gap-3">
                    <div>
                      <div className="text-[9px] tracking-[0.28em] uppercase text-[var(--gold-hi)] mb-1 font-medium">
                        {ph.category}
                        {ph.subcategory ? ` · ${ph.subcategory}` : ""}
                      </div>
                      {ph.title && (
                        <div className="font-serif text-[18px] md:text-[20px] leading-tight text-white">
                          {ph.title}
                        </div>
                      )}
                    </div>
                    <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity">↗</span>
                  </div>
                </button>
              </Rise>
            ))}
          </motion.div>
        )}
      </section>

      {/* Lightbox */}
      {lightbox && (
        <div
          role="dialog"
          data-testid="gallery-lightbox"
          onClick={() => setLightbox(null)}
          className="fixed inset-0 z-[80] bg-[var(--bg-0)]/95 backdrop-blur-md flex items-center justify-center p-4 md:p-10"
        >
          <button
            onClick={(e) => { e.stopPropagation(); setLightbox(null); }}
            className="absolute top-6 right-6 w-11 h-11 border border-[var(--line-strong)] text-[var(--ink)] hover:border-[var(--gold)] hover:text-[var(--gold)] transition-colors"
            data-testid="lightbox-close"
          >×</button>
          <div className="max-w-[1200px] w-full" onClick={(e) => e.stopPropagation()}>
            <img src={lightbox.image} alt={lightbox.title || ""} className="w-full max-h-[80vh] object-contain" />
            <div className="mt-5 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
              <div>
                <div className="overline text-[var(--gold)] mb-1">
                  {lightbox.category}{lightbox.subcategory ? ` · ${lightbox.subcategory}` : ""}
                </div>
                {lightbox.title && <div className="font-serif text-[24px] md:text-[32px] text-[var(--ink)]">{lightbox.title}</div>}
                {lightbox.description && <div className="text-[14px] text-[var(--muted)] mt-1 max-w-xl">{lightbox.description}</div>}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function SubChip({ label, active, onClick, testid }) {
  return (
    <button
      onClick={onClick}
      data-testid={testid}
      className={`relative px-4 py-2 text-[13px] font-serif italic transition-colors border ${
        active
          ? "text-[var(--bg-0)] bg-[var(--ink)] border-[var(--ink)]"
          : "text-[var(--ink)]/80 bg-transparent border-[var(--line-strong)] hover:border-[var(--gold)] hover:text-[var(--gold)]"
      }`}
    >
      {label}
    </button>
  );
}
