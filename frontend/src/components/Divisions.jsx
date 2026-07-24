import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Rise } from "./Rise";
import { api } from "../lib/api";
import { useHomeCopy } from "../lib/useSiteSettings";

/**
 * Divisions — the "Two disciplines. One studio." band below the hero.
 *
 * Every user-facing string is CMS-editable via Admin → Text Customization
 * → Home Page Copy → Divisions Band. Blank fields fall back to the studio's
 * compiled defaults so the section always renders.
 *
 * Cover images stay in the Covers admin panel (`interiors_cover`,
 * `restoration_cover`).
 */
export default function Divisions() {
  const [covers, setCovers] = useState({});
  useEffect(() => {
    api.get("/covers").then((r) => setCovers(r.data || {})).catch(() => {});
  }, []);

  const c = useHomeCopy("divisions", {
    eyebrow:  "TWO WINGS, ONE STUDIO",
    title:    "A STUDIO COMPOSED OF TWO COMPLEMENTARY PRACTICES.",
    lede:     "",   // optional — only rendered when the admin fills it
    d1_title: "INTERIORS",
    d1_body:  "From private residences to boutique hospitality, our interior practice is a study in restraint — considered material palettes, quiet lighting, and an editorial approach to composition.",
    d1_cta:   "INTERIOR PORTFOLIO",
    d2_title: "RENOVATIONS / RESTORATIONS",
    d2_body:  "A dedicated wing for the preservation and adaptation of older architecture — facade renewal, structural restoration, and the sensitive reuse of built heritage.",
    d2_cta:   "RESTORATION PORTFOLIO",
  });

  const cards = [
    {
      title:    (c.d1_title || "INTERIORS").toUpperCase(),
      body:     (c.d1_body  || "").toUpperCase(),
      cta:      (c.d1_cta   || "INTERIOR PORTFOLIO").toUpperCase(),
      to:       "/works?category=interiors",
      image:    covers.interiors_cover  || "https://lh3.googleusercontent.com/d/1F9U9UjI9CHuxR-AkUvJZQRrom_oF10pm=w1400",
    },
    {
      title:    (c.d2_title || "RENOVATIONS / RESTORATIONS").toUpperCase(),
      body:     (c.d2_body  || "").toUpperCase(),
      cta:      (c.d2_cta   || "RESTORATION PORTFOLIO").toUpperCase(),
      to:       "/works?category=restoration",
      image:    covers.restoration_cover || "https://lh3.googleusercontent.com/d/1tMuPICaLjYIn8smCG0cize45rzG9DKPo=w1400",
    },
  ];

  return (
    <section
      id="divisions"
      data-testid="divisions-section"
      className="relative bg-[var(--bg-1)] py-24 md:py-32"
    >
      <div className="max-w-[1440px] mx-auto px-6 md:px-14">
        <Rise>
          <div className="flex items-center gap-3 mb-8">
            <span className="w-10 h-[1px] bg-[var(--gold)]" />
            <span data-testid="divisions-eyebrow" className="overline text-[var(--gold)]">
              {c.eyebrow.toUpperCase()}
            </span>
          </div>
        </Rise>
        <Rise delay={90}>
          <h2
            data-testid="divisions-headline"
            className="text-[var(--ink)] font-sans-alt uppercase font-medium max-w-[1100px]
                       text-[clamp(1.25rem,2.15vw,1.9rem)]
                       tracking-[0.15em] leading-[1.55]"
            style={{ fontFamily: "'Montserrat', 'Manrope', 'Outfit', sans-serif" }}
          >
            {c.title}
          </h2>
        </Rise>
        {c.lede && (
          <Rise delay={160}>
            <p
              data-testid="divisions-lede"
              className="mt-6 max-w-[720px] text-[13px] md:text-[14px] tracking-[0.05em]
                         leading-[1.85] text-[var(--ink)]/70"
            >
              {c.lede}
            </p>
          </Rise>
        )}

        <div className="mt-16 md:mt-24 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">
          {cards.map((p, i) => (
            <Rise key={i} delay={i * 120}>
              <article className={`${i === 1 ? "md:mt-24" : ""}`}>
                <div className="aspect-[4/5] overflow-hidden mb-8 relative bg-[var(--bg-2)]">
                  <img
                    src={p.image}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <h3
                  data-testid={`division-title-${i}`}
                  className="text-[var(--ink)] uppercase font-medium mb-5 max-w-md
                             text-[clamp(1rem,1.5vw,1.35rem)]
                             tracking-[0.14em] leading-[1.5]"
                  style={{ fontFamily: "'Montserrat', 'Manrope', 'Outfit', sans-serif" }}
                >
                  {p.title}
                </h3>
                <p
                  data-testid={`division-body-${i}`}
                  className="text-[var(--ink)]/75 mb-6 max-w-md
                             text-[11px] md:text-[12px]
                             tracking-[0.14em] leading-[1.9] uppercase"
                  style={{ fontFamily: "'Montserrat', 'Manrope', 'Outfit', sans-serif" }}
                >
                  {p.body}
                </p>
                <Link
                  data-testid={`division-cta-${i}`}
                  to={p.to}
                  className="inline-flex items-center gap-3 overline text-[11px] text-[var(--gold)] hover:text-[var(--gold-hi)] transition-colors"
                >
                  <span>{p.cta}</span>
                  <span className="w-8 h-[1px] bg-current" />
                </Link>
              </article>
            </Rise>
          ))}
        </div>
      </div>
    </section>
  );
}
