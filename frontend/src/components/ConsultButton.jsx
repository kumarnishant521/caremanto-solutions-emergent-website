import { useConsultation } from "../lib/useConsultation";
import { STUDIO } from "../lib/studio";
import { WhatsAppIcon } from "./ConsultationModal";

/**
 * Standard site-wide consultation trigger.
 * Renders the primary CTA + a small inline WhatsApp icon next to it.
 * The gold button opens the ConsultationModal; the icon deep-links to WhatsApp.
 */
export default function ConsultButton({ label = "Begin a Conversation", testId = "consult-btn", className = "" }) {
  const { open } = useConsultation();
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={open}
        data-testid={testId}
        className="btn-gold"
      >
        {label}
      </button>
      <a
        href={STUDIO.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        title="Chat on WhatsApp"
        data-testid={`${testId}-whatsapp`}
        className="inline-flex items-center justify-center w-11 h-11 bg-[#25D366] text-white hover:opacity-90 transition-opacity"
      >
        <WhatsAppIcon size={18} />
      </a>
    </span>
  );
}
