import Marquee from "react-fast-marquee";

/**
 * Editorial marquee — brand-value ticker.
 *
 * Every slot has identical horizontal spacing:
 *   `[ITEM]  ✦  [ITEM]  ✦  [ITEM]  ✦  …`
 *  |—2.5rem—|—2.5rem—|—2.5rem—|
 *
 * Achieved by giving BOTH the item and the dot the same right-side padding
 * and NO left padding — so every visible gap is exactly one padding stride.
 */
const items = [
  "INTERIORS",
  "RESTORATION",
  "REDEFINING SPACES",
  "SERVICES",
];

export default function EditorialMarquee() {
  return (
    <section
      data-testid="marquee-section"
      className="relative border-y border-[var(--line)] bg-[var(--bg-0)] py-6 md:py-8 overflow-hidden"
    >
      <Marquee speed={38} gradient={false} pauseOnHover>
        {items.map((t, i) => (
          <span key={i} className="marquee-slot">
            <span className="marquee-item">{t}</span>
            <span className="marquee-dot" aria-hidden="true">✦</span>
          </span>
        ))}
      </Marquee>
    </section>
  );
}
