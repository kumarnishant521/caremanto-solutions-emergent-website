import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { NAV_CATEGORIES, GALLERY_TAXONOMY } from "../lib/api";

const links = [
  { label: "Studio", to: "/studio" },
  { label: "Approach", to: "/approach" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(null); // "interiors" | "restoration" | null
  const [mobileOpen, setMobileOpen] = useState(false);
  const nav = useNavigate();
  const loc = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setOpen(null); setMobileOpen(false); }, [loc.pathname]);

  const goWorks = (cat, sub) => {
    const params = new URLSearchParams({ category: cat });
    if (sub) params.set("sub", sub);
    nav(`/works?${params.toString()}`);
    setOpen(null);
    setMobileOpen(false);
  };

  const goGallery = (axis, value) => {
    const params = new URLSearchParams();
    if (axis && value) params.set(axis, value);
    nav(`/gallery${params.toString() ? `?${params.toString()}` : ""}`);
    setOpen(null);
    setMobileOpen(false);
  };

  return (
    <header
      data-testid="site-nav"
      className={`fixed top-0 left-0 right-0 z-50 nav-blur transition-colors duration-500 ${
        scrolled ? "border-b border-white/10" : "border-b border-transparent"
      }`}
    >
      <div className="max-w-[1440px] mx-auto px-6 md:px-10 h-[72px] flex items-center justify-between">
        <Link to="/" data-testid="brand-logo" className="flex items-center gap-3 group">
          <span className="w-8 h-8 flex items-center justify-center border border-[var(--gold)]/60">
            <span className="font-serif italic text-[var(--gold)] text-lg leading-none">C</span>
          </span>
          <div className="leading-tight">
            <div className="font-serif text-[17px] tracking-wide">Caremanto</div>
            <div className="overline text-[9px] mt-[2px] text-[var(--muted)] tracking-[0.3em]">Solutions</div>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-10">
          {Object.values(NAV_CATEGORIES).map((cat) => (
            <div
              key={cat.slug}
              className="relative"
              onMouseEnter={() => setOpen(cat.slug)}
              onMouseLeave={() => setOpen(null)}
            >
              <button
                data-testid={`nav-dropdown-${cat.slug}`}
                data-open={open === cat.slug}
                onClick={() => goWorks(cat.slug)}
                className="nav-link overline text-[11px] text-[var(--ink)] flex items-center gap-2"
              >
                {cat.label}
                <svg width="9" height="9" viewBox="0 0 10 10" fill="none" className={`transition-transform duration-300 ${open === cat.slug ? "rotate-180" : ""}`}>
                  <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1"/>
                </svg>
              </button>
              <AnimatePresence>
                {open === cat.slug && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.28, ease: [0.2, 0.7, 0.15, 1] }}
                    className="dropdown-panel absolute top-full left-1/2 -translate-x-1/2 mt-4 min-w-[280px] py-4"
                    data-testid={`dropdown-panel-${cat.slug}`}
                  >
                    <div className="px-5 pb-3 overline text-[10px] text-[var(--muted)]">
                      {cat.label} — Practices
                    </div>
                    {cat.items.map((item, i) => (
                      <button
                        key={item}
                        data-testid={`dropdown-item-${cat.slug}-${i}`}
                        onClick={() => goWorks(cat.slug, item)}
                        className="w-full text-left px-5 py-2.5 font-serif text-[19px] text-[var(--ink)] hover:text-[var(--gold)] transition-colors flex items-center justify-between group"
                      >
                        <span>{item}</span>
                        <span className="text-[var(--gold)] opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}

          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              data-testid={`nav-link-${l.label.toLowerCase()}`}
              className="nav-link overline text-[11px]"
            >
              {l.label}
            </Link>
          ))}

          {/* Gallery dropdown — two-column (Spaces | Segments) */}
          <div
            className="relative"
            onMouseEnter={() => setOpen("gallery")}
            onMouseLeave={() => setOpen(null)}
          >
            <button
              data-testid="nav-dropdown-gallery"
              data-open={open === "gallery"}
              onClick={() => goGallery()}
              className="nav-link overline text-[11px] text-[var(--ink)] flex items-center gap-2"
            >
              Gallery
              <svg width="9" height="9" viewBox="0 0 10 10" fill="none" className={`transition-transform duration-300 ${open === "gallery" ? "rotate-180" : ""}`}>
                <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1"/>
              </svg>
            </button>
            <AnimatePresence>
              {open === "gallery" && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.28, ease: [0.2, 0.7, 0.15, 1] }}
                  className="dropdown-panel absolute top-full right-0 mt-4 min-w-[520px] py-5 grid grid-cols-2 gap-2"
                  data-testid="dropdown-panel-gallery"
                >
                  <div className="px-5">
                    <div className="overline text-[10px] text-[var(--muted)] mb-2">By Space</div>
                    {GALLERY_TAXONOMY.spaces.map((s, i) => (
                      <button
                        key={s}
                        data-testid={`dropdown-gallery-space-${i}`}
                        onClick={() => goGallery("space", s)}
                        className="w-full text-left py-1.5 font-serif text-[17px] text-[var(--ink)] hover:text-[var(--gold)] transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  <div className="px-5 border-l border-white/10">
                    <div className="overline text-[10px] text-[var(--muted)] mb-2">By Work</div>
                    {GALLERY_TAXONOMY.segments.map((s, i) => (
                      <button
                        key={s}
                        data-testid={`dropdown-gallery-segment-${i}`}
                        onClick={() => goGallery("segment", s)}
                        className="w-full text-left py-1.5 font-serif text-[17px] text-[var(--ink)] hover:text-[var(--gold)] transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Link to="/works" data-testid="nav-link-works" className="nav-link overline text-[11px]">
            Our Works
          </Link>

          <Link
            to="/contact"
            data-testid="nav-cta"
            className="ml-2 btn-pill text-[11px] py-[10px] px-5"
          >
            Consult
          </Link>
        </nav>

        <button
          data-testid="mobile-menu-toggle"
          onClick={() => setMobileOpen((v) => !v)}
          className="lg:hidden w-10 h-10 flex flex-col items-center justify-center gap-[5px] border border-white/15"
          aria-label="Menu"
        >
          <span className={`w-4 h-[1px] bg-[var(--ink)] transition-transform ${mobileOpen ? "translate-y-[3px] rotate-45" : ""}`}/>
          <span className={`w-4 h-[1px] bg-[var(--ink)] transition-transform ${mobileOpen ? "-translate-y-[3px] -rotate-45" : ""}`}/>
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.2, 0.7, 0.15, 1] }}
            className="lg:hidden overflow-hidden border-t border-white/10 bg-[var(--bg-0)]/95 backdrop-blur-xl"
          >
            <div className="px-6 py-8 space-y-6">
              {Object.values(NAV_CATEGORIES).map((cat) => (
                <div key={cat.slug}>
                  <button
                    onClick={() => goWorks(cat.slug)}
                    data-testid={`mobile-cat-${cat.slug}`}
                    className="overline text-[var(--gold)] text-[10px] mb-3 block"
                  >
                    {cat.label} →
                  </button>
                  <div className="grid grid-cols-1 gap-2 pl-1">
                    {cat.items.map((it, i) => (
                      <button
                        key={it}
                        data-testid={`mobile-item-${cat.slug}-${i}`}
                        onClick={() => goWorks(cat.slug, it)}
                        className="text-left font-serif text-[22px] text-[var(--ink)]/85 hover:text-[var(--gold)] transition"
                      >
                        {it}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <div className="hairline" />
              {links.map((l) => (
                <Link key={l.to} to={l.to} className="font-serif text-[22px] block">{l.label}</Link>
              ))}
              <div className="hairline" />
              <div>
                <button onClick={() => goGallery()} className="overline text-[var(--gold)] text-[10px] mb-3 block">
                  Gallery →
                </button>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 pl-1">
                  <div>
                    <div className="overline text-[9px] text-[var(--muted)] mb-2">By Space</div>
                    {GALLERY_TAXONOMY.spaces.map((s) => (
                      <button key={s} onClick={() => goGallery("space", s)} className="block text-left font-serif text-[17px] py-1">{s}</button>
                    ))}
                  </div>
                  <div>
                    <div className="overline text-[9px] text-[var(--muted)] mb-2">By Work</div>
                    {GALLERY_TAXONOMY.segments.map((s) => (
                      <button key={s} onClick={() => goGallery("segment", s)} className="block text-left font-serif text-[17px] py-1">{s}</button>
                    ))}
                  </div>
                </div>
              </div>
              <Link to="/works" className="font-serif text-[22px] block">Our Works</Link>
              <Link to="/contact" className="btn-gold w-fit">Request Consultation</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
