import { Rise } from "./Rise";
import { Link } from "react-router-dom";

/**
 * Curated home imagery — 7 Residential + 3 Commercial (approx. 70 / 30).
 * Tiles are laid out as an editorial bento; the 'kind' badge is a subtle
 * bronze label. Admin can eventually manage this list from Settings.
 */
const TILES = [
  // Residential (7)
  {
    kind: "Residential",
    title: "Warm Living, Bombay",
    src: "https://images.pexels.com/photos/34688219/pexels-photo-34688219.jpeg?auto=compress&cs=tinysrgb&w=1400",
    span: "md:col-span-7 md:row-span-2 aspect-[16/11]",
  },
  {
    kind: "Residential",
    title: "Bathroom, Ivory",
    src: "https://images.pexels.com/photos/6438752/pexels-photo-6438752.jpeg?auto=compress&cs=tinysrgb&w=1200",
    span: "md:col-span-5 aspect-[4/5]",
  },
  {
    kind: "Residential",
    title: "Kitchen Volume",
    src: "https://images.pexels.com/photos/2062431/pexels-photo-2062431.jpeg?auto=compress&cs=tinysrgb&w=1200",
    span: "md:col-span-5 md:mt-[-20px] aspect-[4/5]",
  },
  {
    kind: "Residential",
    title: "Foyer of Light",
    src: "https://images.pexels.com/photos/2724749/pexels-photo-2724749.jpeg?auto=compress&cs=tinysrgb&w=1200",
    span: "md:col-span-4 aspect-[4/5]",
  },
  {
    kind: "Residential",
    title: "Bath as Ceremony",
    src: "https://images.pexels.com/photos/1454804/pexels-photo-1454804.jpeg?auto=compress&cs=tinysrgb&w=1200",
    span: "md:col-span-3 md:mt-16 aspect-[3/4]",
  },
  // Commercial (3)
  {
    kind: "Commercial",
    title: "Atelier Marine Drive",
    src: "https://images.pexels.com/photos/380769/pexels-photo-380769.jpeg?auto=compress&cs=tinysrgb&w=1200",
    span: "md:col-span-5 aspect-[16/10]",
  },
  {
    kind: "Residential",
    title: "Dining, Kolkata",
    src: "https://images.pexels.com/photos/1080696/pexels-photo-1080696.jpeg?auto=compress&cs=tinysrgb&w=1200",
    span: "md:col-span-6 md:mt-[-30px] aspect-[16/10]",
  },
  {
    kind: "Commercial",
    title: "Boutique, Pune",
    src: "https://images.pexels.com/photos/291762/pexels-photo-291762.jpeg?auto=compress&cs=tinysrgb&w=1200",
    span: "md:col-span-6 aspect-[16/10]",
  },
  {
    kind: "Residential",
    title: "Reading Nook",
    src: "https://images.pexels.com/photos/6969831/pexels-photo-6969831.jpeg?auto=compress&cs=tinysrgb&w=1200",
    span: "md:col-span-5 md:mt-16 aspect-[3/4]",
  },
  {
    kind: "Commercial",
    title: "Hospitality Lobby",
    src: "https://images.pexels.com/photos/1743229/pexels-photo-1743229.jpeg?auto=compress&cs=tinysrgb&w=1200",
    span: "md:col-span-7 aspect-[16/11]",
  },
];

// Sanity-checked: 7 Residential + 3 Commercial → 70 / 30 exactly.

export default function HomeGallery() {
  return (
    <section
      id="home-gallery"
      data-testid="home-gallery-section"
      className="relative bg-[var(--bg-0)] py-24 md:py-36"
    >
      <div className="max-w-[1500px] mx-auto px-6 md:px-14">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14 md:mb-20">
          <Rise>
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span className="w-10 h-[1px] bg-[var(--gold)]" />
                <span className="overline">Selected Imagery</span>
              </div>
              <h2 className="font-serif text-[clamp(2.4rem,6vw,5.5rem)] tracking-[-0.02em] leading-[0.95] max-w-[900px] text-[var(--ink)]">
                A quiet library of <span className="italic text-[var(--gold)]">residences</span>,<br />
                with a considered edit of <span className="italic text-[var(--gold)]">commercial</span> work.
              </h2>
              <div className="mt-6 flex items-center gap-4 text-[12px] text-[var(--muted)] font-mono-alt tracking-[0.16em] uppercase">
                <span><span className="text-[var(--ink)]">70%</span> Residential</span>
                <span className="w-[1px] h-4 bg-[var(--line-strong)]" />
                <span><span className="text-[var(--ink)]">30%</span> Commercial</span>
              </div>
            </div>
          </Rise>
          <Rise delay={120}>
            <Link to="/works" data-testid="home-gallery-cta" className="btn-pill">
              Full Portfolio
            </Link>
          </Rise>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
          {TILES.map((t, i) => (
            <Rise key={i} delay={(i % 5) * 70} className={t.span}>
              <figure className="proj-card group h-full">
                <img
                  src={t.src}
                  alt={t.title}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
                <figcaption className="absolute inset-x-0 bottom-0 z-10 p-5 md:p-7 flex items-end justify-between gap-4">
                  <div>
                    <div className="text-[10px] tracking-[0.28em] uppercase text-[var(--gold-hi)] mb-2 font-medium">
                      {t.kind}
                    </div>
                    <div className="font-serif text-[20px] md:text-[26px] leading-none text-white">
                      {t.title}
                    </div>
                  </div>
                  <span className="hidden md:inline-flex w-9 h-9 rounded-full border border-white/40 text-white items-center justify-center group-hover:border-[var(--gold-hi)] group-hover:bg-[var(--gold-hi)] group-hover:text-white transition-colors">↗</span>
                </figcaption>
              </figure>
            </Rise>
          ))}
        </div>
      </div>
    </section>
  );
}
