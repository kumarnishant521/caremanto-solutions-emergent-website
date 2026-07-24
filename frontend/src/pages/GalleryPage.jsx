import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
 * Three top-level tabs:
 *   RESIDENTIAL                → 5 folder cards
 *   COMMERCIAL                 → 3 folder cards
 *   RESTORATION & RENOVATIONS  → direct photo grid (no sub-folders)
 *
 * Each folder card shows only its cover image (photo.is_cover === true,
 * else the first photo in the sub). Click → modal with every image in
 * that folder.
 * ------------------------------------------------------------------------- */

const RESIDENTIAL = "RESIDENTIAL";
const COMMERCIAL  = "COMMERCIAL";
const RESTORATION = "RESTORATION & RENOVATIONS";

const RESIDENTIAL_FOLDERS = ["Hall & Dining", "Bedrooms", "Bathrooms", "Kitchens", "Balcony / Dry Area / Temple"];
const COMMERCIAL_FOLDERS  = ["Office spaces", "Retail Design", "Hospitality"];

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export default function GalleryPage() {
  const [params, setParams] = useSearchParams();
  const category = params.get("cat") || RESIDENTIAL;
  const openedFolder = params.get("folder") || "";

  const { photos, loading } = useGallery();
  // Lightbox carousel state — { photos, index } so the viewer can swipe.
  const [lightbox, setLightbox] = useState(null);
  const openLightbox = (_ph, idx, list) => setLightbox({ photos: list, index: idx });
  const closeLightbox = () => setLightbox(null);
  const setLightboxIndex = (i) => setLightbox((lb) => (lb ? { ...lb, index: i } : lb));

  const sectionKey = category === COMMERCIAL ? "commercial"
                   : category === RESTORATION ? "restoration"
                   : "residential";
  const seo = useSEOFor({ sectionKey, category, folder: openedFolder });

  const setCategory = (c) => {
    const q = new URLSearchParams();
    if (c !== RESIDENTIAL) q.set("cat", c);
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

  const photosByCategory = useMemo(() => photos.filter((p) => p.category === category), [photos, category]);

  // Sort helper — folder_order asc (nulls last), created_at tiebreaker.
  const folderSort = (a, b) => {
    const ao = a.folder_order == null ? Number.POSITIVE_INFINITY : a.folder_order;
    const bo = b.folder_order == null ? Number.POSITIVE_INFINITY : b.folder_order;
    if (ao !== bo) return ao - bo;
    return (a.created_at || "").localeCompare(b.created_at || "");
  };

  const photosInSub = (sub) =>
    photos.filter((p) => p.category === category && p.subcategory === sub).slice().sort(folderSort);

  const coverForSub = (sub) => {
    const pool = photosInSub(sub);
    return pool.find((p) => p.is_cover) || pool[0] || null;
  };
  const countForSub = (sub) => photosInSub(sub).length;

  const folderPhotos = useMemo(() => {
    if (!openedFolder) return [];
    return photosInSub(openedFolder);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openedFolder, photos, category]);

  const folders = category === RESIDENTIAL ? RESIDENTIAL_FOLDERS
                : category === COMMERCIAL  ? COMMERCIAL_FOLDERS
                : [];

  return (
    <main data-testid="gallery-page" className="pt-[100px] bg-[var(--bg-0)] min-h-screen">
      <Head
        title={seo.title}
        description={seo.description}
        canonical={`https://caremanto.in/gallery${category !== RESIDENTIAL ? `?cat=${encodeURIComponent(category)}` : ""}${openedFolder ? `${category !== RESIDENTIAL ? "&" : "?"}folder=${encodeURIComponent(openedFolder)}` : ""}`}
        keywords={seo.keywords}
        image={seo.image}
      />
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
            Three practices, curated end to end. Select a category to browse folder covers — click any card
            to open its full suite of photographs.
          </p>
        </Rise>
      </section>

      {/* Category tabs */}
      <section className="max-w-[1500px] mx-auto px-6 md:px-14 pt-2 border-t border-[var(--line)]">
        <div
          role="tablist"
          data-testid="gallery-category-tabs"
          className="flex flex-wrap items-center gap-x-2 md:gap-x-4 gap-y-2 py-5"
        >
          <span className="overline text-[10px] text-[var(--muted)] mr-3">Category ·</span>
          {[RESIDENTIAL, COMMERCIAL, RESTORATION].map((k) => {
            const active = category === k;
            return (
              <button
                key={k}
                role="tab"
                aria-selected={active}
                data-testid={`gallery-category-tab-${slug(k)}`}
                onClick={() => setCategory(k)}
                className={`relative px-4 md:px-5 py-3 nav-label transition-colors ${
                  active ? "text-[var(--ink)]" : "text-[var(--muted)] hover:text-[var(--ink)]"
                }`}
              >
                {k}
                {active && (
                  <motion.span
                    layoutId="gallery-category-underline"
                    className="absolute left-4 right-4 -bottom-[1px] h-[2px] bg-[var(--gold)]"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* BODY */}
      <section className="max-w-[1500px] mx-auto px-6 md:px-14 py-16 md:py-24">
        {loading ? (
          <SkeletonGrid />
        ) : category === RESTORATION ? (
          photosByCategory.length === 0 ? (
            <div className="py-24 text-center">
              <div className="font-serif text-[28px] text-[var(--ink)] mb-3">Restoration references coming soon.</div>
              <div className="text-[14px] text-[var(--muted)] max-w-xl mx-auto">
                Our restoration & renovation portfolio is being curated. Please check back shortly.
              </div>
            </div>
          ) : (
            <PhotoGrid photos={photosByCategory} onOpen={openLightbox} />
          )
        ) : folders.length > 0 ? (
          <FolderCards
            folders={folders}
            categoryLabel={category === RESIDENTIAL ? "Residential" : "Commercial"}
            coverForSub={coverForSub}
            countForSub={countForSub}
            photosInSub={photosInSub}
            onOpen={openFolder}
          />
        ) : null}
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
                  <span className="overline">{category} · Folder</span>
                </div>
              </Rise>
              <Rise delay={70}>
                <h2 className="font-serif text-[clamp(2.4rem,7vw,5.5rem)] leading-[0.9] tracking-[-0.02em] text-[var(--ink)] mb-12">
                  <span className="italic text-[var(--gold)]">{openedFolder}</span>
                </h2>
              </Rise>

              <div className="mt-4">
                {folderPhotos.length === 0 ? (
                  <div className="py-20 text-center text-[var(--muted)] font-serif italic text-2xl">
                    No photographs in this folder yet.
                  </div>
                ) : (
                  <PhotoGrid photos={folderPhotos} onOpen={openLightbox} />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox — carousel-enabled, arrows + keyboard + swipe */}
      <Lightbox
        photos={lightbox?.photos || []}
        index={lightbox?.index}
        onIndex={setLightboxIndex}
        onClose={closeLightbox}
        testIdPrefix="gallery"
      />
    </main>
  );
}

/* ============================================================= */

function FolderCards({ folders, categoryLabel, coverForSub, countForSub, photosInSub, onOpen }) {
  return (
    <div data-testid="folder-cards" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
      {folders.map((name, i) => {
        const cover = coverForSub(name);
        const count = countForSub(name);
        const prefetch = () => {
          if (!photosInSub) return;
          const urls = photosInSub(name).map((p) => p.image);
          prefetchImageUrls(urls, 8);
        };
        return (
          <Rise key={name} delay={i * 60}>
            <button
              onClick={() => onOpen(name)}
              onMouseEnter={prefetch}
              onFocus={prefetch}
              onTouchStart={prefetch}
              data-testid={`folder-card-${slug(name)}`}
              className="group relative w-full text-left overflow-hidden bg-[var(--bg-1)]"
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
                  fallbackText={name}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-[var(--muted)] text-[12px] tracking-widest uppercase">
                  No cover yet
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/10 pointer-events-none" />
              <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8 text-white">
                <div className="text-[10px] tracking-[0.32em] uppercase text-[var(--gold-hi)] font-medium mb-2">
                  {categoryLabel}
                </div>
                <div className="font-serif text-[34px] md:text-[44px] leading-[0.95]">{name}</div>
                <div className="mt-5 flex items-center gap-3 text-[11px] tracking-[0.28em] uppercase opacity-90 group-hover:text-[var(--gold-hi)] transition-colors">
                  <span>View Section</span>
                  <span className="w-8 h-[1px] bg-current" />
                  <span>→</span>
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

function PhotoGrid({ photos, onOpen }) {
  const PAGE_SIZE = 15;
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(photos.length / PAGE_SIZE));
  const gridRef = useRef(null);

  // Reset to page 1 ONLY when the photo IDs actually change identity
  // (folder switch). Prevents the 20s useGallery polling refresh from
  // resetting the user's active page.
  const photoIdKey = useMemo(() => (photos || []).map((p) => p.id).join("|"), [photos]);
  useEffect(() => { setPage(1); }, [photoIdKey]);

  // Clamp if photos shrink beneath us.
  useEffect(() => {
    if (page > totalPages) setPage(Math.max(1, totalPages));
  }, [page, totalPages]);

  const start = (page - 1) * PAGE_SIZE;
  const paged = photos.slice(start, start + PAGE_SIZE);

  // Background preloader — Page N-1 and Page N+1 warmed via new Image().
  useGalleryPreloader(photos, page, PAGE_SIZE);

  const changePage = (n) => {
    setPage(n);
    requestAnimationFrame(() => {
      gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  if (!photos.length) {
    return (
      <div className="py-24 text-center">
        <div className="font-serif text-[26px] mb-2 text-[var(--ink)]">No photographs here yet.</div>
      </div>
    );
  }
  return (
    <>
      <motion.div
        ref={gridRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="portfolio-gallery-container"
        key={page}
      >
        {paged.map((ph, i) => (
          <div key={ph.id} className="portfolio-item-card">
            <button
              data-testid={`gallery-item-${i}`}
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
                    {ph.category}
                    {ph.subcategory ? ` · ${ph.subcategory}` : ""}
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
        testIdPrefix="gallery-pagination"
      />
    </>
  );
}
