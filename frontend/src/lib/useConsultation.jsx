import { createContext, useContext, useState, useCallback } from "react";
import ConsultationModal from "../components/ConsultationModal";

/**
 * Global consultation-form provider. Any component can call
 * `useConsultation().open()` to launch the modal.
 *
 * Since iteration 15 `open()` accepts an optional prefill:
 *   useConsultation().open({ service_type: "Water-Proofing" });
 *
 * The Services dropdown uses this to pre-select the specific service the
 * visitor clicked, so the lead lands in the database qualified.
 */
const ConsultationCtx = createContext({ open: () => {} });

export const ConsultationProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [prefill, setPrefill] = useState(null);

  const open = useCallback((values) => {
    // `values` is either undefined (default) or { service_type, name, ... }.
    setPrefill(values && typeof values === "object" ? values : null);
    setIsOpen(true);
  }, []);
  const close = useCallback(() => {
    setIsOpen(false);
    // Clear the prefill *after* the exit transition so we don't flash
    // a reset form during the fade-out.
    setTimeout(() => setPrefill(null), 400);
  }, []);

  return (
    <ConsultationCtx.Provider value={{ open }}>
      {children}
      <ConsultationModal isOpen={isOpen} onClose={close} prefill={prefill} />
    </ConsultationCtx.Provider>
  );
};

export const useConsultation = () => useContext(ConsultationCtx);
