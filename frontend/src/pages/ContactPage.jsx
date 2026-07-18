import { useState } from "react";
import { api, formatApiError } from "../lib/api";
import { Rise } from "../components/Rise";
import { toast } from "sonner";
import Head from "../components/Head";

const PROJECT_TYPES = [
  "Residential Interior",
  "Commercial Interior",
  "Hospitality Interior",
  "Retail Design",
  "Bespoke Furniture",
  "Heritage Restoration",
  "Facade Renewal",
  "Structural Renovation",
  "Adaptive Reuse",
  "Modernization",
  "Other",
];

const BUDGETS = ["Under ₹15L", "₹15L — ₹50L", "₹50L — ₹1Cr", "₹1Cr — ₹3Cr", "₹3Cr+"];

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "", email: "", phone: "",
    project_type: PROJECT_TYPES[0], budget: BUDGETS[1], message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const on = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("Please fill in your name, email and a short message.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/leads", form);
      setSubmitted(true);
      toast.success("Thank you — the studio will be in touch.");
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail) || "Could not send. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main data-testid="contact-page" className="pt-32 pb-24 md:pt-40 md:pb-32 bg-[var(--bg-0)]">
      <Head
        title="Contact & Consultation · Caremanto Solutions · Interior Designer Mumbai"
        description="Request a consultation with Caremanto Solutions — Mumbai luxury interior design, renovation and restoration studio. Direct phone, email and WhatsApp."
        canonical="https://caremanto.in/contact"
        keywords="interior design consultation Mumbai, hire interior designer India, renovation quote, restoration inquiry, Caremanto contact"
      />
      <div className="max-w-[1200px] mx-auto px-6 md:px-14">
        <Rise>
          <div className="flex items-center gap-3 mb-6">
            <span className="w-10 h-[1px] bg-[var(--gold)]" />
            <span className="overline">A Note to the Studio</span>
          </div>
        </Rise>
        <Rise delay={80}>
          <h1 className="font-serif text-[clamp(2.8rem,8vw,7rem)] tracking-[-0.02em] leading-[0.9] max-w-4xl">
            Let's begin a <span className="italic text-[var(--gold)]">conversation.</span>
          </h1>
        </Rise>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-12 gap-10">
          <Rise delay={120} className="md:col-span-4">
            <div className="space-y-8 sticky top-32">
              <div>
                <div className="overline mb-3">Studio</div>
                <div className="text-[15px] leading-relaxed text-[var(--ink)]/85">
                  Caremanto Solutions<br />
                  Interior · Restoration<br />
                  India
                </div>
              </div>
              <div>
                <div className="overline mb-3">Email</div>
                <div className="text-[15px]">info@caremanto.solutions</div>
              </div>
              <div>
                <div className="overline mb-3">Response Time</div>
                <div className="text-[15px] text-[var(--ink)]/80">Within 24 hours on working days.</div>
              </div>
            </div>
          </Rise>

          <Rise delay={200} className="md:col-span-8">
            {submitted ? (
              <div data-testid="contact-success" className="border border-[var(--gold)]/40 bg-[var(--bg-1)] p-10 md:p-14">
                <div className="overline text-[var(--gold)] mb-6">Received</div>
                <h2 className="font-serif text-[clamp(2rem,4vw,3rem)] leading-tight mb-4">
                  Thank you, {form.name.split(" ")[0]}.
                </h2>
                <p className="text-[15px] text-[var(--ink)]/85 leading-relaxed max-w-lg">
                  Your note has reached the studio. We'll be in touch shortly to arrange a proper conversation.
                </p>
                <button
                  onClick={() => { setSubmitted(false); setForm({ ...form, name: "", email: "", phone: "", message: "" }); }}
                  className="btn-pill mt-8"
                >
                  Send another note
                </button>
              </div>
            ) : (
              <form onSubmit={submit} data-testid="contact-form" className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                <Field label="Your Name">
                  <input data-testid="contact-name" value={form.name} onChange={on("name")} placeholder="Full name" required />
                </Field>
                <Field label="Email">
                  <input data-testid="contact-email" type="email" value={form.email} onChange={on("email")} placeholder="you@example.com" required />
                </Field>
                <Field label="Phone">
                  <input data-testid="contact-phone" value={form.phone} onChange={on("phone")} placeholder="Optional" />
                </Field>
                <Field label="Project Type">
                  <select data-testid="contact-project-type" value={form.project_type} onChange={on("project_type")}>
                    {PROJECT_TYPES.map((p) => <option key={p} value={p} className="bg-[var(--bg-1)]">{p}</option>)}
                  </select>
                </Field>
                <Field label="Approximate Budget" full>
                  <select data-testid="contact-budget" value={form.budget} onChange={on("budget")}>
                    {BUDGETS.map((b) => <option key={b} value={b} className="bg-[var(--bg-1)]">{b}</option>)}
                  </select>
                </Field>
                <Field label="Tell us about the project" full>
                  <textarea data-testid="contact-message" rows={5} value={form.message} onChange={on("message")} placeholder="Location, scope, timeline, ambitions..." required />
                </Field>
                <div className="col-span-full mt-8">
                  <button
                    type="submit"
                    data-testid="contact-form-submit-button"
                    disabled={submitting}
                    className="btn-gold disabled:opacity-50"
                  >
                    {submitting ? "Sending…" : "Send Note"}
                  </button>
                </div>
              </form>
            )}
          </Rise>
        </div>
      </div>
    </main>
  );
}

function Field({ label, children, full }) {
  return (
    <label className={`block py-4 ${full ? "md:col-span-2" : ""}`}>
      <span className="overline text-[10px] text-[var(--muted)] block mb-1">{label}</span>
      {children}
    </label>
  );
}
