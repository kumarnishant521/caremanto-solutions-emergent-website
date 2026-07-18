import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Rise } from "./Rise";
import { Link } from "react-router-dom";
import { homeGalleryImages } from "../lib/realProjects";
import { useGallery } from "../lib/useGallery";

/**
 * Editorial Home Bento — Asymmetric Masonry.
 *
 * Design contract (from the studio brief):
 *   1. NEVER crop. `object-fit: contain` + natural aspect ratio per tile.
 *   2. Column & row spans vary per photograph, driven by its natural ratio,
 *      so landscape shots read wide and portraits stay tall — a true fluid
 *      editorial rhythm, not blocky squares.
 *   3. 16-px watermark safety padding at the bottom of every cell.
 *   4. Dense CSS-Grid packing (`grid-auto-flow: dense`) eliminates empty
 *      gaps between clusters even as spans vary.
 *   5. Admin `home_order` still drives the display sequence 1:1.
 */

const PLACEHOLDERS = [
  "https://images.pexels.com/photos/34688219/pexels-photo-34688219.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "https://images.pexels.com/photos/6438752/pexels-photo-6438752.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "https://images.pexels.com/photos/2062431/pexels-photo-2062431.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "https://images.pexels.com/photos/2724749/pexels-photo-2724749.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "https://images.pexels.com/photos/1454804/pexels-photo-1454804.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "https://images.pexels.com/photos/1080696/pexels-photo-1080696.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "https://images.pexels.com/photos/6969831/pexels-photo-6969831.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "https://images.pexels.com/photos/380769/pexels-photo-380769.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "https://images.pexels.com/photos/291762/pexels-photo-291762.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "https://images.pexels.com/photos/1743229/pexels-photo-1743229.jpeg?auto=compress&cs=tinysrgb&w=1200",
];

/* ---------- responsive grid dimensions ---------- */

function useGridCols() {
  const [cols, setCols] = useState(12);
  useEffect(() => {
    const compute = () => {
      const w = window.innerWidth;
      setCols(w < 640 ? 4 : w < 1024 ? 8 : 12);
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);
  return cols;
}

/* Column span from aspect ratio — landscape wide, portrait narrow, editorial.
 *
 * Hybrid strategy: pure ratio-driven mapping is elegant but collapses to only
 * 2 span values when the source photography is homogeneous (real-world case:
 * most studio DSLR shots are ratio ~1.5). To guarantee editorial rhythm the
 * layout uses "anchor" indices that always emit varied spans from a curated
 * pattern; the remaining tiles are ratio-driven. This produces ≥3 distinct
 * spans on any dataset while still honouring true portraits and panoramas.
 */
function colSpanFor(ratio, cols, index) {
  const fallback = [6, 4, 5, 3, 7, 4, 3, 5, 6, 4, 5, 3];
  // Editorial anchors — force these positions to a specific varied span.
  const ANCHOR = { 0: 6, 3: 3, 4: 7, 7: 5, 8: 3, 11: 5 };

  if (!ratio) {
    // Ratio not known yet — deterministic pattern keeps the first paint fluid.
    const s = fallback[index % fallback.length];
    return Math.min(s, cols);
  }

  let span;
  if (cols >= 12) {
    // Anchor override before ratio buckets to guarantee variety.
    if (ANCHOR[index] != null) {
      span = ANCHOR[index];
    } else if (ratio >= 1.7)       span = 7;   // panorama
    else if (ratio >= 1.35)        span = 6;   // wide landscape
    else if (ratio >= 1.15)        span = 5;   // slight landscape
    else if (ratio >= 0.9)         span = 4;   // square-ish
    else if (ratio >= 0.7)         span = 4;   // gentle portrait
    else                           span = 3;   // tall portrait
  } else if (cols >= 8) {
    if (index === 0 || index === 4) span = 5;
    else if (ratio >= 1.35)        span = 5;
    else if (ratio >= 1.05)        span = 4;
    else if (ratio >= 0.85)        span = 4;
    else                           span = 3;
  } else {
    // Mobile: two columns per row for interest, but full-width for panoramas.
    span = ratio >= 1.4 ? 4 : 2;
  }
  return Math.min(span, cols);
}

/* ---------- tile component ---------- */

const ROW_UNIT = 8;   // px — matches grid-auto-rows in index.css
const GAP = 20;       // px — matches gap in index.css (desktop)

function BentoTile({ src, index, cols, priority }) {
  const cellRef = useRef(null);
  const [ratio, setRatio] = useState(null);
  const [rowSpan, setRowSpan] = useState(30);

  const handleImgLoad = (e) => {
    const w = e.currentTarget.naturalWidth;
    const h = e.currentTarget.naturalHeight;
    if (w && h) setRatio(w / h);
  };

  // Measure rendered height → derive grid row-span so masonry packs tightly.
  useLayoutEffect(() => {
    if (!cellRef.current) return;
    const el = cellRef.current;
    const compute = () => {
      const rect = el.getBoundingClientRect();
      const h = rect.height;
      if (!h) return;
      const gap = window.innerWidth < 640 ? 12 : window.innerWidth < 1024 ? 16 : GAP;
      const span = Math.ceil((h + gap) / (ROW_UNIT + gap));
      setRowSpan(span);
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    window.addEventListener("resize", compute);
    return () => { ro.disconnect(); window.removeEventListener("resize", compute); };
  }, [ratio, cols]);

  const colSpan = colSpanFor(ratio, cols, index);

  return (
    <figure
      className="bento-cell group"
      data-testid={`home-bento-tile-${index}`}
      data-loading={ratio == null ? "true" : "false"}
      style={{ gridColumn: `span ${colSpan}`, gridRow: `span ${rowSpan}` }}
    >
      <div ref={cellRef} className="bento-inner">
        <img
          src={src}
          alt=""
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchpriority={priority ? "high" : "auto"}
          onLoad={handleImgLoad}
          className="bento-img"
        />
      </div>
    </figure>
  );
}

/* ---------- section ---------- */

export default function HomeGallery() {
  const { photos } = useGallery();
  const cols = useGridCols();

  const tiles = useMemo(() => {
    // Strict admin sequence: home_order asc (nulls last), created_at tiebreak.
    const featured = (photos || [])
      .filter((p) => p.featured_home)
      .slice()
      .sort((a, b) => {
        const ao = a.home_order == null ? Number.POSITIVE_INFINITY : a.home_order;
        const bo = b.home_order == null ? Number.POSITIVE_INFINITY : b.home_order;
        if (ao !== bo) return ao - bo;
        return (a.created_at || "").localeCompare(b.created_at || "");
      })
      .map((p) => p.image);
    const real = homeGalleryImages().map((r) => r.src);
    const combined = [];
    [...featured, ...real, ...PLACEHOLDERS].forEach((src) => {
      if (src && !combined.includes(src) && combined.length < 12) combined.push(src);
    });
    return combined;
  }, [photos]);

  return (
    <section
      id="home-gallery"
      data-testid="home-gallery-section"
      className="relative bg-[var(--bg-0)] py-24 md:py-36"
    >
      <div className="max-w-[1500px] mx-auto px-6 md:px-14">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-14 md:mb-20">
          <Rise>
            <h2
              data-testid="home-gallery-tagline"
              className="font-sans-alt text-[var(--ink)] uppercase font-light tracking-[0.18em] leading-[1.35] text-[clamp(1.15rem,1.9vw,1.7rem)] max-w-[720px]"
            >
              Crafting Architectural Spaces<br className="hidden md:block" />{" "}
              With Quiet Authority
            </h2>
          </Rise>
          <Rise delay={120}>
            <Link to="/works" data-testid="home-gallery-cta" className="btn-pill">
              Full Portfolio
            </Link>
          </Rise>
        </div>

        <div
          data-testid="home-gallery-grid"
          className="home-bento-grid"
          key={cols /* re-flow spans cleanly on breakpoint change */}
        >
          {tiles.map((src, i) => (
            <BentoTile
              key={src}
              src={src}
              index={i}
              cols={cols}
              priority={i < 3}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
