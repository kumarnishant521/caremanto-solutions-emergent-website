import { createContext, useContext, useState, useCallback } from "react";
import ConsultationModal from "../components/ConsultationModal";

/**
 * Global consultation-form provider. Any component can call
 * `useConsultation().open()` to launch the modal — used by every
 * "Request Consultation" / "Begin a Conversation" button across the site.
 */
const ConsultationCtx = createContext({ open: () => {} });

export const ConsultationProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  return (
    <ConsultationCtx.Provider value={{ open }}>
      {children}
      <ConsultationModal isOpen={isOpen} onClose={close} />
    </ConsultationCtx.Provider>
  );
};

export const useConsultation = () => useContext(ConsultationCtx);
