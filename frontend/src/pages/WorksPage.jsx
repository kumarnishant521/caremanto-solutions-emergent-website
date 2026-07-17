import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { api } from "../lib/api";
import { Rise } from "../components/Rise";
import { sharePhoto } from "../lib/share";

/* -------------------------------------------------------------------------
 * Portfolio landing (`/works`)
 *
 * Structure (matches the taxonomy contract):
 *
 *   Category tabs:  [RESIDENTIAL] · [COMMERCIAL] · [RESTORATION & RENOVATIONS]
 *
 *   RESIDENTIAL  → EXACTLY 5 unique folder cards
 *   COMMERCIAL   → EXACTLY 3 unique folder cards
 *   RESTORATION  → no folders — a direct photo grid
 *
 * Only photographs flagged `featured_portfolio=true` in the /admin
 * Portfolio Feature Manager surface here.
 *
 * Folder cards are DERIVED from a fixed taxonomy list — we do NOT loop the
 * photo array to build cards, so there can never be duplicate folder names.
 *
 * Clicking a folder card DOES NOT open a lightbox. It swaps the entire view
 * (via ?folder=<name> URL param) into a child gallery page for that folder.
 * A prominent "← Back to Folders" button returns to the folder grid.
 * ------------------------------------------------------------------------- */

const RESIDENTIAL = "RESIDENTIAL";
const COMMERCIAL  = "COMMERCIAL";
const RESTORATION = "RESTORATION & RENOVATIONS";

const RESIDENTIAL_FOLDERS = ["Hall & Dining", "Bedrooms", "Bathrooms", "Kitchens", "Balcony / Dry Area / Temple"];
const COMMERCIAL_FOLDERS  = ["Office spaces", "Retail Design", "Hospitality"];

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const catSlug = (c) =>
  c === RESIDENTIAL ? "residential" :
  c === COMMERCIAL  ? "commercial"  :
                      "restoration-renovations";

export default function WorksPage() {
  const [params, setParams] = useSearchParams();
  const category = params.get("cat") || RESIDENTIAL;
  const openedFolder = params.get("folder") || "";

  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    setLoading(true);
    api.get("/gallery")
      .then((r) => setPhotos((r.data || []).filter((p) => p.featured_portfolio)))
      .catch(() => setPhotos([]))
      .finally(() => setLoading(false));
  }, []);

  /* -- URL helpers -- */
  const setCategory = (c) => {
    const q = new URLSearchParams();
    if (c !== RESIDENTIAL) q.set("cat", c);
    setParams(q);
  };
  const openFolder = (name) => {
    const q = new URLSearchParams();
    if (category !== RESIDENTIAL) q.set("cat", category);
    q.set("folder", name);
    setParams(q);
  };
  const backToFolders = () => {
    const q = new URLSearchParams();
    if (category !== RESIDENTIAL) q.set("cat", category);
    setParams(q);
  };

  /* -- Data by category -- */
  const photosInCategory = useMemo(
    () => photos.filter((p) => p.category === category),
    [photos, category]
  );

  // Group featured photos by sub-category so each folder is derived exactly once.
  const photosBySub = useMemo(() => {
    const map = new Map();
    for (const p of photosInCategory) {
      const key = p.subcategory || "";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(p);
    }
    return map;
  }, [photosInCategory]);

  const coverForSub = (sub) => {
    const pool = photosBySub.get(sub) || [];
    return pool.find((p) => p.is_cover) || pool[0] || null;
  };
  const countForSub = (sub) => (photosBySub.get(sub) || []).length;

  const folderPhotos = useMemo(
    () => (openedFolder ? (photosBySub.get(openedFolder) || []) : []),
    [openedFolder, photosBySub]
  );

  const folders = category === RESIDENTIAL ? RESIDENTIAL_FOLDERS
                : category === COMMERCIAL  ? COMMERCIAL_FOLDERS
                : [];

  return (
    <main data-testid="works-page" className="pt-32 pb-24 md:pt-40 md:pb-32 bg-[var(--bg-0)] min-h-screen">
      <div className="max-w-[1500px] mx-auto px-6 md:px-14">
        {/* Editorial header */}
        <Rise>
          <div className="flex items-center gap-3 mb-6">
            <span className="w-10 h-[1px] bg-[var(--gold)]" />
            <span className="overline">The Portfolio · Our Works</span>
          </div>
        </Rise>
        <Rise delay={80}>
          <h1 className="font-serif text-[clamp(2.8rem,8vw,7rem)] tracking-[-0.02em] leading-[0.9]">
            Our <span className="italic text-[var(--gold)]">Works</span>
          </h1>
        </Rise>
        <Rise delay={160}>
          <p className="mt-6 max-w-2xl text-[15px] md:text-[17px] text-[var(--ink)]/80 leading-relaxed">
            Handpicked chapters from our studio archive — grouped by practice, ordered by room.
          </p>
        </Rise>

        <div className="hairline mt-14 mb-8" />

        {/* Category tabs */}
        <div
          role="tablist"
          data-testid="works-category-tabs"
          className="flex flex-wrap items-center gap-x-2 md:gap-x-4 gap-y-2 mb-10"
        >
          <span className="overline text-[10px] text-[var(--muted)] mr-2">Category ·</span>
          {[RESIDENTIAL, COMMERCIAL, RESTORATION].map((k) => {
            const active = category === k;
            return (
              <button
                key={k}
                role="tab"
                aria-selected={active}
                data-testid={`works-category-tab-${catSlug(k)}`}
                onClick={() => setCategory(k)}
                className={`relative px-4 md:px-5 py-3 nav-label transition-colors ${
                  active ? "text-[var(--ink)]" : "text-[var(--muted)] hover:text-[var(--ink)]"
                }`}
              >
                {k}
                {active && (
                  <motion.span
                    layoutId="works-category-underline"
                    className="absolute left-4 right-4 -bottom-[1px] h-[2px] bg-[var(--gold)]"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="py-24 text-center overline text-[var(--muted)]">Loading portfolio…</div>
        ) : openedFolder ? (
          /* -------- Child view: folder drill-down -------- */
          <FolderChildView
            categoryLabel={category}
            folderName={openedFolder}
            photos={folderPhotos}
            onBack={backToFolders}
            onOpenPhoto={setLightbox}
          />
        ) : category === RESTORATION ? (
          /* -------- Restoration: direct photo grid -------- */
          photosInCategory.length === 0 ? (
            <EmptyState
              title="Restoration references coming soon."
              subtitle="Our restoration & renovation portfolio is being curated. Please check back shortly."
            />
          ) : (
            <PhotoGrid photos={photosInCategory} onOpen={setLightbox} />
          )
        ) : (
          /* -------- Residential / Commercial: folder grid (exactly N unique cards) -------- */
          <FolderCards
            folders={folders}
            categoryLabel={category}
            coverForSub={coverForSub}
            countForSub={countForSub}
            onOpen={openFolder}
          />
        )}
      </div>

      {/* Lightbox — only used inside the folder child view */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            key="works-lightbox"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
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
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

/* ============================================================= */

function FolderCards({ folders, categoryLabel, coverForSub, countForSub, onOpen }) {
  return (
    <div data-testid="works-folder-cards" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
      {folders.map((name, i) => {
        const cover = coverForSub(name);
        const count = countForSub(name);
        const empty = count === 0;
        return (
          <Rise key={name} delay={i * 60}>
            <button
              onClick={() => empty ? null : onOpen(name)}
              disabled={empty}
              data-testid={`works-folder-card-${slug(name)}`}
              className={`group relative w-full text-left overflow-hidden bg-[var(--bg-1)] aspect-[4/5] ${empty ? "cursor-not-allowed opacity-70" : ""}`}
            >
              {cover ? (
                <img
                  src={cover.image}
                  alt={name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.2,0.7,0.15,1)] group-hover:scale-[1.06]"
                  loading="lazy"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-[var(--muted)] text-[11px] tracking-widest uppercase">
                  Coming soon
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/10 pointer-events-none" />
              <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8 text-white">
                {/* Metadata: small parent category label + folder title */}
                <div className="text-[10px] tracking-[0.32em] uppercase text-[var(--gold-hi)] font-medium mb-2">
                  {categoryLabel}
                </div>
                <div className="font-serif text-[34px] md:text-[44px] leading-[0.95]">{name}</div>
                <div className="mt-5 flex items-center gap-3 text-[11px] tracking-[0.28em] uppercase opacity-90 group-hover:text-[var(--gold-hi)] transition-colors">
                  {empty ? "No works featured yet" : `${count} work${count === 1 ? "" : "s"} · Open Folder`}
                  {!empty && <>
                    <span className="w-8 h-[1px] bg-current" />
                    <span>→</span>
                  </>}
                </div>
              </div>
              <span className="absolute top-4 left-4 right-4 flex items-center justify-between text-[10px] tracking-[0.28em] uppercase text-white/85">
                <span>0{i + 1}</span>
              </span>
            </button>
          </Rise>
        );
      })}
    </div>
  );
}

function FolderChildView({ categoryLabel, folderName, photos, onBack, onOpenPhoto }) {
  return (
    <div data-testid="works-folder-child" className="pt-2">
      <button
        onClick={onBack}
        data-testid="works-back-to-folders"
        className="inline-flex items-center gap-2 text-[12px] tracking-[0.24em] uppercase text-[var(--muted)] hover:text-[var(--gold)] transition-colors mb-10"
      >
        <span aria-hidden="true">←</span>
        <span>Back to Folders</span>
      </button>

      <Rise>
        <div className="flex items-center gap-3 mb-4">
          <span className="w-10 h-[1px] bg-[var(--gold)]" />
          <span className="overline">{categoryLabel} · Folder</span>
        </div>
      </Rise>
      <Rise delay={70}>
        <h2 className="font-serif text-[clamp(2.4rem,7vw,5.5rem)] leading-[0.9] tracking-[-0.02em] text-[var(--ink)]">
          <span className="italic text-[var(--gold)]">{folderName}</span>
        </h2>
      </Rise>
      <Rise delay={140}>
        <p className="mt-6 text-[14px] text-[var(--muted)]">
          {photos.length} photograph{photos.length === 1 ? "" : "s"} in this folder
        </p>
      </Rise>

      <div className="mt-12">
        {photos.length === 0 ? (
          <EmptyState
            title="No works featured in this folder yet."
            subtitle="Head to the studio console → Portfolio Feature Manager and flag photographs from this room to appear here."
          />
        ) : (
          <PhotoGrid photos={photos} onOpen={onOpenPhoto} />
        )}
      </div>
    </div>
  );
}

function PhotoGrid({ photos, onOpen }) {
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
          className="mb-4 md:mb-6 break-inside-avoid block"
        >
          <button
            data-testid={`works-child-item-${i}`}
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
                  {ph.category}{ph.subcategory ? ` · ${ph.subcategory}` : ""}
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

function EmptyState({ title, subtitle }) {
  return (
    <div className="py-20 text-center">
      <div className="font-serif italic text-2xl md:text-3xl text-[var(--ink)] mb-3">{title}</div>
      {subtitle && <p className="mt-2 text-[13px] text-[var(--muted)] max-w-md mx-auto">{subtitle}</p>}
    </div>
  );
}
