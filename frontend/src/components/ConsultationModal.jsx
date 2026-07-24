import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { api, formatApiError } from "../lib/api";
import { STUDIO } from "../lib/studio";

/**
 * Consultation lead-capture modal.
 * Five inputs: Name / Phone / Email / Service Type / Pincode.
 * WhatsApp direct-chat button lives inside the modal as an alternative route.
 */
const initialForm = { name: "", phone: "", email: "", service_type: "interiors", pincode: "" };

export default function ConsultationModal({ isOpen, onClose, prefill }) {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState(null); // { customer_uid }

  // When the modal opens with a `prefill` (e.g. from the Services dropdown
  // clicking "Water-Proofing"), pre-select the matching Service Type so the
  // lead is already qualified before the visitor types a single character.
  useEffect(() => {
    if (isOpen && prefill && typeof prefill === "object") {
      setForm((f) => ({ ...f, ...prefill }));
    }
  }, [isOpen, prefill]);

  useEffect(() => {
    if (!isOpen) {
      // Reset when closed after a short delay so the transition can play out.
      const t = setTimeout(() => { setForm(initialForm); setConfirmation(null); }, 350);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const submit = async (e) => {
    e.preventDefault();
    const name = form.name.trim();
    const email = form.email.trim();
    const phone = form.phone.trim();
    const pincode = form.pincode.trim();

    // Mandatory fields — Name / Phone / Email / Pincode.
    if (!name)    { toast.error("Please enter your name.");    return; }
    if (!phone)   { toast.error("Please enter your phone number."); return; }
    if (!email)   { toast.error("Please enter your email.");   return; }
    if (!pincode) { toast.error("Please enter the project pincode."); return; }

    // Shape validation — surface clear feedback before the API call.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("That email doesn't look right. Please check it.");
      return;
    }
    const phoneDigits = phone.replace(/\D/g, "");
    if (phoneDigits.length < 7 || phoneDigits.length > 15) {
      toast.error("Please enter a valid phone number (7–15 digits).");
      return;
    }
    if (!/^\d{6}$/.test(pincode)) {
      toast.error("Pincode must be exactly 6 digits.");
      return;
    }

    setSubmitting(true);
    try {
      const r = await api.post("/leads", {
        name,
        email,
        phone,
        service_type: form.service_type,
        pincode,
      });
      setConfirmation({ customer_uid: r.data.customer_uid });
      toast.success("Request received.");
    } catch (err) {
      toast.error(formatApiError(err?.response?.data?.detail) || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="consult-modal"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          data-testid="consultation-modal"
          className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-xl flex items-center justify-center p-4 md:p-8 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]"
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-[var(--bg-0)] border border-[var(--line-strong)] p-8 md:p-10 relative"
          >
            <button
              onClick={onClose}
              data-testid="consultation-modal-close"
              className="absolute top-4 right-4 w-10 h-10 border border-[var(--line-strong)] text-[var(--ink)] hover:border-[var(--gold)] hover:text-[var(--gold)] transition-colors"
              aria-label="Close"
            >×</button>

            {confirmation ? (
              <div data-testid="consultation-confirmation" className="text-center py-6">
                <div className="overline text-[var(--gold-hi)] mb-3">Request Received</div>
                <h2 className="font-serif text-[32px] md:text-[40px] leading-tight tracking-[-0.01em] mb-4">
                  Thank you.
                </h2>
                <p className="text-[14px] text-[var(--ink)]/80 mb-6 leading-relaxed">
                  Our studio will be in touch shortly.<br />
                  Your reference:{" "}
                  <span className="font-mono-alt text-[var(--gold)] font-medium tracking-wider">
                    {confirmation.customer_uid}
                  </span>
                </p>
                <div className="flex justify-center gap-3">
                  <button onClick={onClose} className="btn-pill">Close</button>
                  <a href={STUDIO.whatsapp} target="_blank" rel="noopener noreferrer" className="btn-gold inline-flex items-center gap-2">
                    <WhatsAppIcon size={14} /> Chat on WhatsApp
                  </a>
                </div>
              </div>
            ) : (
              <>
                <div className="overline text-[var(--gold-hi)] mb-2">Consultation Request</div>
                <h2 className="font-serif text-[30px] md:text-[36px] leading-[1.05] tracking-[-0.01em] mb-2">
                  Begin a <span className="italic text-[var(--gold)]">conversation.</span>
                </h2>
                <p className="text-[12px] tracking-wide text-[var(--muted)] mb-6">
                  Share a few details — our studio will respond within one business day.
                </p>

                <form onSubmit={submit} data-testid="consultation-form" noValidate className="space-y-4">
                  <Field label="Name" testid="consultation-name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required autoComplete="name" minLength={2} />
                  <Field label="Phone" testid="consultation-phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} required type="tel" autoComplete="tel" inputMode="tel" pattern="[0-9+\-\s]{7,15}" />
                  <Field label="Email" testid="consultation-email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required type="email" autoComplete="email" />
                  <label className="block">
                    <span className="text-[10px] tracking-[0.28em] uppercase text-[var(--muted)] block mb-1.5">Service Type</span>
                    <select
                      className="w-full bg-transparent border-b border-[var(--line-strong)] py-2 text-[15px] text-[var(--ink)] focus:outline-none focus:border-[var(--gold)] transition-colors"
                      value={form.service_type}
                      data-testid="consultation-service"
                      onChange={(e) => setForm({ ...form, service_type: e.target.value })}
                    >
                      {/* If a Services-dropdown item pre-filled a specific
                          service (e.g. "Water-Proofing"), surface it at the
                          top of the list so the visitor sees the exact
                          service they clicked already selected. */}
                      {form.service_type &&
                        !["interiors", "restoration", "other"].includes(form.service_type) && (
                          <option value={form.service_type}>{form.service_type}</option>
                        )}
                      <option value="interiors">Interiors</option>
                      <option value="restoration">Restoration &amp; Renovation</option>
                      <option value="other">Other Services</option>
                    </select>
                  </label>
                  <Field label="Project Pincode" testid="consultation-pincode" value={form.pincode} onChange={(v) => setForm({ ...form, pincode: v.replace(/\D/g, "").slice(0, 6) })} required inputMode="numeric" maxLength={6} pattern="\d{6}" autoComplete="postal-code" />

                  <div className="flex flex-col sm:flex-row items-stretch gap-3 pt-4">
                    <button type="submit" disabled={submitting} className="btn-gold flex-1 disabled:opacity-60" data-testid="consultation-submit">
                      {submitting ? "Sending…" : "Send Request"}
                    </button>
                    <a
                      href={STUDIO.whatsapp}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid="consultation-whatsapp"
                      aria-label="Chat on WhatsApp"
                      className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#25D366] text-white text-[12px] tracking-[0.14em] uppercase font-medium hover:opacity-90 transition-opacity"
                    >
                      <WhatsAppIcon /> WhatsApp
                    </a>
                  </div>
                </form>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Field({ label, value, onChange, required, type = "text", testid, ...rest }) {
  return (
    <label className="block">
      <span className="text-[10px] tracking-[0.28em] uppercase text-[var(--muted)] block mb-1.5">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        data-testid={testid}
        className="w-full bg-transparent border-b border-[var(--line-strong)] py-2 text-[15px] text-[var(--ink)] focus:outline-none focus:border-[var(--gold)] transition-colors"
        {...rest}
      />
    </label>
  );
}

/** Inline WhatsApp glyph — no external icon library required. */
export function WhatsAppIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.966-.273-.099-.471-.148-.67.15-.198.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.521-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.064 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.695.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.42 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.412-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
