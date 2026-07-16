import { Link } from "react-router-dom";
import { Rise } from "./Rise";

const PRACTICE = [
  {
    tag: "01 / Interiors",
    title: "Residential, hospitality & commercial interiors.",
    body: "From private residences to boutique hospitality, our interior practice is a study in restraint — considered material palettes, quiet lighting, and an editorial approach to composition.",
    image: "https://images.pexels.com/photos/33685861/pexels-photo-33685861.jpeg?auto=compress&cs=tinysrgb&w=1400",
    to: "/works?category=interiors",
    cta: "Interior Portfolio",
  },
  {
    tag: "02 / Restoration & Renovation",
    title: "Heritage restoration and structural renewal.",
    body: "A dedicated wing for the preservation and adaptation of older architecture — facade renewal, structural restoration, and the sensitive reuse of built heritage.",
    image: "https://images.pexels.com/photos/7389533/pexels-photo-7389533.jpeg?auto=compress&cs=tinysrgb&w=1400",
    to: "/works?category=restoration",
    cta: "Restoration Portfolio",
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
            <span className="overline">Two Wings, One Studio</span>
          </div>
        </Rise>
        <Rise delay={90}>
          <h2 className="font-serif text-[clamp(2.4rem,6vw,5.5rem)] tracking-[-0.02em] leading-[0.95] max-w-[1000px]">
            A studio composed of two <span className="italic text-[var(--gold)]">complementary</span> practices.
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
                <h3 className="font-serif text-[28px] md:text-[38px] leading-[1.05] tracking-tight max-w-md mb-5">
                  {p.title}
                </h3>
                <p className="text-[15px] md:text-[16px] leading-relaxed text-[var(--ink)]/80 max-w-md mb-6">
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
