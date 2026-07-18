import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { homeGalleryImages } from "../lib/realProjects";
import { thumbUrl } from "../lib/thumb";
import { useGallery } from "../lib/useGallery";

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

function PortfolioCard({ src, alt, priority }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <figure className="portfolio-item-card" data-testid="home-portfolio-item">
      <img
        src={thumbUrl(src, 900)}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        onError={() => setFailed(true)}
      />
    </figure>
  );
}

export default function HomeGallery() {
  const { photos } = useGallery();

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
            Full Portfolio
          </Link>
        </div>

        <div className="portfolio-gallery-container" data-testid="home-gallery-grid">
          {tiles.map((src, i) => (
            <PortfolioCard
              key={src}
              src={src}
              alt={`Caremanto Solutions luxury interior ${i + 1} — Mumbai residential, commercial and restoration portfolio`}
              priority={i < 3}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
