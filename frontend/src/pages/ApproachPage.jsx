import { Rise } from "../components/Rise";
import ConsultButton from "../components/ConsultButton";

const STEPS = [
  { n: "I", title: "Listen", body: "Every commission begins with a slow, unhurried conversation. We learn how a client lives — not just what they want." },
  { n: "II", title: "Study", body: "For restoration briefs, we document. We measure, photograph, and read the building's language before proposing a single move." },
  { n: "III", title: "Compose", body: "We compose in proportion first, material second. A room is a musical structure of light, ratio, and restraint." },
  { n: "IV", title: "Craft", body: "We select and supervise every craftsperson. Cabinetry, stonework, joinery, restoration — nothing is left to chance." },
  { n: "V", title: "Deliver", body: "We hand over quietly, with a full archive of materials, drawings, and provenance — so the work continues to be honoured." },
];

export default function ApproachPage() {
  return (
    <main data-testid="approach-page" className="pt-32 pb-24 md:pt-40 md:pb-32 bg-[var(--bg-0)]">
      <div className="max-w-[1440px] mx-auto px-6 md:px-14">
        <Rise>
          <div className="flex items-center gap-3 mb-6">
            <span className="w-10 h-[1px] bg-[var(--gold)]" />
            <span className="overline">The Approach</span>
          </div>
        </Rise>
        <Rise delay={80}>
          <h1 className="font-serif text-[clamp(2.8rem,8vw,7rem)] tracking-[-0.02em] leading-[0.9] max-w-5xl">
            Five movements of a <span className="italic text-[var(--gold)]">single practice.</span>
          </h1>
        </Rise>

        <div className="mt-20 md:mt-28 space-y-24 md:space-y-32">
          {STEPS.map((s, i) => (
            <Rise key={s.n} delay={i * 60}>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-10 items-start">
                <div className="md:col-span-2">
                  <div className="font-serif text-[clamp(3rem,6vw,5rem)] text-[var(--gold)] leading-none">
                    {s.n}
                  </div>
                </div>
                <div className="md:col-span-4">
                  <h3 className="font-serif text-[clamp(1.8rem,3vw,2.6rem)] leading-tight tracking-tight">
                    {s.title}
                  </h3>
                </div>
                <div className="md:col-span-6 md:pt-3">
                  <p className="text-[15px] md:text-[17px] leading-relaxed text-[var(--ink)]/85">
                    {s.body}
                  </p>
                </div>
              </div>
              {i < STEPS.length - 1 && <div className="hairline mt-16" />}
            </Rise>
          ))}
        </div>

        <div className="mt-24 flex justify-center">
          <ConsultButton label="Request Consultation" testId="approach-cta" />
        </div>
      </div>
    </main>
  );
}
