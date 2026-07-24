import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Rise } from "../components/Rise";
import SmartImage from "../components/SmartImage";
import { thumbUrl } from "../lib/thumb";
import { useGallery, prefetchImageUrls } from "../lib/useGallery";
import { useGalleryPreloader } from "../lib/useGalleryPreloader";
import Head from "../components/Head";
import SkeletonGrid from "../components/SkeletonGrid";
import Pagination from "../components/Pagination";
import Lightbox from "../components/Lightbox";
import PhotoTile from "../components/PhotoTile";
import { altFor } from "../lib/seo";
import { useSEOFor } from "../lib/useSiteSettings";

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

  const { photos, loading } = useGallery();
  // Lightbox carousel state — { photos, index } so the viewer can swipe.
  const [lightbox, setLightbox] = useState(null);
  const closeLightbox = () => setLightbox(null);
  const setLightboxIndex = (i) => setLightbox((lb) => (lb ? { ...lb, index: i } : lb));

  // Resolve dynamic SEO for this category (admin-editable via /admin → SEO).
  const sectionKey = category === COMMERCIAL ? "commercial"
                   : category === RESTORATION ? "restoration"
                   : "residential";
  const seo = useSEOFor({ sectionKey, category, folder: openedFolder });

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
  // Within each folder, honour the admin's Smart Layout ordering (folder_order
  // ascending, nulls last, created_at tiebreaker).
  const photosBySub = useMemo(() => {
    const map = new Map();
    for (const p of photosInCategory) {
      const key = p.subcategory || "";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(p);
    }
    for (const [k, arr] of map) {
      arr.sort((a, b) => {
        const ao = a.folder_order == null ? Number.POSITIVE_INFINITY : a.folder_order;
        const bo = b.folder_order == null ? Number.POSITIVE_INFINITY : b.folder_order;
        if (ao !== bo) return ao - bo;
        return (a.created_at || "").localeCompare(b.created_at || "");
      });
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
      <Head
        title={seo.title}
        description={seo.description}
        canonical={`https://caremanto.in/works${category !== RESIDENTIAL ? `?cat=${encodeURIComponent(category)}` : ""}${openedFolder ? `${category !== RESIDENTIAL ? "&" : "?"}folder=${encodeURIComponent(openedFolder)}` : ""}`}
        keywords={seo.keywords}
        image={seo.image}
      />
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
          <SkeletonGrid />
        ) : openedFolder ? (
          /* -------- Child view: folder drill-down -------- */
          <FolderChildView
            categoryLabel={category}
            folderName={openedFolder}
            photos={folderPhotos}
            onBack={backToFolders}
            onOpenPhoto={(_ph, idx, list) => setLightbox({ photos: list, index: idx })}
          />
        ) : category === RESTORATION ? (
          /* -------- Restoration: direct photo grid -------- */
          photosInCategory.length === 0 ? (
            <EmptyState
              title="Restoration references coming soon."
              subtitle="Our restoration & renovation portfolio is being curated. Please check back shortly."
            />
          ) : (
            <PhotoGrid
              photos={photosInCategory}
              onOpen={(_ph, idx, list) => setLightbox({ photos: list, index: idx })}
              testIdPrefix="works-restoration"
            />
          )
        ) : (
          /* -------- Residential / Commercial: folder grid (exactly N unique cards) -------- */
          <FolderCards
            folders={folders}
            categoryLabel={category}
            coverForSub={coverForSub}
            countForSub={countForSub}
            photosBySub={photosBySub}
            onOpen={openFolder}
          />
        )}
      </div>

      {/* Lightbox — carousel-enabled, arrows + keyboard + swipe */}
      <Lightbox
        photos={lightbox?.photos || []}
        index={lightbox?.index}
        onIndex={setLightboxIndex}
        onClose={closeLightbox}
        testIdPrefix="portfolio"
      />
    </main>
  );
}

/* ============================================================= */

function FolderCards({ folders, categoryLabel, coverForSub, countForSub, photosBySub, onOpen }) {
  return (
    <div data-testid="works-folder-cards" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
      {folders.map((name, i) => {
        const cover = coverForSub(name);
        const count = countForSub(name);
        const empty = count === 0;
        const prefetch = () => {
          if (empty || !photosBySub) return;
          const urls = (photosBySub.get(name) || []).map((p) => p.image);
          prefetchImageUrls(urls, 8);
        };
        return (
          <Rise key={name} delay={i * 60}>
            <button
              onClick={() => empty ? null : onOpen(name)}
              onMouseEnter={prefetch}
              onFocus={prefetch}
              onTouchStart={prefetch}
              disabled={empty}
              data-testid={`works-folder-card-${slug(name)}`}
              className={`group relative w-full text-left overflow-hidden bg-[var(--bg-1)] ${empty ? "cursor-not-allowed opacity-70" : ""}`}
              style={{ aspectRatio: "4/5" }}
            >
              {cover ? (
                <SmartImage
                  src={cover.image}
                  alt={altFor({ ...cover, subcategory: name }, i)}
                  width={600}
                  aspect="4/5"
                  className="absolute inset-0 w-full h-full"
                  imgClassName="transition-transform duration-[900ms] ease-[cubic-bezier(0.2,0.7,0.15,1)] group-hover:scale-[1.06]"
                  fallbackText={`${name}`}
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
                  {empty ? (
                    <span>Coming soon</span>
                  ) : (
                    <>
                      <span>View Section</span>
                      <span className="w-8 h-[1px] bg-current" />
                      <span>→</span>
                    </>
                  )}
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
        <h2 className="font-serif text-[clamp(2.4rem,7vw,5.5rem)] leading-[0.9] tracking-[-0.02em] text-[var(--ink)] mb-12">
          <span className="italic text-[var(--gold)]">{folderName}</span>
        </h2>
      </Rise>

      <div className="mt-4">
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

function PhotoGrid({ photos, onOpen, testIdPrefix = "works-child" }) {
  // Pagination: strict 15-per-page budget. Prevents 100+ image folders from
  // hammering the browser and gives visitors a clean editorial flow.
  const PAGE_SIZE = 15;
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(photos.length / PAGE_SIZE));
  const gridRef = useRef(null);

  // Reset to page 1 ONLY when the underlying photo set changes identity —
  // e.g. the visitor drilled into a different folder. Prevents the polling
  // refresh (iter 24) from resetting a user's current page every 20s.
  // Hash the ids so array-reference churn from useGallery re-fetches
  // doesn't trigger a false positive.
  const photoIdKey = useMemo(() => (photos || []).map((p) => p.id).join("|"), [photos]);
  useEffect(() => { setPage(1); }, [photoIdKey]);

  // Clamp page if photos shrink underneath us (photo deleted upstream).
  useEffect(() => {
    if (page > totalPages) setPage(Math.max(1, totalPages));
  }, [page, totalPages]);

  const start = (page - 1) * PAGE_SIZE;
  const paged = photos.slice(start, start + PAGE_SIZE);

  // Background preloader — Page N-1 and Page N+1 warmed via new Image().
  useGalleryPreloader(photos, page, PAGE_SIZE);

  const changePage = (n) => {
    setPage(n);
    // Instant top-scroll to the grid so the visitor never lands mid-frame
    // after a page shift. Scoped to the grid element (not the whole page)
    // so the editorial header stays put — feels far less janky.
    requestAnimationFrame(() => {
      gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <>
      <motion.div
        ref={gridRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="portfolio-gallery-container"
        key={page /* remounts children so eager/lazy priorities reset per page */}
      >
        {paged.map((ph, i) => (
          <div key={ph.id} className="portfolio-item-card">
            <button
              data-testid={`${testIdPrefix}-item-${i}`}
              onClick={() => onOpen(ph, i, paged)}
              className="w-full text-left proj-card block group relative"
            >
              <PhotoTile
                src={thumbUrl(ph.image, 900)}
                alt={altFor(ph, i)}
                priority={i < 3}
              />
              <div className="absolute inset-x-0 bottom-0 z-10 p-4 md:p-5 flex items-end justify-between gap-3 bg-gradient-to-t from-black/60 to-transparent">
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
              </div>
            </button>
          </div>
        ))}
      </motion.div>

      <Pagination
        page={page}
        totalPages={totalPages}
        onChange={changePage}
        testIdPrefix={`${testIdPrefix}-pagination`}
      />
    </>
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
