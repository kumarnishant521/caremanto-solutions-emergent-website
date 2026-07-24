import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { homeGalleryImages } from "../lib/realProjects";
import { thumbUrl } from "../lib/thumb";
import { useGallery } from "../lib/useGallery";
import { altFor } from "../lib/seo";

/**
 * Home portfolio gallery — TRUE editorial masonry (Picture 2 layout).
 *
 * Design contract (from the studio brief, iteration 13):
 *   • CSS multi-column layout (`column-count: 3 / 2 / 1` responsive) — the
 *     browser packs tiles into columns of naturally-varying height.
 *   • Each tile is a plain `<img width=100% height=auto>` — NO aspect-ratio
 *     lock, NO absolute-positioned wrapper. Landscape shots stay wide,
 *     portrait shots stay tall, exactly the way they were shot.
 *   • `object-fit: contain` guarantees zero cropping — the CAREMANTO
 *     watermark at the bottom edge is always fully visible.
 *   • Admin `home_order` sequence still drives display order 1:1 through
 *     the columns.
 *   • First three images are eager + high-priority so the fold above the
 *     scroll is instant.
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
];

/* --- individual card: plain <img>, natural aspect, watermark-safe ---- */

function PortfolioCard({ src, alt, priority, aspectHint = "3 / 4" }) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  if (failed) return null;
  return (
    <figure className="portfolio-item-card" data-testid="home-portfolio-item">
      {/* Reserve height BEFORE the image decodes so cold-start visitors see a
          skeleton block instead of a collapsed layout / flash-of-blank column.
          Once the image reports `onLoad`, we release the aspect-ratio lock
          and let the natural intrinsic height take over — the strict
          `object-fit: contain` rule in index.css keeps watermarks visible. */}
      <div
        className={`relative w-full ${loaded ? "" : "portfolio-card-skeleton"}`}
        style={loaded ? undefined : { aspectRatio: aspectHint }}
      >
        <img
          src={thumbUrl(src, 900)}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={loaded ? "" : "opacity-0"}
          style={loaded ? undefined : { position: "absolute", inset: 0, width: "100%", height: "100%" }}
        />
      </div>
    </figure>
  );
}

export default function HomeGallery() {
  const { photos, loading } = useGallery();

  const tiles = useMemo(() => {
    // Admin sequence — home_order ASC (nulls last), created_at tiebreak.
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

  // Editorial rhythm — three column heights that keep the 3-column masonry
  // balanced during the skeleton phase (tall / mid / short / tall / …).
  const SKELETON_ASPECTS = ["3 / 4", "1 / 1", "4 / 5", "2 / 3", "1 / 1", "3 / 4", "4 / 5", "2 / 3", "1 / 1"];

  // When we have NEITHER real photos yet NOR a cached local list, render a
  // set of skeleton tiles that preserve the 3-column masonry structure.
  const showSkeletons = loading && tiles.length === 0;

  return (
    <section
      id="home-gallery"
      data-testid="home-gallery-section"
      className="relative bg-[var(--bg-0)] py-24 md:py-36"
    >
      <div className="max-w-[1500px] mx-auto px-6 md:px-14">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-14 md:mb-20">
          <h2
            data-testid="home-gallery-tagline"
            className="font-sans-alt text-[var(--ink)] uppercase font-light tracking-[0.18em] leading-[1.35] text-[clamp(1.15rem,1.9vw,1.7rem)] max-w-[720px]"
          >
            Crafting Architectural Spaces<br className="hidden md:block" />{" "}
            With Quiet Authority
          </h2>
          <Link to="/works" data-testid="home-gallery-cta" className="btn-pill">
            Browse Residential, Commercial &amp; Restoration Projects
          </Link>
        </div>

        <div className="portfolio-gallery-container" data-testid="home-gallery-grid">
          {showSkeletons
            ? SKELETON_ASPECTS.map((ar, i) => (
                <figure
                  key={`skeleton-${i}`}
                  className="portfolio-item-card"
                  data-testid="home-portfolio-skeleton"
                >
                  <div
                    className="portfolio-card-skeleton w-full"
                    style={{ aspectRatio: ar }}
                    aria-hidden="true"
                  />
                </figure>
              ))
            : tiles.map((src, i) => (
                <PortfolioCard
                  key={src}
                  src={src}
                  alt={altFor({ category: i % 3 === 0 ? "RESIDENTIAL" : i % 3 === 1 ? "COMMERCIAL" : "RESTORATION & RENOVATIONS" }, i)}
                  priority={i < 3}
                  aspectHint={SKELETON_ASPECTS[i % SKELETON_ASPECTS.length]}
                />
              ))}
        </div>
      </div>
    </section>
  );
}
