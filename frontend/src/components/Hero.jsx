import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";

const HERO_IMG =
  "https://images.pexels.com/photos/33685863/pexels-photo-33685863.jpeg";

export default function Hero() {
  const ref = useRef(null);
  const [ready, setReady] = useState(false);
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 800], [0, 180]);
  const scale = useTransform(scrollY, [0, 800], [1, 1.08]);
  const overlay = useTransform(scrollY, [0, 600], [0.35, 0.75]);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 120);
    return () => clearTimeout(t);
  }, []);

  return (
    <section
      ref={ref}
      data-testid="hero-section"
      className="relative h-[100svh] min-h-[640px] w-full overflow-hidden"
    >
      {/* Parallax image */}
      <motion.div
        style={{ y, scale }}
        className="absolute inset-0 will-change-transform"
      >
        <img
          src={HERO_IMG}
          alt="Interior architecture study"
          className="w-full h-full object-cover"
          loading="eager"
        />
      </motion.div>
      <motion.div style={{ opacity: overlay }} className="absolute inset-0 bg-[var(--bg-0)]" />
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-0)] via-transparent to-transparent" />

      {/* Frame corners */}
      <div className="absolute inset-8 md:inset-12 pointer-events-none z-[2]">
        <span className="absolute top-0 left-0 w-6 h-[1px] bg-[var(--gold)]" />
        <span className="absolute top-0 left-0 w-[1px] h-6 bg-[var(--gold)]" />
        <span className="absolute top-0 right-0 w-6 h-[1px] bg-[var(--gold)]" />
        <span className="absolute top-0 right-0 w-[1px] h-6 bg-[var(--gold)]" />
        <span className="absolute bottom-0 left-0 w-6 h-[1px] bg-[var(--gold)]" />
        <span className="absolute bottom-0 left-0 w-[1px] h-6 bg-[var(--gold)]" />
        <span className="absolute bottom-0 right-0 w-6 h-[1px] bg-[var(--gold)]" />
        <span className="absolute bottom-0 right-0 w-[1px] h-6 bg-[var(--gold)]" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-end pb-20 md:pb-24 px-6 md:px-14 max-w-[1440px] mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <span className="w-10 h-[1px] bg-[var(--gold)]" />
          <span className="overline">Caremanto Solutions · Est. Studio of Craft</span>
        </div>

        <h1
          data-testid="hero-headline"
          className="font-serif tracking-[-0.02em] text-[clamp(3.2rem,10vw,9rem)] leading-[0.86] max-w-[1100px]"
        >
          <span className={`reveal-mask d1 ${ready ? "in" : ""}`}><span>Redefining</span></span>{" "}
          <span className={`reveal-mask d2 ${ready ? "in" : ""}`}><span className="italic text-[var(--gold)]">spaces</span></span><br />
          <span className={`reveal-mask d3 ${ready ? "in" : ""}`}><span>with quiet</span></span>{" "}
          <span className={`reveal-mask d4 ${ready ? "in" : ""}`}><span>authority.</span></span>
        </h1>

        <div className="mt-8 md:mt-10 grid grid-cols-1 md:grid-cols-[1fr_auto] items-end gap-8">
          <p className="max-w-xl text-[15px] md:text-[17px] leading-relaxed text-[var(--ink)]/85 font-light">
            An interior and restoration atelier composing residences, hospitality and
            heritage architecture — where light, material and proportion are treated
            as instruments of the everyday.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link to="/works" data-testid="hero-cta-primary" className="btn-gold">
              Explore Portfolio
            </Link>
            <Link to="/contact" data-testid="hero-cta-secondary" className="btn-pill">
              Begin a Conversation
            </Link>
          </div>
        </div>

        {/* Meta strip */}
        <div className="mt-14 md:mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10 border-t border-white/10 pt-6">
          {[
            ["01", "Residential"],
            ["02", "Hospitality"],
            ["03", "Heritage"],
            ["04", "Adaptive Reuse"],
          ].map(([n, l]) => (
            <div key={n} className="flex items-baseline gap-3">
              <span className="font-mono-alt text-[11px] text-[var(--gold)]">{n}</span>
              <span className="font-serif text-[18px] md:text-[22px] text-[var(--ink)]/90">{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* scroll cue */}
      <div className="absolute bottom-6 right-8 z-10 flex items-center gap-3 text-[var(--muted)]">
        <span className="overline text-[10px]">Scroll</span>
        <span className="block w-6 h-[1px] bg-[var(--muted)] relative overflow-hidden">
          <span className="absolute inset-0 bg-[var(--gold)] animate-[slide_2.4s_linear_infinite]" />
        </span>
      </div>

      <style>{`
        @keyframes slide { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
      `}</style>
    </section>
  );
}
