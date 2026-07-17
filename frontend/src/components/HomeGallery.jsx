import { useEffect, useState } from "react";
import { Rise } from "./Rise";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { homeGalleryImages } from "../lib/realProjects";

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
  const [tiles, setTiles] = useState([]);

  useEffect(() => {
    // First, ask the backend for any photos the admin has featured on the home page.
    api.get("/gallery")
      .then((r) => {
        const featured = (r.data || []).filter((p) => p.featured_home).map((p) => p.image);
        const real = homeGalleryImages().map((r2) => r2.src);
        const combined = [];
        [...featured, ...real, ...PLACEHOLDERS].forEach((src) => {
          if (src && !combined.includes(src) && combined.length < 10) combined.push(src);
        });
        setTiles(combined.map((src, idx) => ({ src, span: SPANS[idx] })));
      })
      .catch(() => {
        // Fallback: only realProjects.js + placeholders
        const real = homeGalleryImages().map((r) => r.src);
        const combined = [];
        [...real, ...PLACEHOLDERS].forEach((src) => {
          if (src && !combined.includes(src) && combined.length < 10) combined.push(src);
        });
        setTiles(combined.map((src, idx) => ({ src, span: SPANS[idx] })));
      });
  }, []);

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

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
          {tiles.map((t, i) => (
            <Rise key={i} delay={(i % 5) * 70} className={t.span}>
              <figure className="relative overflow-hidden bg-[var(--bg-2)] h-full group">
                <img
                  src={t.src}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.2,0.7,0.15,1)] group-hover:scale-[1.04]"
                />
              </figure>
            </Rise>
          ))}
        </div>
      </div>
    </section>
  );
}
