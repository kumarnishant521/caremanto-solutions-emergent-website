import { Link } from "react-router-dom";
import { Instagram, Linkedin, Twitter, Youtube, Globe } from "lucide-react";
import { useConsultation } from "../lib/useConsultation";
import { STUDIO } from "../lib/studio";
import { useSiteSettings } from "../lib/useSiteSettings";
import { WhatsAppIcon } from "./ConsultationModal";

// Icon map — allows admins to reference an icon by key when editing socials.
const SOCIAL_ICONS = {
  instagram: Instagram,
  linkedin:  Linkedin,
  twitter:   Twitter,
  youtube:   Youtube,
};

// Compiled-in defaults — used as fallback until admin overrides arrive.
const DEFAULT_SOCIALS = [
  { key: "instagram", label: "Instagram", href: "https://www.instagram.com/caremanto/" },
  { key: "linkedin",  label: "LinkedIn",  href: "https://www.linkedin.com/company/caremanto/" },
  { key: "twitter",   label: "Twitter",   href: "https://twitter.com/caremanto"        },
  { key: "youtube",   label: "YouTube",   href: "https://www.youtube.com/@caremanto"   },
];

export default function Footer() {
  const { open: openConsult } = useConsultation();
  const { settings } = useSiteSettings();
  const f = settings.footer || {};
  const tagline1  = f.tagline_1 || "Let's compose";
  const tagline2  = f.tagline_2 || "something enduring.";
  const email     = f.email     || STUDIO.email;
  const phoneStr  = f.phone     || STUDIO.phone;
  const phoneDial = f.phone_dial || STUDIO.phoneDial;
  const address1  = f.address_line1 || "C-213, Eastern Business District,";
  const address2  = f.address_line2 || "Mumbai — 400 078";
  const whatsappHref = (() => {
    const num = f.whatsapp_number;
    if (!num) return STUDIO.whatsapp;
    const msg = encodeURIComponent(f.whatsapp_message || "Hi Caremanto, I'd like to begin a conversation.");
    return `https://wa.me/${num}?text=${msg}`;
  })();
  const socials = (Array.isArray(f.socials) && f.socials.length ? f.socials : DEFAULT_SOCIALS)
    .filter((s) => s && s.href && s.key);

  return (
    <footer
      data-testid="site-footer"
      className="relative bg-[var(--bg-0)] border-t border-[var(--line)] pt-20 pb-10 mt-0"
    >
      <div className="max-w-[1440px] mx-auto px-6 md:px-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-6">
          <div className="md:col-span-4">
            <div className="font-serif text-[clamp(2.5rem,5vw,4.5rem)] tracking-[-0.02em] leading-[0.95]">
              {tagline1} <br />
              <span className="italic text-[var(--gold)]">{tagline2}</span>
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
                href={whatsappHref}
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

          {/* Studio + Practices */}
          <div className="md:col-span-2">
            <div className="overline mb-4">Studio</div>
            <ul className="space-y-2 text-[14px]">
              <li><Link to="/approach" data-testid="footer-approach" className="hover:text-[var(--gold)] transition-colors">Approach</Link></li>
              <li><Link to="/works"    data-testid="footer-works"    className="hover:text-[var(--gold)] transition-colors">Our Works</Link></li>
              <li><Link to="/gallery"  data-testid="footer-gallery"  className="hover:text-[var(--gold)] transition-colors">Gallery</Link></li>
              <li><Link to="/films"    data-testid="footer-films"    className="hover:text-[var(--gold)] transition-colors">Films</Link></li>
              <li><Link to="/contact"  data-testid="footer-contact"  className="hover:text-[var(--gold)] transition-colors">Contact</Link></li>
              <li><Link to="/faq"      data-testid="footer-faq"      className="hover:text-[var(--gold)] transition-colors">FAQ</Link></li>
            </ul>

            <div className="overline mb-4 mt-8">Practices</div>
            <ul className="space-y-2 text-[14px]">
              <li>
                <Link
                  to="/works?cat=RESIDENTIAL"
                  data-testid="footer-interiors"
                  className="hover:text-[var(--gold)] transition-colors"
                >
                  Interiors
                </Link>
              </li>
              <li>
                <Link
                  to={`/works?cat=${encodeURIComponent("RESTORATION & RENOVATIONS")}`}
                  data-testid="footer-restoration"
                  className="hover:text-[var(--gold)] transition-colors"
                >
                  Restoration
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <div className="overline mb-4">About Us</div>
            <ul className="space-y-2 text-[14px]">
              <li><Link to="/studio"                data-testid="footer-about"          className="hover:text-[var(--gold)] transition-colors">Overview</Link></li>
              <li><Link to="/about/team"            data-testid="footer-about-team"     className="hover:text-[var(--gold)] transition-colors">Team</Link></li>
              <li><Link to="/about/accreditation"   data-testid="footer-about-accreditation" className="hover:text-[var(--gold)] transition-colors">Accreditation</Link></li>
              <li><Link to="/about/recognitions"    data-testid="footer-about-recognitions"  className="hover:text-[var(--gold)] transition-colors">Recognitions</Link></li>
              <li><Link to="/about/awards"          data-testid="footer-about-awards"   className="hover:text-[var(--gold)] transition-colors">Awards</Link></li>
              <li><Link to="/about/locations"       data-testid="footer-about-locations" className="hover:text-[var(--gold)] transition-colors">Locations</Link></li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <div className="overline mb-4">Insights</div>
            <ul className="space-y-2 text-[14px]">
              <li><Link to="/insights/articles"  data-testid="footer-insights-articles"  className="hover:text-[var(--gold)] transition-colors">Articles</Link></li>
              <li><Link to="/insights/blogs"     data-testid="footer-insights-blogs"     className="hover:text-[var(--gold)] transition-colors">Blogs</Link></li>
              <li><Link to="/insights/news"      data-testid="footer-insights-news"      className="hover:text-[var(--gold)] transition-colors">News</Link></li>
              <li><Link to="/insights/guidance"  data-testid="footer-insights-guidance"  className="hover:text-[var(--gold)] transition-colors">Guidance</Link></li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <div className="overline mb-4">Contact</div>
            <ul className="space-y-2 text-[13px] text-[var(--ink)]/80">
              <li>
                <a
                  href={`mailto:${email}`}
                  data-testid="footer-email"
                  className="hover:text-[var(--gold)] transition-colors"
                >
                  {email}
                </a>
              </li>
              <li>
                <a
                  href={`tel:${phoneDial}`}
                  data-testid="footer-phone"
                  className="hover:text-[var(--gold)] transition-colors uppercase tracking-[0.14em] text-[12px]"
                >
                  {phoneStr}
                </a>
              </li>
              <li
                data-testid="footer-address"
                className="text-[11px] uppercase tracking-[0.18em] leading-relaxed text-[var(--ink)]/70 pt-2"
              >
                {address1}<br />
                {address2}
              </li>
            </ul>

            <div className="overline mt-6 mb-3">Follow</div>
            <ul
              data-testid="footer-social"
              className="flex items-center gap-3"
              aria-label="Social media"
            >
              {socials.map(({ key, label, href }, idx) => {
                const Icon = SOCIAL_ICONS[key] || Globe;
                return (
                  <li key={`${key}-${idx}`}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label || key}
                      title={label || key}
                      data-testid={`social-${key}`}
                      className="inline-flex items-center justify-center w-9 h-9 border border-[var(--line-strong)] text-[var(--ink)]/80 hover:text-[var(--gold)] hover:border-[var(--gold)] transition-colors"
                    >
                      <Icon size={16} strokeWidth={1.6} />
                    </a>
                  </li>
                );
              })}
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
