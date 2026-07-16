import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { Rise } from "../components/Rise";
import { AnimatePresence, motion } from "framer-motion";

export default function GalleryPage() {
  const [taxonomy, setTaxonomy] = useState({ spaces: [], segments: [] });
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [params, setParams] = useSearchParams();
  const [lightbox, setLightbox] = useState(null);

  const space = params.get("space") || "all";
  const segment = params.get("segment") || "all";

  useEffect(() => {
    api.get("/gallery/taxonomy").then((r) => setTaxonomy(r.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    const q = new URLSearchParams();
    if (space !== "all") q.set("space", space);
    if (segment !== "all") q.set("segment", segment);
    api.get(`/gallery${q.toString() ? `?${q.toString()}` : ""}`)
      .then((r) => setPhotos(r.data))
      .finally(() => setLoading(false));
  }, [space, segment]);

  const setAxis = (axis, val) => {
    const p = new URLSearchParams(params);
    if (val === "all") p.delete(axis); else p.set(axis, val);
    setParams(p);
  };

  return (
    <main data-testid="gallery-page" className="pt-32 pb-24 md:pt-40 md:pb-32 bg-[var(--bg-0)]">
      <div className="max-w-[1440px] mx-auto px-6 md:px-14">
        <Rise>
          <div className="flex items-center gap-3 mb-6">
            <span className="w-10 h-[1px] bg-[var(--gold)]" />
            <span className="overline">The Photographic Ledger</span>
          </div>
        </Rise>
        <Rise delay={80}>
          <h1 className="font-serif text-[clamp(2.8rem,8vw,7rem)] tracking-[-0.02em] leading-[0.9]">
            The <span className="italic text-[var(--gold)]">Gallery</span>
          </h1>
        </Rise>
        <Rise delay={160}>
          <p className="mt-6 max-w-2xl text-[15px] md:text-[17px] text-[var(--ink)]/80 leading-relaxed">
            A curated archive of details — filter by space or by category of work.
          </p>
        </Rise>

        <div className="hairline mt-14 mb-8" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <FilterGroup
            axis="space"
            label="By Space"
            active={space}
            options={taxonomy.spaces}
            onChange={(v) => setAxis("space", v)}
          />
          <FilterGroup
            axis="segment"
            label="By Work"
            active={segment}
            options={taxonomy.segments}
            onChange={(v) => setAxis("segment", v)}
          />
        </div>

        <div className="mt-4">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-square bg-[var(--bg-1)] animate-pulse" />
              ))}
            </div>
          ) : photos.length === 0 ? (
            <div className="py-24 text-center text-[var(--muted)] font-serif italic text-2xl">
              No photos in this selection yet.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {photos.map((ph, i) => (
                <Rise key={ph.id} delay={i * 40}>
                  <button
                    data-testid={`gallery-photo-${i}`}
                    onClick={() => setLightbox(ph)}
                    className="proj-card block w-full text-left"
                  >
                    <div className="aspect-square">
                      <img src={ph.image} alt={ph.title} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                    <div className="absolute inset-x-0 bottom-0 z-10 p-4">
                      <div className="overline text-[9px] text-[var(--gold)]">{ph.space} · {ph.segment}</div>
                      {ph.title && <div className="font-serif text-[16px] mt-1">{ph.title}</div>}
                    </div>
                  </button>
                </Rise>
              ))}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[80] bg-[var(--bg-0)]/95 backdrop-blur-md flex items-center justify-center p-6"
            onClick={() => setLightbox(null)}
            data-testid="gallery-lightbox"
          >
            <button
              onClick={() => setLightbox(null)}
              className="absolute top-6 right-6 w-10 h-10 border border-white/20 text-[var(--ink)] hover:border-[var(--gold)] hover:text-[var(--gold)] transition"
              aria-label="Close"
            >✕</button>
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.35, ease: [0.2,0.7,0.15,1] }}
              className="max-w-5xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <img src={lightbox.image} alt={lightbox.title} className="w-full max-h-[80vh] object-contain" />
              <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <div className="overline text-[10px] text-[var(--gold)]">{lightbox.space} · {lightbox.segment}</div>
                  {lightbox.title && <div className="font-serif text-2xl mt-1">{lightbox.title}</div>}
                </div>
                {lightbox.description && <div className="text-sm text-[var(--muted)] max-w-md">{lightbox.description}</div>}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function FilterGroup({ axis, label, active, options, onChange }) {
  return (
    <div>
      <div className="overline text-[10px] text-[var(--muted)] mb-3">{label}</div>
      <div className="flex flex-wrap gap-2">
        <FilterChip axis={axis} val="all" active={active} onChange={onChange}>All</FilterChip>
        {options.map((v, i) => (
          <FilterChip key={v} axis={axis} val={v} active={active} onChange={onChange} idx={i}>{v}</FilterChip>
        ))}
      </div>
    </div>
  );
}

function FilterChip({ axis, val, active, onChange, children, idx }) {
  const is = active === val;
  return (
    <button
      data-testid={`gallery-filter-${axis}-${val === "all" ? "all" : idx}`}
      onClick={() => onChange(val)}
      className={`px-3 py-1.5 text-[12px] tracking-[0.06em] border transition-colors ${
        is ? "border-[var(--gold)] text-[var(--gold)]" : "border-white/10 text-[var(--ink)]/80 hover:border-white/30"
      }`}
    >
      {children}
    </button>
  );
}
