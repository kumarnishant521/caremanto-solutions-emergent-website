import { Link } from "react-router-dom";

export default function Footer() {
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
            <Link to="/contact" data-testid="footer-cta" className="btn-gold mt-8">
              Request Consultation
            </Link>
          </div>

          <div className="md:col-span-3">
            <div className="overline mb-4">Studio</div>
            <ul className="space-y-2 text-[14px]">
              <li><Link to="/studio" className="hover:text-[var(--gold)] transition-colors">About Us</Link></li>
              <li><Link to="/approach" className="hover:text-[var(--gold)] transition-colors">Approach</Link></li>
              <li><Link to="/works" className="hover:text-[var(--gold)] transition-colors">Our Works</Link></li>
              <li><Link to="/gallery" className="hover:text-[var(--gold)] transition-colors">Gallery</Link></li>
              <li><Link to="/contact" className="hover:text-[var(--gold)] transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <div className="overline mb-4">Practices</div>
            <ul className="space-y-2 text-[14px]">
              <li><Link to="/works?category=interiors" className="hover:text-[var(--gold)] transition-colors">Interiors</Link></li>
              <li><Link to="/works?category=restoration" className="hover:text-[var(--gold)] transition-colors">Restoration</Link></li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <div className="overline mb-4">Contact</div>
            <ul className="space-y-2 text-[14px] text-[var(--ink)]/80">
              <li>info@caremanto.solutions</li>
              <li>+91 · Available on request</li>
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
