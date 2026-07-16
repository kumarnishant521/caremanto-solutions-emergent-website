import Marquee from "react-fast-marquee";

const items = [
  "REDEFINING SPACES",
  "INTERIORS",
  "RESTORATION",
];

export default function EditorialMarquee() {
  return (
    <section
      data-testid="marquee-section"
      className="relative border-y border-[var(--line)] bg-[var(--bg-0)] py-6 md:py-8 overflow-hidden"
    >
      <Marquee speed={38} gradient={false} pauseOnHover>
        {items.map((t, i) => (
          <span key={i} className="inline-flex items-center align-middle">
            <span className="marquee-item">{t}</span>
            <span className="marquee-dot" aria-hidden="true">✦</span>
          </span>
        ))}
      </Marquee>
    </section>
  );
}
