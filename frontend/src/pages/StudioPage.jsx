import { Rise } from "../components/Rise";
import ConsultButton from "../components/ConsultButton";
import Head from "../components/Head";

/**
 * About / Studio page.
 * Copy is Caremanto's own (adapted from caremanto.in/about-us) but the
 * typography, spacing, palette and rhythm are all inherited from this
 * project's luxury neutral sans-serif system — no legacy CSS imported.
 */
const TEAM = [
  {
    name: "Sanjay Kumar",
    role: "Founder · CEO",
    photo: "https://caremanto.in/wp-content/uploads/2023/08/TeamSanjayKumar2.png",
    bio: "A management graduate from IMS Indore with three decades of experience across consumer, automotive and electronics. Before Caremanto, Sanjay was Senior Vice President at TATA Sky. He founded Caremanto in 2018 to bring sustainable, considered renovation and restoration to a discerning clientele.",
  },
  {
    name: "Rajat Sinha",
    role: "Director",
    photo: "https://caremanto.in/wp-content/uploads/2023/08/TeamRajatSinha.jpg",
    bio: "An alumnus of IIT Chennai and XLRI Jamshedpur, Rajat leads business strategy and service benchmarking. He has built and scaled businesses across software, consumer and telecom, in India and abroad.",
  },
  {
    name: "Ravi Agrawal",
    role: "Director",
    photo: "https://caremanto.in/wp-content/uploads/2023/08/TeamRaviAgarwal.jpg",
    bio: "A civil engineer specialising in structural work on residential and high-rise buildings. Ravi and his team have delivered 700+ renovations across India, from corporate offices to government establishments and railway stations.",
  },
  {
    name: "Nishant Singh",
    role: "Head · Marketing",
    photo: "https://caremanto.in/wp-content/uploads/2023/08/TeamNishantSingh-1.jpg",
    bio: "An alumnus of Welingker Institute of Management and H R College, Mumbai. Nishant leads digital strategy and marketing at Caremanto.",
  },
];

const FEATURES = [
  {
    title: "Professional Renovation Company",
    body: "Three ideas guide the work: timelines, transparency and total quality. Every material used is disclosed to the client, and stage-wise completion schedules are shared and honoured.",
  },
  {
    title: "Warranty For Services",
    body: "Every service comes with a warranty period, specified at quotation. It is our written commitment to the quality of the craft and to our clients.",
  },
  {
    title: "Highly Skilled Labour Force",
    body: "We use the latest technology and materials in India, delivered by a highly trained, category-rated workforce. We do not believe in one-size-fits-all when it comes to craftspeople.",
  },
  {
    title: "Weekly Work Update",
    body: "Clients can follow their project through a private site gallery — photographs and short films uploaded through the week — so nothing about the work is opaque.",
  },
];

export default function StudioPage() {
  return (
    <main data-testid="studio-page" className="pt-32 pb-24 md:pt-40 md:pb-32 bg-[var(--bg-0)]">
      <Head
        title="About the Studio · Caremanto Solutions · Luxury Interior Design Mumbai"
        description="Founded 2018 in Mumbai, Caremanto Solutions is a luxury interior design, renovation and restoration studio. Meet the team, philosophy, and craft standard behind our editorial work."
        canonical="https://caremanto.in/studio"
        keywords="interior design studio Mumbai, luxury interior designer India, Caremanto Solutions team, boutique architecture firm, restoration studio Mumbai"
      />
      <div className="max-w-[1440px] mx-auto px-6 md:px-14">
        {/* --------- Editorial header --------- */}
        <Rise>
          <div className="flex items-center gap-3 mb-6">
            <span className="w-10 h-[1px] bg-[var(--gold)]" />
            <span className="overline">About Caremanto</span>
          </div>
        </Rise>
        <Rise delay={80}>
          <h1 className="font-serif text-[clamp(2.8rem,8vw,7rem)] tracking-[-0.02em] leading-[0.9] max-w-5xl">
            An atelier of <span className="italic text-[var(--gold)]">quiet consequence.</span>
          </h1>
        </Rise>

        {/* --------- The story --------- */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-12 gap-10">
          <Rise delay={120} className="md:col-span-5">
            <div className="aspect-[4/5] overflow-hidden">
              <img
                src="https://images.pexels.com/photos/33685863/pexels-photo-33685863.jpeg"
                alt="Caremanto atelier"
                className="w-full h-full object-cover"
              />
            </div>
          </Rise>
          <Rise delay={180} className="md:col-span-7 md:pt-8">
            <p className="font-serif italic text-[clamp(1.4rem,2.6vw,2rem)] leading-[1.35] text-[var(--ink)]/90 mb-8">
              "Caremanto was established in response to the growing need for quality
              interiors, renovation and restoration in the city."
            </p>
            <p className="text-[15px] md:text-[16px] leading-relaxed text-[var(--ink)]/85 mb-6">
              Founded in 2018, we have grown into one of Mumbai's leading renovation and
              restoration studios, serving a discerning clientele across residential,
              hospitality, commercial and heritage architecture. Renovation, for us, is
              upgrade and re-composition — restoration is the careful return of a place
              to its original grammar.
            </p>
            <p className="text-[15px] md:text-[16px] leading-relaxed text-[var(--ink)]/85 mb-10">
              A considered renovation goes beyond the visual — it improves the way a home
              functions, the way a workspace performs, and the enduring value of the
              property itself. Our work is composed with proportion, restraint and the
              belief that buildings should outlive their trends.
            </p>

            <div className="grid grid-cols-3 gap-6 border-t border-[var(--line)] pt-8">
              <Stat n="700+" l="Renovations Delivered" />
              <Stat n="12" l="Cities" />
              <Stat n="2018" l="Est." />
            </div>
          </Rise>
        </div>

        {/* --------- Our features --------- */}
        <div className="mt-24 md:mt-32">
          <Rise>
            <div className="overline mb-4">Our Features</div>
          </Rise>
          <Rise delay={70}>
            <h2 className="font-serif text-[clamp(2rem,5vw,3.6rem)] tracking-[-0.01em] leading-[1] max-w-3xl mb-14">
              How we <span className="italic text-[var(--gold)]">work.</span>
            </h2>
          </Rise>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {FEATURES.map((f, i) => (
              <Rise key={f.title} delay={i * 70}>
                <div data-testid={`studio-feature-${i}`} className="border border-[var(--line)] bg-[var(--bg-1)] p-8 md:p-10 h-full">
                  <div className="overline text-[10px] text-[var(--gold)] mb-4">{`0${i + 1}`}</div>
                  <h3 className="font-serif text-[26px] md:text-[30px] leading-tight tracking-tight mb-4">{f.title}</h3>
                  <p className="text-[14px] md:text-[15px] leading-relaxed text-[var(--ink)]/80">{f.body}</p>
                </div>
              </Rise>
            ))}
          </div>
        </div>

        {/* --------- Team --------- */}
        <div className="mt-24 md:mt-32">
          <Rise>
            <div className="overline mb-4">The People</div>
          </Rise>
          <Rise delay={70}>
            <h2 className="font-serif text-[clamp(2rem,5vw,3.6rem)] tracking-[-0.01em] leading-[1] max-w-3xl mb-14">
              A studio of <span className="italic text-[var(--gold)]">seasoned hands.</span>
            </h2>
          </Rise>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
            {TEAM.map((m, i) => (
              <Rise key={m.name} delay={i * 80}>
                <figure data-testid={`studio-team-${i}`} className="flex flex-col">
                  <div className="aspect-[4/5] overflow-hidden bg-[var(--bg-1)]">
                    <img src={m.photo} alt={m.name} loading="lazy" className="w-full h-full object-cover" />
                  </div>
                  <figcaption className="mt-6">
                    <div className="overline text-[10px] text-[var(--gold)] mb-1">{m.role}</div>
                    <div className="font-serif text-[26px] leading-tight mb-3">{m.name}</div>
                    <p className="text-[13px] md:text-[14px] leading-relaxed text-[var(--ink)]/75">{m.bio}</p>
                  </figcaption>
                </figure>
              </Rise>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-24 flex justify-center">
          <ConsultButton testId="studio-cta" />
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
