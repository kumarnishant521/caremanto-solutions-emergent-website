import { useEffect, useState } from "react";
import { Rise } from "./Rise";
import { Link } from "react-router-dom";
import { homeGalleryImages } from "../lib/realProjects";
import SmartImage from "./SmartImage";
import { useGallery } from "../lib/useGallery";

/**
 * Home page image bento — the scroll section.
 *
 * Priority order for the tiles:
 *   1. Gallery photographs the admin marked `featured_home` from /admin
 *   2. Real project images from /lib/realProjects.js (placement includes "home")
 *   3. Curated Pexels placeholders (final fallback)
 *
 * The 70 / 30 residential-to-commercial rule shapes the mix silently — no text.
 */

const SPANS = [
  "md:col-span-7 md:row-span-2 aspect-[16/11]",
  "md:col-span-5 aspect-[4/5]",
  "md:col-span-5 md:mt-[-20px] aspect-[4/5]",
  "md:col-span-4 aspect-[4/5]",
  "md:col-span-3 md:mt-16 aspect-[3/4]",
  "md:col-span-6 md:mt-[-30px] aspect-[16/10]",
  "md:col-span-5 md:mt-16 aspect-[3/4]",
  "md:col-span-5 aspect-[16/10]",
  "md:col-span-6 aspect-[16/10]",
  "md:col-span-7 aspect-[16/11]",
];

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

export default function HomeGallery() {
  const { photos } = useGallery();
  const [tiles, setTiles] = useState([]);

  useEffect(() => {
    // Build the home-page bento from the shared /api/gallery cache — no
    // additional network call. If the admin has featured photos, use those;
    // otherwise fall back to the curated real-projects list, then placeholders.
    // Strictly respect the admin's saved sequence: sort by `home_order` asc
    // (nulls last), then created_at as a stable tiebreaker. This keeps the
    // homepage bento in exact 1:1 sync with /admin → Home Sequence.
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
    setTiles(combined.map((src) => ({ src })));
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

        {/*
          Masonry columns preserve every image's natural aspect ratio, so
          nothing is cropped (watermarks at the bottom edge stay visible)
          and tiles pack tightly with no wide blank margins.
        */}
        <div
          data-testid="home-gallery-grid"
          className="columns-1 sm:columns-2 lg:columns-3 gap-4 md:gap-6 [column-fill:_balance]"
        >
          {tiles.map((t, i) => (
            <Rise
              key={i}
              delay={(i % 5) * 60}
              className="mb-4 md:mb-6 break-inside-avoid block"
            >
              <figure className="relative overflow-hidden bg-[var(--bg-2)] group" style={{ aspectRatio: "4/5" }}>
                <SmartImage
                  src={t.src}
                  alt=""
                  width={900}
                  aspect="4/5"
                  className="w-full h-full"
                  imgClassName="transition-transform duration-[1200ms] ease-[cubic-bezier(0.2,0.7,0.15,1)] group-hover:scale-[1.03]"
                  fallbackText="—"
                />
              </figure>
            </Rise>
          ))}
        </div>
      </div>
    </section>
  );
}
