import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { api } from "../lib/api";
import { Rise } from "../components/Rise";
import { sharePhoto } from "../lib/share";

/* -------------------------------------------------------------------------
 * Gallery structure per user spec:
 *
 * Practice tabs:  [ALL] | [INTERIORS] | [RESTORATION & RENOVATION]
 *
 *   ALL                    → mass photo grid (all photos, lightbox on click)
 *   INTERIORS              → Sub row: [Residential] [Commercial]
 *     Residential          → 5 folder cards: Bedrooms, Bathrooms, Kitchen,
 *                            Hall & Dining, Balcony & Dry area
 *     Commercial           → 3 folder cards: Offices, Retail, Hospitality
 *   RESTORATION & RENOV.   → grid of restoration photos (or empty state)
 *
 * Each folder card shows ONLY its cover image (photo.is_cover === true, or
 * first photo in that (category, subcategory)). Clicking a card opens a
 * modal that reveals every photograph in that room type.
 * ---------------------------------------------------------------------- */

const RESIDENTIAL_CARDS = ["Bedrooms", "Bathrooms", "Kitchen", "Hall & Dining", "Balcony & Dry area"];
const COMMERCIAL_CARDS  = ["Offices", "Retail", "Hospitality"];

// URL param mapping
const PRACTICE_ALL = "all";
const PRACTICE_INTERIORS = "interiors";
const PRACTICE_RESTORATION = "restoration";

export default function GalleryPage() {
  const [params, setParams] = useSearchParams();
  const practice = params.get("practice") || PRACTICE_ALL;
  const sub = params.get("sub") || "";       // "residential" | "commercial" (only for interiors)
  const openedFolder = params.get("folder") || ""; // subcategory string when modal is open

  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    setLoading(true);
    api.get("/gallery")
      .then((r) => setPhotos(r.data || []))
      .catch(() => setPhotos([]))
      .finally(() => setLoading(false));
  }, []);

  // URL setters
  const setPractice = (p) => {
    const q = new URLSearchParams();
    if (p !== PRACTICE_ALL) q.set("practice", p);
    setParams(q);
  };
  const setSub = (s) => {
    const q = new URLSearchParams();
    q.set("practice", practice);
    if (s) q.set("sub", s);
    setParams(q);
  };
  const openFolder = (name) => {
    const q = new URLSearchParams(params);
    q.set("folder", name);
    setParams(q);
  };
  const closeFolder = () => {
    const q = new URLSearchParams(params);
    q.delete("folder");
    setParams(q);
  };

  // Filtering helpers
  const restorationPhotos = useMemo(
    () => photos.filter((p) => (p.practice || "").toLowerCase() === "restoration"),
    [photos]
  );
  const interiorPhotos = useMemo(
    () => photos.filter((p) => (p.practice || "interiors").toLowerCase() === "interiors"),
    [photos]
  );

  const coverForSub = (category, subcategory) => {
    const pool = interiorPhotos.filter(
      (p) => p.category === category && p.subcategory === subcategory
    );
    return pool.find((p) => p.is_cover) || pool[0] || null;
  };
  const countForSub = (category, subcategory) =>
    interiorPhotos.filter((p) => p.category === category && p.subcategory === subcategory).length;

  const folderPhotos = useMemo(() => {
    if (!openedFolder) return [];
    const category = RESIDENTIAL_CARDS.includes(openedFolder) ? "RESIDENTIAL" : "COMMERCIAL";
    return interiorPhotos.filter((p) => p.category === category && p.subcategory === openedFolder);
  }, [openedFolder, interiorPhotos]);

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
            Browse our reference library across two practices — Interiors and Restoration & Renovation.
            Select a room-type card to reveal every photograph in that suite.
          </p>
        </Rise>
      </section>

      {/* Practice tabs */}
      <section className="max-w-[1500px] mx-auto px-6 md:px-14 pt-2 border-t border-[var(--line)]">
        <div
          role="tablist"
          data-testid="gallery-practice-tabs"
          className="flex flex-wrap items-center gap-x-2 md:gap-x-4 gap-y-2 py-5"
        >
          <span className="overline text-[10px] text-[var(--muted)] mr-3">Practice ·</span>
          {[
            [PRACTICE_ALL, "All"],
            [PRACTICE_INTERIORS, "Interiors"],
            [PRACTICE_RESTORATION, "Restoration & Renovation"],
          ].map(([k, l]) => {
            const active = practice === k;
            return (
              <button
                key={k}
                role="tab"
                aria-selected={active}
                data-testid={`practice-tab-${k}`}
                onClick={() => setPractice(k)}
                className={`relative px-4 md:px-5 py-3 nav-label transition-colors ${
                  active ? "text-[var(--ink)]" : "text-[var(--muted)] hover:text-[var(--ink)]"
                }`}
              >
                {l}
                {active && (
                  <motion.span
                    layoutId="gallery-practice-underline"
                    className="absolute left-4 right-4 -bottom-[1px] h-[2px] bg-[var(--gold)]"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Interiors sub-row (Residential / Commercial only) */}
        <AnimatePresence initial={false} mode="wait">
          {practice === PRACTICE_INTERIORS && (
            <motion.div
              key="interiors-sub"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.2, 0.7, 0.15, 1] }}
              className="overflow-hidden border-t border-[var(--line)]"
            >
              <div data-testid="gallery-interiors-subs" className="flex flex-wrap items-center gap-x-4 gap-y-2 py-4">
                <span className="overline text-[10px] text-[var(--muted)] mr-2">Sub ·</span>
                {[
                  ["residential", "Residential"],
                  ["commercial", "Commercial"],
                ].map(([k, l]) => (
                  <SubChip
                    key={k}
                    label={l}
                    active={sub === k}
                    onClick={() => setSub(k === sub ? "" : k)}
                    testid={`sub-${k}`}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* BODY */}
      <section className="max-w-[1500px] mx-auto px-6 md:px-14 py-16 md:py-24">
        {loading ? (
          <div className="py-32 text-center overline text-[var(--muted)]">Loading references…</div>
        ) : practice === PRACTICE_ALL ? (
          <PhotoGrid photos={photos} onOpen={setLightbox} />
        ) : practice === PRACTICE_RESTORATION ? (
          restorationPhotos.length === 0 ? (
            <div className="py-24 text-center">
              <div className="font-serif text-[28px] text-[var(--ink)] mb-3">Restoration references coming soon.</div>
              <div className="text-[14px] text-[var(--muted)] max-w-xl mx-auto">
                Our restoration & renovation portfolio is being curated. In the meantime, explore our interior work.
              </div>
            </div>
          ) : (
            <PhotoGrid photos={restorationPhotos} onOpen={setLightbox} />
          )
        ) : practice === PRACTICE_INTERIORS && sub === "residential" ? (
          <FolderCards
            cards={RESIDENTIAL_CARDS}
            category="RESIDENTIAL"
            coverForSub={coverForSub}
            countForSub={countForSub}
            onOpen={openFolder}
          />
        ) : practice === PRACTICE_INTERIORS && sub === "commercial" ? (
          <FolderCards
            cards={COMMERCIAL_CARDS}
            category="COMMERCIAL"
            coverForSub={coverForSub}
            countForSub={countForSub}
            onOpen={openFolder}
          />
        ) : (
          // Interiors, no sub selected → prompt
          <div className="py-24 text-center">
            <div className="font-serif text-[28px] text-[var(--ink)] mb-3">Choose a practice sub-branch above.</div>
            <div className="flex justify-center gap-3 mt-6">
              <button onClick={() => setSub("residential")} className="admin-btn" data-testid="prompt-residential">Residential</button>
              <button onClick={() => setSub("commercial")}  className="admin-btn ghost" data-testid="prompt-commercial">Commercial</button>
            </div>
          </div>
        )}
      </section>

      {/* FOLDER MODAL */}
      <AnimatePresence>
        {openedFolder && (
          <motion.div
            key={`folder-${openedFolder}`}
            role="dialog"
            data-testid="folder-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-[var(--bg-0)]/98 backdrop-blur-lg overflow-y-auto"
          >
            <button
              onClick={closeFolder}
              className="fixed top-6 right-6 z-[71] w-11 h-11 border border-[var(--line-strong)] text-[var(--ink)] hover:border-[var(--gold)] hover:text-[var(--gold)] transition-colors"
              data-testid="folder-modal-close"
            >×</button>
            <div className="max-w-[1500px] mx-auto px-6 md:px-14 pt-24 pb-24">
              <Rise>
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-10 h-[1px] bg-[var(--gold)]" />
                  <span className="overline">{RESIDENTIAL_CARDS.includes(openedFolder) ? "Residential" : "Commercial"} · Folder</span>
                </div>
              </Rise>
              <Rise delay={70}>
                <h2 className="font-serif text-[clamp(2.4rem,7vw,5.5rem)] leading-[0.9] tracking-[-0.02em] text-[var(--ink)]">
                  <span className="italic text-[var(--gold)]">{openedFolder}</span>
                </h2>
              </Rise>
              <Rise delay={140}>
                <p className="mt-6 text-[14px] text-[var(--muted)]">{folderPhotos.length} photograph{folderPhotos.length === 1 ? "" : "s"}</p>
              </Rise>

              <div className="mt-14">
                {folderPhotos.length === 0 ? (
                  <div className="py-20 text-center text-[var(--muted)] font-serif italic text-2xl">
                    No photographs in this folder yet.
                  </div>
                ) : (
                  <PhotoGrid photos={folderPhotos} onOpen={setLightbox} />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox */}
      {lightbox && (
        <div
          role="dialog"
          data-testid="gallery-lightbox"
          onClick={() => setLightbox(null)}
          className="fixed inset-0 z-[80] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 md:p-10"
        >
          <button
            onClick={(e) => { e.stopPropagation(); setLightbox(null); }}
            className="absolute top-6 right-6 w-11 h-11 border border-white/40 text-white hover:border-[var(--gold-hi)] hover:text-[var(--gold-hi)] transition-colors"
            data-testid="lightbox-close"
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
                data-testid="lightbox-share"
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

/* ============================================================= */

function FolderCards({ cards, category, coverForSub, countForSub, onOpen }) {
  return (
    <div data-testid="folder-cards" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
      {cards.map((name, i) => {
        const cover = coverForSub(category, name);
        const count = countForSub(category, name);
        return (
          <Rise key={name} delay={i * 60}>
            <button
              onClick={() => onOpen(name)}
              data-testid={`folder-card-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
              className="group relative w-full text-left overflow-hidden bg-[var(--bg-1)] aspect-[4/5]"
            >
              {cover ? (
                <img
                  src={cover.image}
                  alt={name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.2,0.7,0.15,1)] group-hover:scale-[1.06]"
                  loading="lazy"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-[var(--muted)] text-[12px] tracking-widest uppercase">
                  No cover yet
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/10 pointer-events-none" />
              <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8 text-white">
                <div className="text-[10px] tracking-[0.32em] uppercase text-[var(--gold-hi)] mb-3">
                  {count} photograph{count === 1 ? "" : "s"}
                </div>
                <div className="font-serif text-[34px] md:text-[44px] leading-[0.95]">{name}</div>
                <div className="mt-5 flex items-center gap-3 text-[11px] tracking-[0.28em] uppercase opacity-90 group-hover:text-[var(--gold-hi)] transition-colors">
                  Open Folder
                  <span className="w-8 h-[1px] bg-current" />
                  <span>→</span>
                </div>
              </div>
              <span className="absolute top-4 left-4 right-4 flex items-center justify-between text-[10px] tracking-[0.28em] uppercase text-white/85">
                <span>{category === "RESIDENTIAL" ? "Residential" : "Commercial"}</span>
                <span>0{i + 1}</span>
              </span>
            </button>
          </Rise>
        );
      })}
    </div>
  );
}

function PhotoGrid({ photos, onOpen }) {
  if (!photos.length) {
    return (
      <div className="py-24 text-center">
        <div className="font-serif text-[26px] mb-2 text-[var(--ink)]">No photographs here yet.</div>
      </div>
    );
  }
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="columns-1 sm:columns-2 lg:columns-3 gap-4 md:gap-6 [column-fill:_balance]"
    >
      {photos.map((ph, i) => (
        <Rise
          key={ph.id}
          delay={(i % 6) * 40}
          className="mb-4 md:mb-6 break-inside-avoid"
        >
          <button
            data-testid={`gallery-item-${i}`}
            onClick={() => onOpen(ph)}
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
