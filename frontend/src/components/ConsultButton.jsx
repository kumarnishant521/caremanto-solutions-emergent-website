import { useConsultation } from "../lib/useConsultation";

/**
 * Standard site-wide consultation trigger.
 *
 * By studio directive the WhatsApp deep-link no longer appears alongside
 * every CTA — that channel now lives only inside the ConsultationModal and
 * the footer. This keeps the luxury layout uncluttered from an aggressive
 * chat badge on every page.
 */
export default function ConsultButton({ label = "Begin a Conversation", testId = "consult-btn", className = "" }) {
  const { open } = useConsultation();
  return (
    <button
      type="button"
      onClick={open}
      data-testid={testId}
      className={`btn-gold ${className}`}
    >
      {label}
    </button>
  );
}
