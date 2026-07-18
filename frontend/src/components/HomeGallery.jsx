import { useMemo } from "react";
import { Link } from "react-router-dom";
import { homeGalleryImages } from "../lib/realProjects";
import SmartImage from "./SmartImage";
import { useGallery } from "../lib/useGallery";

/**
 * Home portfolio grid — clean 3-column editorial masonry.
 *
 * Design contract (from the studio brief, restored 2026-07-18):
 *   • Three-column CSS multi-column layout — clean, quiet, matches the
 *     original look and feel (no random asymmetric bento).
 *   • Each tile fills its cell with `object-fit: cover` — no letterbox
 *     padding, no cream gaps around the photograph.
 *   • Watermark protection: `object-position: 50% 100%` anchors the image
 *     to the BOTTOM of the cell, so if any crop happens the studio's
 *     hologram at the bottom edge is always preserved (crop takes from
 *     the top instead).
 *   • Admin `home_order` sequence still drives display order 1:1.
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

export default function HomeGallery() {
  const { photos } = useGallery();

  const tiles = useMemo(() => {
    // Admin sequence: home_order ASC (nulls last), created_at tiebreak.
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

        <div
          data-testid="home-gallery-grid"
          className="columns-1 sm:columns-2 lg:columns-3 gap-6 md:gap-8"
        >
          {tiles.map((src, i) => (
            <figure
              key={src}
              data-testid={`home-bento-tile-${i}`}
              className="break-inside-avoid mb-6 md:mb-8 overflow-hidden bg-[var(--bg-2)] group cursor-default"
            >
              <SmartImage
                src={src}
                alt={`Caremanto Solutions luxury interior design ${i + 1} — Mumbai residential, commercial and restoration portfolio`}
                width={900}
                aspect="4/5"
                eager={i < 3}
                imgClassName="!object-cover object-[50%_100%] transition-transform duration-[900ms] group-hover:scale-[1.02]"
              />
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
