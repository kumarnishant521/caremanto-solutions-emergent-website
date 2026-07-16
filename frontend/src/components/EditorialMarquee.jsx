import Marquee from "react-fast-marquee";

const items = [
  "Redefining Spaces",
  "Interiors of Consequence",
  "Restoration as Reverence",
  "Heritage · Craft · Composition",
  "Since 2018",
];

export default function EditorialMarquee() {
  return (
    <section
      data-testid="marquee-section"
      className="relative border-y border-white/10 bg-[var(--bg-0)] py-6 md:py-8 overflow-hidden"
    >
      <Marquee speed={38} gradient={false} pauseOnHover>
        {items.map((t, i) => (
          <span key={i} className="flex items-center">
            <span className="marquee-item">{t}</span>
            <span className="marquee-dot">✦</span>
          </span>
        ))}
      </Marquee>
    </section>
  );
}
