import { Link } from "react-router-dom";
import { Rise } from "./Rise";

const PRACTICE = [
  {
    tag: "01 / DIVISION",
    title: "INTERIORS",
    body:
      "FROM PRIVATE RESIDENCES TO BOUTIQUE HOSPITALITY, OUR INTERIOR PRACTICE IS A STUDY IN RESTRAINT — CONSIDERED MATERIAL PALETTES, QUIET LIGHTING, AND AN EDITORIAL APPROACH TO COMPOSITION.",
    image: "https://lh3.googleusercontent.com/d/1F9U9UjI9CHuxR-AkUvJZQRrom_oF10pm=w1400",
    to: "/works?category=interiors",
    cta: "INTERIOR PORTFOLIO",
  },
  {
    tag: "02 / DIVISION",
    title: "RENOVATIONS / RESTORATIONS",
    body:
      "A DEDICATED WING FOR THE PRESERVATION AND ADAPTATION OF OLDER ARCHITECTURE — FACADE RENEWAL, STRUCTURAL RESTORATION, AND THE SENSITIVE REUSE OF BUILT HERITAGE.",
    image: "https://lh3.googleusercontent.com/d/1tMuPICaLjYIn8smCG0cize45rzG9DKPo=w1400",
    to: "/works?category=restoration",
    cta: "RESTORATION PORTFOLIO",
  },
];

export default function Divisions() {
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
            <span className="overline text-[var(--gold)]">TWO WINGS, ONE STUDIO</span>
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
            A STUDIO COMPOSED OF TWO COMPLEMENTARY PRACTICES.
          </h2>
        </Rise>

        <div className="mt-16 md:mt-24 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">
          {PRACTICE.map((p, i) => (
            <Rise key={p.tag} delay={i * 120}>
              <article className={`${i === 1 ? "md:mt-24" : ""}`}>
                <div className="aspect-[4/5] overflow-hidden mb-8 relative">
                  <img
                    src={p.image}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <span className="absolute top-4 left-4 overline text-[10px] bg-[var(--bg-0)]/85 backdrop-blur px-3 py-1.5 border border-[var(--line)]">
                    {p.tag}
                  </span>
                </div>
                <h3
                  className="text-[var(--ink)] uppercase font-medium mb-5 max-w-md
                             text-[clamp(1rem,1.5vw,1.35rem)]
                             tracking-[0.14em] leading-[1.5]"
                  style={{ fontFamily: "'Montserrat', 'Manrope', 'Outfit', sans-serif" }}
                >
                  {p.title}
                </h3>
                <p
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
