import { Rise } from "./Rise";
import { Link } from "react-router-dom";
import { homeGalleryImages } from "../lib/realProjects";

/**
 * Curated home imagery.
 *   • Prefers real project photography from lib/realProjects.js
 *   • Falls back to placeholders until 10 real images have been added
 *   • Aims for a ~70 / 30 residential / commercial mix (never surfaced as text)
 *   • Pure images — no titles, captions or overlays.
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

const buildTiles = () => {
  const real = homeGalleryImages().map((r) => r.src);
  const combined = [...real];
  let i = 0;
  while (combined.length < 10 && i < PLACEHOLDERS.length) {
    if (!combined.includes(PLACEHOLDERS[i])) combined.push(PLACEHOLDERS[i]);
    i++;
  }
  return combined.slice(0, 10).map((src, idx) => ({ src, span: SPANS[idx] }));
};

const TILES = buildTiles();

export default function HomeGallery() {
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
          {TILES.map((t, i) => (
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
