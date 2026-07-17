import { Rise } from "./Rise";

/**
 * Client Testimonials — sits parallel to "Note from Studio" in tone and
 * spacing. Reads a curated static list; can be swapped for a live backend
 * feed later without shifting the layout.
 */
const TESTIMONIALS = [
  {
    quote:
      "Caremanto redefined our apartment with quiet confidence. Every material choice felt considered — the space now belongs to us, not to a trend.",
    author: "A. Mehta",
    role: "Residence · Bandra West",
  },
  {
    quote:
      "The restoration of our heritage bungalow was handled with real reverence. Timelines held; craftsmanship never compromised. A rare firm.",
    author: "R. Kapadia",
    role: "Heritage Restoration · Colaba",
  },
  {
    quote:
      "Warm, precise, and endlessly patient with our brief. Our hospitality space now carries the calm authority we wanted from day one.",
    author: "S. Nair",
    role: "Boutique Hotel · Alibaug",
  },
];

export default function Testimonials() {
  return (
    <section
      data-testid="testimonials-section"
      className="relative bg-[var(--bg-0)] py-24 md:py-32 border-t border-[var(--line)]"
    >
      <div className="max-w-[1440px] mx-auto px-6 md:px-14">
        <Rise>
          <div className="overline mb-8 text-center">Client Testimonials</div>
        </Rise>
        <Rise delay={80}>
          <h2 className="font-serif italic text-[clamp(1.6rem,3.4vw,2.8rem)] leading-[1.15] tracking-tight text-[var(--ink)]/90 text-center mb-16 max-w-3xl mx-auto">
            "Rooms remembered fondly — and lived in easily."
          </h2>
        </Rise>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
          {TESTIMONIALS.map((t, i) => (
            <Rise key={t.author} delay={i * 80}>
              <figure
                data-testid={`testimonial-${i}`}
                className="h-full border border-[var(--line)] p-8 md:p-10 bg-[var(--bg-1)] flex flex-col"
              >
                <span className="font-serif text-[36px] text-[var(--gold)] leading-none">&ldquo;</span>
                <blockquote className="mt-4 flex-1 text-[14px] md:text-[15px] leading-relaxed text-[var(--ink)]/85 font-light">
                  {t.quote}
                </blockquote>
                <figcaption className="mt-8 pt-6 border-t border-[var(--line)]">
                  <div className="font-serif text-[18px] text-[var(--ink)]">{t.author}</div>
                  <div className="overline text-[10px] mt-1 text-[var(--muted)]">{t.role}</div>
                </figcaption>
              </figure>
            </Rise>
          ))}
        </div>
      </div>
    </section>
  );
}
