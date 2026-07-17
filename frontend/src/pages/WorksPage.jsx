import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { api } from "../lib/api";
import { Rise } from "../components/Rise";
import { sharePhoto } from "../lib/share";

/**
 * Portfolio landing page.
 *
 * Fully driven by the admin "Portfolio Feature Manager" — reads gallery
 * assets flagged featured_portfolio=true and renders them in a magazine
 * grid. Practice filter mirrors the Gallery structure (All / Interiors /
 * Restoration & Renovation).
 */
export default function WorksPage() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [params, setParams] = useSearchParams();
  const practice = params.get("cat") || "all";
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    setLoading(true);
    api.get("/gallery")
      .then((r) => setPhotos((r.data || []).filter((p) => p.featured_portfolio)))
      .catch(() => setPhotos([]))
      .finally(() => setLoading(false));
  }, []);

  const setPractice = (k) => {
    const q = new URLSearchParams();
    if (k !== "all") q.set("cat", k);
    setParams(q);
  };

  const filtered = useMemo(() => {
    if (practice === "all") return photos;
    if (practice === "residential") return photos.filter((p) => p.category === "RESIDENTIAL");
    if (practice === "commercial")  return photos.filter((p) => p.category === "COMMERCIAL");
    if (practice === "restoration") return photos.filter((p) => p.category === "RESTORATION & RENOVATIONS");
    return photos;
  }, [photos, practice]);

  return (
    <main data-testid="works-page" className="pt-32 pb-24 md:pt-40 md:pb-32 bg-[var(--bg-0)]">
      <div className="max-w-[1440px] mx-auto px-6 md:px-14">
        <Rise>
          <div className="flex items-center gap-3 mb-6">
            <span className="w-10 h-[1px] bg-[var(--gold)]" />
            <span className="overline">The Portfolio</span>
          </div>
        </Rise>
        <Rise delay={80}>
          <h1 className="font-serif text-[clamp(2.8rem,8vw,7rem)] tracking-[-0.02em] leading-[0.9]">
            Our <span className="italic text-[var(--gold)]">Works</span>
          </h1>
        </Rise>
        <Rise delay={160}>
          <p className="mt-6 max-w-2xl text-[15px] md:text-[17px] text-[var(--ink)]/80 leading-relaxed">
            A curated ledger of interiors, restorations and renewals — hand-picked from our studio archive.
          </p>
        </Rise>

        <div className="hairline mt-14 mb-8" />

        <div className="flex flex-wrap items-center gap-2 mb-10">
          <span className="overline text-[10px] text-[var(--muted)] mr-2">Category ·</span>
          {[
            ["all", "All"],
            ["residential", "Residential"],
            ["commercial", "Commercial"],
            ["restoration", "Restoration & Renovations"],
          ].map(([k, l]) => (
            <button
              key={k}
              data-testid={`filter-category-${k}`}
              onClick={() => setPractice(k)}
              className={`px-4 py-2 border text-[12px] uppercase tracking-[0.14em] transition-colors ${
                practice === k
                  ? "border-[var(--gold)] text-[var(--gold)]"
                  : "border-[var(--line-strong)] text-[var(--ink)]/80 hover:border-[var(--ink)]"
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-[4/5] bg-[var(--bg-1)] animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <div className="font-serif italic text-2xl md:text-3xl text-[var(--muted)]">
              No portfolio pieces have been featured yet.
            </div>
            <p className="mt-4 text-[13px] text-[var(--muted)] max-w-md mx-auto">
              Head to the studio console → Portfolio Feature Manager and toggle photographs to appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {filtered.map((p, i) => (
              <Rise key={p.id} delay={i * 60}>
                <button
                  onClick={() => setLightbox(p)}
                  data-testid={`portfolio-item-${i}`}
                  className="group relative w-full text-left overflow-hidden bg-[var(--bg-1)] aspect-[4/5]"
                >
                  <img
                    src={p.image}
                    alt={p.title || ""}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.2,0.7,0.15,1)] group-hover:scale-[1.05]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5 md:p-6 text-white">
                    <div className="text-[10px] tracking-[0.28em] uppercase text-[var(--gold-hi)] mb-2">
                      {p.category}{p.subcategory ? ` · ${p.subcategory}` : ""}
                    </div>
                    <div className="font-serif text-[22px] md:text-[26px] leading-tight">
                      {p.title || p.subcategory || "Untitled"}
                    </div>
                  </div>
                </button>
              </Rise>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          role="dialog"
          data-testid="portfolio-lightbox"
          onClick={() => setLightbox(null)}
          className="fixed inset-0 z-[80] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 md:p-10"
        >
          <button
            onClick={(e) => { e.stopPropagation(); setLightbox(null); }}
            className="absolute top-6 right-6 w-11 h-11 border border-white/40 text-white hover:border-[var(--gold-hi)] hover:text-[var(--gold-hi)] transition-colors"
            data-testid="portfolio-lightbox-close"
          >×</button>
          <div className="max-w-[1200px] w-full" onClick={(e) => e.stopPropagation()}>
            <img src={lightbox.image} alt={lightbox.title || ""} className="w-full max-h-[80vh] object-contain" />
            <div className="mt-5 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
              <div>
                <div className="overline text-[var(--gold-hi)] mb-1">
                  {lightbox.category}{lightbox.subcategory ? ` · ${lightbox.subcategory}` : ""}
                </div>
                {lightbox.title && <div className="font-serif text-[24px] md:text-[32px] text-white">{lightbox.title}</div>}
                {lightbox.description && <div className="text-[14px] text-white/70 mt-1 max-w-xl">{lightbox.description}</div>}
              </div>
              <button
                data-testid="portfolio-lightbox-share"
                onClick={async (e) => {
                  e.stopPropagation();
                  const result = await sharePhoto(lightbox);
                  if (result === "shared")   toast.success("Shared.");
                  else if (result === "copied") toast.success("Pin link copied — paste anywhere to share.");
                  else if (result === "unsupported") toast.error("Sharing not supported on this device.");
                }}
                className="btn-gold self-start md:self-end"
              >
                Share as Pin ↗
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
