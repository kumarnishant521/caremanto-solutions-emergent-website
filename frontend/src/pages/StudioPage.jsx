import { Rise } from "../components/Rise";
import { Link } from "react-router-dom";

export default function StudioPage() {
  return (
    <main data-testid="studio-page" className="pt-32 pb-24 md:pt-40 md:pb-32 bg-[var(--bg-0)]">
      <div className="max-w-[1440px] mx-auto px-6 md:px-14">
        <Rise>
          <div className="flex items-center gap-3 mb-6">
            <span className="w-10 h-[1px] bg-[var(--gold)]" />
            <span className="overline">The Studio</span>
          </div>
        </Rise>
        <Rise delay={80}>
          <h1 className="font-serif text-[clamp(2.8rem,8vw,7rem)] tracking-[-0.02em] leading-[0.9] max-w-5xl">
            An atelier of <span className="italic text-[var(--gold)]">quiet consequence.</span>
          </h1>
        </Rise>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-12 gap-10">
          <Rise delay={120} className="md:col-span-5">
            <div className="aspect-[4/5] overflow-hidden">
              <img
                src="https://images.pexels.com/photos/33685863/pexels-photo-33685863.jpeg"
                alt="Studio work"
                className="w-full h-full object-cover"
              />
            </div>
          </Rise>
          <Rise delay={180} className="md:col-span-7 md:pt-12">
            <p className="font-serif italic text-[clamp(1.4rem,2.6vw,2rem)] leading-[1.35] text-[var(--ink)]/90 mb-8">
              "Caremanto Solutions was founded on a simple premise — that great architecture
              is a slow, considered conversation between old and new."
            </p>
            <p className="text-[15px] md:text-[16px] leading-relaxed text-[var(--ink)]/80 mb-6">
              We are a full-service studio composing residential, commercial, and hospitality
              interiors alongside a dedicated wing for restoration, renovation, and heritage work.
              Our approach is editorial: fewer moves, better materials, longer conversations.
            </p>
            <p className="text-[15px] md:text-[16px] leading-relaxed text-[var(--ink)]/80 mb-10">
              From private residences to boutique hotels and century-old facades — every project
              is composed with proportion, restraint, and the belief that buildings should
              outlive their trends.
            </p>

            <div className="grid grid-cols-3 gap-6 border-t border-white/10 pt-8">
              <Stat n="80+" l="Projects Delivered" />
              <Stat n="12" l="Cities" />
              <Stat n="6" l="Years of Craft" />
            </div>
          </Rise>
        </div>

        <div className="mt-24 md:mt-32 grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            ["Interiors Wing", "Residential, hospitality, retail and bespoke furniture — an editorial approach to material, light and proportion."],
            ["Restoration & Renovation Wing", "Heritage restoration, facade renewal, adaptive reuse and structural renovation — reverent, precise, thoroughly documented."],
          ].map(([t, b], i) => (
            <Rise key={t} delay={i * 100}>
              <div className="p-8 md:p-10 border border-white/10 bg-[var(--bg-1)]">
                <div className="overline text-[10px] text-[var(--gold)] mb-4">{i === 0 ? "Wing 01" : "Wing 02"}</div>
                <h3 className="font-serif text-[28px] md:text-[36px] leading-tight tracking-tight mb-4">{t}</h3>
                <p className="text-[15px] leading-relaxed text-[var(--ink)]/80">{b}</p>
              </div>
            </Rise>
          ))}
        </div>

        <div className="mt-24 text-center">
          <Link to="/contact" data-testid="studio-cta" className="btn-gold">Begin a Conversation</Link>
        </div>
      </div>
    </main>
  );
}

function Stat({ n, l }) {
  return (
    <div>
      <div className="font-serif text-[clamp(2rem,3.6vw,3rem)] text-[var(--gold)] leading-none">{n}</div>
      <div className="mt-2 overline text-[10px] text-[var(--muted)]">{l}</div>
    </div>
  );
}
