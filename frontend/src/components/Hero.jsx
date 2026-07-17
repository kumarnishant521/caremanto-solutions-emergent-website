import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { heroImages as realHeroImages } from "../lib/realProjects";

/* ---------------------------------------------------------------------
 * HERO SLIDESHOW
 *   • Prefers real project photography from lib/realProjects.js
 *   • Falls back to curated placeholders when there aren't enough real
 *     images yet — the slideshow always cycles a full 6 slides.
 *   • Aims for a ~70 / 30 residential / commercial mix once fully populated.
 * ------------------------------------------------------------------- */
const PLACEHOLDERS = [
  { src: "https://images.pexels.com/photos/33685863/pexels-photo-33685863.jpeg?auto=compress&cs=tinysrgb&w=1920", kind: "residential" },
  { src: "https://images.pexels.com/photos/34688219/pexels-photo-34688219.jpeg?auto=compress&cs=tinysrgb&w=1920", kind: "residential" },
  { src: "https://images.pexels.com/photos/33685861/pexels-photo-33685861.jpeg?auto=compress&cs=tinysrgb&w=1920", kind: "residential" },
  { src: "https://images.pexels.com/photos/1743229/pexels-photo-1743229.jpeg?auto=compress&cs=tinysrgb&w=1920",  kind: "commercial"  },
  { src: "https://images.pexels.com/photos/1080696/pexels-photo-1080696.jpeg?auto=compress&cs=tinysrgb&w=1920",  kind: "residential" },
  { src: "https://images.pexels.com/photos/380769/pexels-photo-380769.jpeg?auto=compress&cs=tinysrgb&w=1920",   kind: "commercial"  },
];

const buildHeroImages = () => {
  const real = realHeroImages();
  if (real.length >= 6) return real;   // use ALL real hero entries (20+)
  const missing = 6 - real.length;
  return [...real, ...PLACEHOLDERS.slice(0, missing)];
};

const HERO_IMAGES = buildHeroImages();
const SLIDE_HOLD_MS  = 1600;   // ~3 s total per slide (1.6s hold + 1.4s crossfade)
const CROSSFADE_MS   = 1400;
const ORIGINS = ["center", "top left", "bottom right", "top right", "bottom left", "center", "center", "top center"];

export default function Hero() {
  const ref = useRef(null);
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState(0);
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 800], [0, 140]);

  // Preload the first two images so the cross-fade is silky from the start.
  useEffect(() => {
    HERO_IMAGES.slice(0, 2).forEach((im) => { const i = new Image(); i.src = im.src; });
    const t = setTimeout(() => setReady(true), 120);
    return () => clearTimeout(t);
  }, []);

  // Slideshow ticker — pauses when the tab is hidden to save cycles.
  useEffect(() => {
    if (typeof document !== "undefined" && document.hidden) return;
    const id = setInterval(
      () => setActive((p) => (p + 1) % HERO_IMAGES.length),
      SLIDE_HOLD_MS + CROSSFADE_MS
    );
    return () => clearInterval(id);
  }, []);

  const slides = useMemo(
    () =>
      HERO_IMAGES.map((im, idx) => ({
        ...im,
        origin: im.origin || ORIGINS[idx % ORIGINS.length],
        // negative delays de-sync each image's Ken-Burns cycle so the
        // motion never feels lock-stepped when two images cross-fade.
        delay: `-${(idx * 3.3) % 14}s`,
      })),
    []
  );

  return (
    <section
      ref={ref}
      data-testid="hero-section"
      className="relative h-[100svh] min-h-[640px] w-full overflow-hidden bg-[#14100C] text-[var(--on-dark)]"
    >
      {/* ============================ SLIDESHOW LAYER ==================== */}
      <motion.div style={{ y }} className="absolute inset-0 will-change-transform">
        {slides.map((s, idx) => (
          <div
            key={s.src}
            aria-hidden="true"
            className="hero-slide"
            data-active={idx === active ? "true" : "false"}
            style={{
              transitionDuration: `${CROSSFADE_MS}ms`,
            }}
          >
            <img
              src={s.src}
              alt=""
              loading={idx < 2 ? "eager" : "lazy"}
              className="hero-slide__img"
              style={{
                transformOrigin: s.origin,
                animationDelay: s.delay,
              }}
            />
          </div>
        ))}
      </motion.div>

      {/* Uniform darkening overlay for text contrast (~42 % black). */}
      <div className="absolute inset-0 bg-black/40 pointer-events-none z-[1]" />
      {/* Editorial bottom fade → merges into the cream page below. */}
      <div
        className="absolute inset-0 pointer-events-none z-[1]
                   bg-[linear-gradient(180deg,rgba(20,16,12,0.15)_0%,rgba(20,16,12,0.05)_35%,rgba(20,16,12,0.45)_75%,rgba(20,16,12,0.80)_92%,var(--bg-0)_100%)]"
      />

      {/* Frame corners */}
      <div className="absolute inset-8 md:inset-12 pointer-events-none z-[2]">
        <span className="absolute top-0 left-0 w-6 h-[1px] bg-[var(--gold-hi)]" />
        <span className="absolute top-0 left-0 w-[1px] h-6 bg-[var(--gold-hi)]" />
        <span className="absolute top-0 right-0 w-6 h-[1px] bg-[var(--gold-hi)]" />
        <span className="absolute top-0 right-0 w-[1px] h-6 bg-[var(--gold-hi)]" />
        <span className="absolute bottom-0 left-0 w-6 h-[1px] bg-[var(--gold-hi)]" />
        <span className="absolute bottom-0 left-0 w-[1px] h-6 bg-[var(--gold-hi)]" />
        <span className="absolute bottom-0 right-0 w-6 h-[1px] bg-[var(--gold-hi)]" />
        <span className="absolute bottom-0 right-0 w-[1px] h-6 bg-[var(--gold-hi)]" />
      </div>

      {/* ============================ FOREGROUND ========================= */}
      <div className="relative z-10 h-full flex flex-col justify-end pb-24 md:pb-28 px-6 md:px-14 max-w-[1440px] mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <span className="w-10 h-[1px] bg-[var(--gold-hi)]" />
          <span className="text-[11px] tracking-[0.28em] uppercase text-[var(--gold-hi)] font-medium">
            Caremanto · Interiors & Restoration
          </span>
        </div>

        <h1
          data-testid="hero-headline"
          className="font-serif tracking-[-0.02em] text-[clamp(2.4rem,6.5vw,5.5rem)] leading-[0.9] max-w-[900px] text-[var(--on-dark)]"
        >
          <span className={`reveal-mask d1 ${ready ? "in" : ""}`}><span>Redefining</span></span>{" "}
          <span className={`reveal-mask d2 ${ready ? "in" : ""}`}><span className="italic text-[var(--gold-hi)]">spaces</span></span><br />
          <span className={`reveal-mask d3 ${ready ? "in" : ""}`}><span>with quiet</span></span>{" "}
          <span className={`reveal-mask d4 ${ready ? "in" : ""}`}><span>authority.</span></span>
        </h1>

        <div className="mt-8 md:mt-10 grid grid-cols-1 md:grid-cols-[1fr_auto] items-end gap-8">
          <p className="max-w-xl text-[15px] md:text-[17px] leading-relaxed font-light text-[var(--on-dark-soft)]">
            An interior and restoration atelier composing residences, hospitality and
            heritage architecture — where light, material and proportion are treated
            as instruments of the everyday.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link to="/works" data-testid="hero-cta-primary" className="btn-solid-light">
              Explore Portfolio
            </Link>
            <Link to="/contact" data-testid="hero-cta-secondary" className="btn-outline-light">
              Begin a Conversation
            </Link>
          </div>
        </div>

        {/* Meta strip (static — unaffected by the slideshow) */}
        <div className="mt-14 md:mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10 border-t border-[var(--on-dark)]/15 pt-6">
          {[
            ["01", "Residential"],
            ["02", "Hospitality"],
            ["03", "Commercial"],
            ["04", "Heritage"],
          ].map(([n, l]) => (
            <div key={n} className="flex items-baseline gap-3">
              <span className="font-mono-alt text-[11px] text-[var(--gold-hi)]">{n}</span>
              <span className="font-serif text-[18px] md:text-[22px] text-[var(--on-dark)]/95">{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-6 right-8 z-10 flex items-center gap-3 text-[var(--on-dark-soft)]">
        <span className="text-[10px] tracking-[0.28em] uppercase">Scroll</span>
        <span className="block w-6 h-[1px] bg-[var(--on-dark-soft)] relative overflow-hidden">
          <span className="absolute inset-0 bg-[var(--gold-hi)] animate-[slide_2.4s_linear_infinite]" />
        </span>
      </div>

      <style>{`
        @keyframes slide { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
      `}</style>
    </section>
  );
}
