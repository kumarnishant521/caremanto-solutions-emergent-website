import { Rise } from "./Rise";

const CHAPTERS = [
  {
    n: "01",
    title: "Proportion First",
    body:
      "Every space begins as a proportional idea — a ratio of light, void and material — long before it becomes a mood board.",
  },
  {
    n: "02",
    title: "Material as Memory",
    body:
      "We treat stone, wood and metal as chapters of a longer story. Old, new, restored — all are held to the same standard of honesty.",
  },
  {
    n: "03",
    title: "Restoration is Reverence",
    body:
      "Our renovation practice begins with listening. Before we intervene, we document, study and preserve the language a building already speaks.",
  },
  {
    n: "04",
    title: "The Quiet Detail",
    body:
      "Reveals, shadow gaps, the meeting of two materials — the parts most people never notice — are the parts that make a room feel considered.",
  },
];

export default function Manifesto() {
  return (
    <section
      id="manifesto"
      data-testid="manifesto-section"
      className="relative bg-[var(--bg-0)] py-24 md:py-40"
    >
      <div className="max-w-[1440px] mx-auto px-6 md:px-14">
        <Rise>
          <div className="flex items-center gap-3 mb-8">
            <span className="w-10 h-[1px] bg-[var(--gold)]" />
            <span className="overline">The Manifesto</span>
          </div>
        </Rise>
        <Rise delay={80}>
          <h2 className="font-serif text-[clamp(2.4rem,6vw,5.5rem)] tracking-[-0.02em] leading-[0.95] max-w-[1100px]">
            Four chapters that quietly govern <br />
            <span className="italic text-[var(--gold)]">every room we design.</span>
          </h2>
        </Rise>

        <div className="mt-16 md:mt-24 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-20 md:gap-y-28">
          {CHAPTERS.map((c, i) => (
            <Rise key={c.n} delay={i * 90}>
              <article className="relative pl-2 md:pl-0">
                <div className="chapter-num absolute -top-8 -left-2 md:-left-6 pointer-events-none select-none">
                  {c.n}
                </div>
                <div className="relative pt-14 md:pt-16 md:pl-16">
                  <h3 className="font-serif text-[28px] md:text-[36px] leading-tight tracking-tight mb-4">
                    {c.title}
                  </h3>
                  <p className="text-[15px] md:text-[17px] leading-relaxed text-[var(--ink)]/80 max-w-lg">
                    {c.body}
                  </p>
                </div>
              </article>
            </Rise>
          ))}
        </div>
      </div>
    </section>
  );
}
