import { Link, useParams } from "react-router-dom";
import Head from "../components/Head";
import { useConsultation } from "../lib/useConsultation";

/**
 * EditorialPage — a reusable, minimal editorial layout used by the Footer's
 * expanded IA (Insights, FAQ, About Us sub-pages). Every page shares the
 * same visual language so the site's editorial rhythm remains cohesive
 * while individual content is authored later.
 *
 * The Footer routes below all mount this page with a `preset` prop that
 * carries: eyebrow, title, description, and a compact "In this section"
 * link list (sibling routes for quick lateral navigation).
 */

const PRESETS = {
  /* ---------------- INSIGHTS ---------------- */
  "insights-articles": {
    eyebrow: "Insights · Articles",
    title:   "Articles from the Studio",
    lede:    "Long-form writing on material, proportion, restoration and the discipline of composing enduring interiors.",
    hint:    "A first collection of studio essays is being prepared for release. If you're researching a subject, write to us — we'll point you to the closest reference.",
    canonical: "/insights/articles",
    siblings: "insights",
  },
  "insights-blogs": {
    eyebrow: "Insights · Blog",
    title:   "Field Notes",
    lede:    "Shorter dispatches — sites, samples, site-visits and the everyday craft of a design and restoration practice.",
    hint:    "New notes are added periodically. Follow the studio on Instagram in the meantime for weekly work-in-progress imagery.",
    canonical: "/insights/blogs",
    siblings: "insights",
  },
  "insights-news": {
    eyebrow: "Insights · News",
    title:   "Studio News",
    lede:    "Project launches, commissions, press coverage and studio announcements — issued sparingly, only when there is something worth saying.",
    hint:    "Subscribe by beginning a conversation with the studio to be notified when a new commission is unveiled.",
    canonical: "/insights/news",
    siblings: "insights",
  },
  "insights-guidance": {
    eyebrow: "Insights · Guidance",
    title:   "Client Guidance",
    lede:    "Practical primers for owners embarking on a design, renovation or heritage restoration commission — timelines, budgeting philosophy, and how to brief a studio well.",
    hint:    "A structured guidance library is being assembled. For immediate advice on your project, request a complimentary consultation.",
    canonical: "/insights/guidance",
    siblings: "insights",
  },

  /* ---------------- FAQ -------------------- */
  "faq": {
    eyebrow: "Studio · FAQ",
    title:   "Frequently Asked",
    lede:    "Working with the studio — engagement, scope, timelines, and the questions we most often receive.",
    hint:    "The full FAQ is being expanded. For anything specific, please begin a conversation with the studio directly.",
    canonical: "/faq",
    siblings: null,
  },

  /* ---------------- ABOUT US --------------- */
  "about-team": {
    eyebrow: "About · Team",
    title:   "The Studio Team",
    lede:    "A small, senior team of interior architects, restoration specialists and delivery partners composing every commission end-to-end.",
    hint:    "Detailed biographies are being prepared. In the meantime, please write to arrange an introduction.",
    canonical: "/about/team",
    siblings: "about",
  },
  "about-accreditation": {
    eyebrow: "About · Accreditation",
    title:   "Accreditations",
    lede:    "Professional memberships, empanelments and technical accreditations that back the studio's design and restoration practice.",
    hint:    "The published accreditation register is under review by our compliance team and will appear here shortly.",
    canonical: "/about/accreditation",
    siblings: "about",
  },
  "about-recognitions": {
    eyebrow: "About · Recognitions",
    title:   "Recognitions",
    lede:    "Peer, industry and heritage-body recognitions received for individual commissions and for the studio's broader body of work.",
    hint:    "A chronological ledger is being formatted for publication.",
    canonical: "/about/recognitions",
    siblings: "about",
  },
  "about-awards": {
    eyebrow: "About · Awards",
    title:   "Awards",
    lede:    "Design and restoration awards received by the studio, listed with the commissions they were awarded to.",
    hint:    "The awards ledger is being curated for publication.",
    canonical: "/about/awards",
    siblings: "about",
  },
  "about-locations": {
    eyebrow: "About · Locations",
    title:   "Studio Locations",
    lede:    "The studio's principal office in Mumbai supports commissions across India and, on invitation, internationally.",
    hint:    "C-213, Eastern Business District, Mumbai — 400 078.  Additional site offices open project-by-project.",
    canonical: "/about/locations",
    siblings: "about",
  },
};

const SIBLING_LINKS = {
  insights: [
    { to: "/insights/articles", label: "Articles"  },
    { to: "/insights/blogs",    label: "Blog"      },
    { to: "/insights/news",     label: "News"      },
    { to: "/insights/guidance", label: "Guidance"  },
  ],
  about: [
    { to: "/about/team",           label: "Team"           },
    { to: "/about/accreditation",  label: "Accreditation"  },
    { to: "/about/recognitions",   label: "Recognitions"   },
    { to: "/about/awards",         label: "Awards"         },
    { to: "/about/locations",      label: "Locations"      },
  ],
};

export function EditorialPage({ presetKey }) {
  const p = PRESETS[presetKey] || PRESETS["faq"];
  const { open: openConsult } = useConsultation();
  const siblings = p.siblings ? SIBLING_LINKS[p.siblings] : null;

  return (
    <main data-testid={`editorial-page-${presetKey}`} className="bg-[var(--bg-0)] min-h-screen">
      <Head
        title={`${p.title} · CAREMANTO SOLUTIONS`}
        description={p.lede}
        canonical={`https://caremanto.in${p.canonical}`}
      />

      {/* Hero band — same visual grammar as StudioPage / ApproachPage */}
      <section className="pt-40 md:pt-48 pb-16 md:pb-20 px-6 md:px-14 max-w-[1240px] mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <span className="w-10 h-[1px] bg-[var(--gold)]" />
          <span
            data-testid={`editorial-eyebrow-${presetKey}`}
            className="overline text-[var(--gold)]"
          >
            {p.eyebrow}
          </span>
        </div>
        <h1
          data-testid={`editorial-title-${presetKey}`}
          className="font-serif text-[clamp(2.2rem,4.4vw,3.8rem)] leading-[1.02] tracking-[-0.015em] max-w-[900px] text-[var(--ink)]"
        >
          {p.title}
        </h1>
        <p className="mt-8 max-w-[720px] text-[15px] md:text-[17px] leading-[1.7] text-[var(--ink)]/75 font-light">
          {p.lede}
        </p>
      </section>

      <div className="max-w-[1240px] mx-auto px-6 md:px-14">
        <div className="hairline mb-16" />
      </div>

      {/* Body — placeholder editorial note + CTA + sibling lateral nav. */}
      <section className="pb-32 px-6 md:px-14 max-w-[1240px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-12">
        <div className="md:col-span-7">
          <div className="overline mb-4">Note</div>
          <p className="text-[14px] md:text-[15px] leading-[1.85] text-[var(--ink)]/70 max-w-prose">
            {p.hint}
          </p>

          <div className="mt-10 inline-flex items-center gap-3">
            <button
              type="button"
              onClick={openConsult}
              data-testid={`editorial-consult-${presetKey}`}
              className="btn-gold"
            >
              Begin a Conversation
            </button>
            <Link
              to="/works"
              className="overline text-[11px] text-[var(--gold)] hover:text-[var(--gold-hi)] transition-colors"
            >
              Or explore the portfolio →
            </Link>
          </div>
        </div>

        {siblings && (
          <aside className="md:col-span-5">
            <div className="overline mb-4">In this section</div>
            <ul className="space-y-3">
              {siblings.map((s) => (
                <li key={s.to}>
                  <Link
                    to={s.to}
                    data-testid={`editorial-sibling-${s.to.replace(/\W+/g, "-")}`}
                    className={`group flex items-center justify-between gap-6 py-3 border-b border-[var(--line)] hover:border-[var(--gold)]/60 transition-colors ${
                      s.to === p.canonical ? "text-[var(--gold)]" : "text-[var(--ink)]/85"
                    }`}
                  >
                    <span className="font-serif text-[19px]">{s.label}</span>
                    <span className="overline text-[10px] opacity-40 group-hover:opacity-100 group-hover:text-[var(--gold)] transition-all">
                      {s.to === p.canonical ? "Current" : "Open ↗"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </section>
    </main>
  );
}

/* Route wrappers — one per URL. Kept trivially small so the router file
   can register them without inline arrow-function ceremony. */
export function InsightsArticlesPage()   { return <EditorialPage presetKey="insights-articles" />; }
export function InsightsBlogsPage()      { return <EditorialPage presetKey="insights-blogs"    />; }
export function InsightsNewsPage()       { return <EditorialPage presetKey="insights-news"     />; }
export function InsightsGuidancePage()   { return <EditorialPage presetKey="insights-guidance" />; }

export function FAQPage()                { return <EditorialPage presetKey="faq" />; }

export function AboutTeamPage()          { return <EditorialPage presetKey="about-team"           />; }
export function AboutAccreditationPage() { return <EditorialPage presetKey="about-accreditation"  />; }
export function AboutRecognitionsPage()  { return <EditorialPage presetKey="about-recognitions"   />; }
export function AboutAwardsPage()        { return <EditorialPage presetKey="about-awards"         />; }
export function AboutLocationsPage()     { return <EditorialPage presetKey="about-locations"      />; }

/* Fallback if someone hits /insights or /about with no sub-slug — router
   uses `useParams()` to detect and defers to a sensible default. */
export function InsightsIndexRedirect() {
  const { section } = useParams();
  const key = `insights-${section}`;
  return PRESETS[key]
    ? <EditorialPage presetKey={key} />
    : <EditorialPage presetKey="insights-articles" />;
}
export function AboutIndexRedirect() {
  const { section } = useParams();
  const key = `about-${section}`;
  return PRESETS[key]
    ? <EditorialPage presetKey={key} />
    : <EditorialPage presetKey="about-team" />;
}
