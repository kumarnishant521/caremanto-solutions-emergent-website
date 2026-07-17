import { Link } from "react-router-dom";
import { Instagram, Linkedin, Twitter, Youtube } from "lucide-react";
import { useConsultation } from "../lib/useConsultation";
import { STUDIO } from "../lib/studio";
import { WhatsAppIcon } from "./ConsultationModal";

// Placeholder handles — routes forward to the studio's future social presence.
// Update the base URLs here once the handles are live.
const SOCIALS = [
  { key: "instagram", label: "Instagram", href: "https://www.instagram.com/caremanto/", Icon: Instagram },
  { key: "linkedin",  label: "LinkedIn",  href: "https://www.linkedin.com/company/caremanto/", Icon: Linkedin  },
  { key: "twitter",   label: "Twitter",   href: "https://twitter.com/caremanto",         Icon: Twitter   },
  { key: "youtube",   label: "YouTube",   href: "https://www.youtube.com/@caremanto",    Icon: Youtube   },
];

export default function Footer() {
  const { open: openConsult } = useConsultation();
  return (
    <footer
      data-testid="site-footer"
      className="relative bg-[var(--bg-0)] border-t border-[var(--line)] pt-20 pb-10 mt-0"
    >
      <div className="max-w-[1440px] mx-auto px-6 md:px-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-6">
          <div className="md:col-span-5">
            <div className="font-serif text-[clamp(2.5rem,5vw,4.5rem)] tracking-[-0.02em] leading-[0.95]">
              Let's compose <br />
              <span className="italic text-[var(--gold)]">something enduring.</span>
            </div>
            <div className="mt-8 inline-flex items-center gap-2">
              <button
                type="button"
                onClick={openConsult}
                data-testid="footer-cta"
                className="btn-gold"
              >
                Request Consultation
              </button>
              <a
                href={STUDIO.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Chat on WhatsApp"
                title="Chat on WhatsApp"
                data-testid="footer-whatsapp"
                className="inline-flex items-center justify-center w-11 h-11 bg-[#25D366] text-white hover:opacity-90 transition-opacity"
              >
                <WhatsAppIcon size={18} />
              </a>
            </div>
          </div>

          <div className="md:col-span-3">
            <div className="overline mb-4">Studio</div>
            <ul className="space-y-2 text-[14px]">
              <li><Link to="/studio"   className="hover:text-[var(--gold)] transition-colors">About Us</Link></li>
              <li><Link to="/approach" className="hover:text-[var(--gold)] transition-colors">Approach</Link></li>
              <li><Link to="/works"    className="hover:text-[var(--gold)] transition-colors">Our Works</Link></li>
              <li><Link to="/gallery"  className="hover:text-[var(--gold)] transition-colors">Gallery</Link></li>
              <li><Link to="/films"    className="hover:text-[var(--gold)] transition-colors">Films</Link></li>
              <li><Link to="/contact"  className="hover:text-[var(--gold)] transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <div className="overline mb-4">Practices</div>
            <ul className="space-y-2 text-[14px]">
              <li><Link to="/works?category=interiors"   className="hover:text-[var(--gold)] transition-colors">Interiors</Link></li>
              <li><Link to="/works?category=restoration" className="hover:text-[var(--gold)] transition-colors">Restoration</Link></li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <div className="overline mb-4">Contact</div>
            <ul className="space-y-2 text-[13px] text-[var(--ink)]/80">
              <li>
                <a
                  href="mailto:care@caremanto.in"
                  data-testid="footer-email"
                  className="hover:text-[var(--gold)] transition-colors"
                >
                  care@caremanto.in
                </a>
              </li>
              <li>
                <a
                  href="tel:+919595944417"
                  data-testid="footer-phone"
                  className="hover:text-[var(--gold)] transition-colors uppercase tracking-[0.14em] text-[12px]"
                >
                  +91 95959 44417
                </a>
              </li>
              <li
                data-testid="footer-address"
                className="text-[11px] uppercase tracking-[0.18em] leading-relaxed text-[var(--ink)]/70 pt-2"
              >
                C-213, Eastern Business District,<br />
                Mumbai — 400 078
              </li>
            </ul>

            <div className="overline mt-6 mb-3">Follow</div>
            <ul
              data-testid="footer-social"
              className="flex items-center gap-3"
              aria-label="Social media"
            >
              {SOCIALS.map(({ key, label, href, Icon }) => (
                <li key={key}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    title={label}
                    data-testid={`social-${key}`}
                    className="inline-flex items-center justify-center w-9 h-9 border border-[var(--line-strong)] text-[var(--ink)]/80 hover:text-[var(--gold)] hover:border-[var(--gold)] transition-colors"
                  >
                    <Icon size={16} strokeWidth={1.6} />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="hairline mt-16 mb-6" />
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-[12px] text-[var(--muted)]">
          <div>© {new Date().getFullYear()} Caremanto Solutions · All rights reserved.</div>
          <div className="flex items-center gap-6">
            <span className="font-mono-alt text-[10px]">CS · SINCE 2018</span>
            <Link to="/admin/login" data-testid="footer-admin-link" className="hover:text-[var(--gold)] transition-colors">Admin</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
