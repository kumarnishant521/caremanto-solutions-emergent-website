import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { NAV_CATEGORIES } from "../lib/api";
import CMLogo from "./CMLogo";

/**
 * Header + primary navigation
 * Order per spec:
 *   HOME · PORTFOLIO · INTERIOR PROJECTS ▾ · SERVICES – RESTORATION & RENOVATION ▾ · PROCESS · ABOUT US
 * Consult CTA retained on the right (lead capture).
 */

// Brand mark — if user has dropped /public/caremanto-logo.(svg|png) it'll
// be used; else falls back to CMLogo placeholder.
function BrandMark() {
  const [logo, setLogo] = useState(null); // "svg" | "png" | null
  useEffect(() => {
    let cancelled = false;
    const tryLoad = (ext) =>
      new Promise((res) => {
        const img = new Image();
        img.onload = () => res(ext);
        img.onerror = () => res(null);
        img.src = `/caremanto-logo.${ext}`;
      });
    (async () => {
      const found = (await tryLoad("svg")) || (await tryLoad("png"));
      if (!cancelled) setLogo(found);
    })();
    return () => { cancelled = true; };
  }, []);

  if (logo) {
    return (
      <img
        src={`/caremanto-logo.${logo}`}
        alt="Caremanto"
        className="w-[42px] h-[42px] object-contain"
      />
    );
  }
  return <CMLogo size={42} className="cm-logo-color text-[var(--ink)]" />;
}

const RESTORATION_SHORT = "Services – Restoration & Renovation";

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

  // Only apply the "over dark hero" style when on the home page & near the top.
  const isHome = loc.pathname === "/";
  const overHero = isHome && !scrolled;

  const goWorks = (cat, sub) => {
    const params = new URLSearchParams({ category: cat });
    if (sub) params.set("sub", sub);
    nav(`/works?${params.toString()}`);
    setOpen(null);
    setMobileOpen(false);
  };

  const active = (path) => loc.pathname === path;

  return (
    <header
      data-testid="site-nav"
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-500 ${
        overHero ? "nav-over-hero" : "nav-blur"
      } ${scrolled ? "border-b border-[var(--line)]" : "border-b border-transparent"}`}
    >
      <div className="max-w-[1500px] mx-auto px-6 md:px-10 h-[80px] flex items-center justify-between gap-6">
        {/* Brand — CAREMANTO SOLUTIONS, VIVID / DGI-style stacked wordmark */}
        <Link to="/" data-testid="brand-logo" className="flex items-center gap-4 group shrink-0">
          <BrandMark />
          <div className="flex flex-col leading-none" data-testid="brand-wordmark">
            <span className="font-wordmark text-[17px] md:text-[19px] text-[var(--ink)]">
              CAREMANTO
            </span>
            <span className="font-wordmark-sub text-[9px] md:text-[10px] text-[var(--ink)]/80 mt-[6px]">
              SOLUTIONS
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden xl:flex items-center gap-7 2xl:gap-9">
          <Link to="/" data-testid="nav-home" className={`nav-link nav-label ${active("/") ? "text-[var(--gold)]" : ""}`}>Home</Link>
          <Link to="/works" data-testid="nav-portfolio" className={`nav-link nav-label ${active("/works") ? "text-[var(--gold)]" : ""}`}>Portfolio</Link>

          {/* Interior Projects */}
          <div
            className="relative"
            onMouseEnter={() => setOpen("interiors")}
            onMouseLeave={() => setOpen(null)}
          >
            <button
              data-testid="nav-dropdown-interiors"
              data-open={open === "interiors"}
              onClick={() => goWorks("interiors")}
              className="nav-link nav-label flex items-center gap-2"
            >
              Interior Projects
              <Chevron open={open === "interiors"} />
            </button>
            <DropdownPanel open={open === "interiors"} align="center" testid="dropdown-panel-interiors">
              <PanelHeader label="Interior Projects — Practices" />
              {NAV_CATEGORIES.interiors.items.map((item, i) => (
                <PanelItem
                  key={item}
                  data-testid={`dropdown-item-interiors-${i}`}
                  onClick={() => goWorks("interiors", item)}
                >
                  {item}
                </PanelItem>
              ))}
            </DropdownPanel>
          </div>

          {/* Services · Restoration & Renovation */}
          <div
            className="relative"
            onMouseEnter={() => setOpen("restoration")}
            onMouseLeave={() => setOpen(null)}
          >
            <button
              data-testid="nav-dropdown-restoration"
              data-open={open === "restoration"}
              onClick={() => goWorks("restoration")}
              className="nav-link nav-label flex items-center gap-2 whitespace-nowrap"
            >
              {RESTORATION_SHORT}
              <Chevron open={open === "restoration"} />
            </button>
            <DropdownPanel open={open === "restoration"} align="center" wide testid="dropdown-panel-restoration">
              <PanelHeader label="Services — Restoration & Renovation" />
              {NAV_CATEGORIES.restoration.items.map((item, i) => (
                <PanelItem
                  key={item}
                  data-testid={`dropdown-item-restoration-${i}`}
                  onClick={() => goWorks("restoration", item)}
                >
                  {item}
                </PanelItem>
              ))}
            </DropdownPanel>
          </div>

          <Link to="/approach" data-testid="nav-process" className={`nav-link nav-label ${active("/approach") ? "text-[var(--gold)]" : ""}`}>Process</Link>
          <Link to="/studio" data-testid="nav-about" className={`nav-link nav-label ${active("/studio") ? "text-[var(--gold)]" : ""}`}>About Us</Link>

          <Link
            to="/contact"
            data-testid="nav-cta"
            className="ml-2 btn-pill text-[10px] py-[10px] px-5"
          >
            Consult
          </Link>
        </nav>

        {/* Mobile toggle */}
        <button
          data-testid="mobile-menu-toggle"
          onClick={() => setMobileOpen((v) => !v)}
          className="xl:hidden w-11 h-11 flex flex-col items-center justify-center gap-[5px] border border-[var(--line-strong)] hover:border-[var(--gold)] transition-colors"
          aria-label="Menu"
        >
          <span className={`w-4 h-[1.5px] bg-current transition-transform ${mobileOpen ? "translate-y-[3px] rotate-45" : ""}`}/>
          <span className={`w-4 h-[1.5px] bg-current transition-transform ${mobileOpen ? "-translate-y-[3px] -rotate-45" : ""}`}/>
        </button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.2, 0.7, 0.15, 1] }}
            className="xl:hidden overflow-hidden border-t border-[var(--line)] bg-[var(--bg-0)]/97 backdrop-blur-xl"
          >
            <div className="px-6 py-8 space-y-6">
              <Link to="/" data-testid="mobile-home" className="nav-label block text-[13px]">Home</Link>
              <Link to="/works" data-testid="mobile-portfolio" className="nav-label block text-[13px]">Portfolio</Link>

              <div>
                <button
                  onClick={() => goWorks("interiors")}
                  data-testid="mobile-cat-interiors"
                  className="nav-label text-[var(--gold)] text-[11px] mb-3 block"
                >
                  Interior Projects →
                </button>
                <div className="grid grid-cols-1 gap-1 pl-1">
                  {NAV_CATEGORIES.interiors.items.map((it, i) => (
                    <button
                      key={it}
                      data-testid={`mobile-item-interiors-${i}`}
                      onClick={() => goWorks("interiors", it)}
                      className="text-left font-serif text-[22px] text-[var(--ink)]/90 hover:text-[var(--gold)] transition py-1"
                    >
                      {it}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <button
                  onClick={() => goWorks("restoration")}
                  data-testid="mobile-cat-restoration"
                  className="nav-label text-[var(--gold)] text-[11px] mb-3 block"
                >
                  Services · Restoration & Renovation →
                </button>
                <div className="grid grid-cols-1 gap-1 pl-1">
                  {NAV_CATEGORIES.restoration.items.map((it, i) => (
                    <button
                      key={it}
                      data-testid={`mobile-item-restoration-${i}`}
                      onClick={() => goWorks("restoration", it)}
                      className="text-left font-serif text-[22px] text-[var(--ink)]/90 hover:text-[var(--gold)] transition py-1"
                    >
                      {it}
                    </button>
                  ))}
                </div>
              </div>

              <div className="hairline" />
              <Link to="/approach" data-testid="mobile-process" className="nav-label block text-[13px]">Process</Link>
              <Link to="/studio" data-testid="mobile-about" className="nav-label block text-[13px]">About Us</Link>
              <Link to="/contact" className="btn-gold w-fit mt-2">Request Consultation</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

/* ---------------- Sub-components ---------------- */

function Chevron({ open }) {
  return (
    <svg width="9" height="9" viewBox="0 0 10 10" fill="none" className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`}>
      <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1"/>
    </svg>
  );
}

function DropdownPanel({ open, align = "center", wide = false, testid, children }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.28, ease: [0.2, 0.7, 0.15, 1] }}
          data-testid={testid}
          className={`dropdown-panel absolute top-full mt-4 py-4 ${
            wide ? "min-w-[380px]" : "min-w-[260px]"
          } ${
            align === "left" ? "left-0" :
            align === "right" ? "right-0" :
            "left-1/2 -translate-x-1/2"
          }`}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function PanelHeader({ label }) {
  return (
    <div className="px-5 pb-3 overline text-[10px] text-[var(--muted)]">
      {label}
    </div>
  );
}

function PanelItem({ children, onClick, ...rest }) {
  return (
    <button
      onClick={onClick}
      {...rest}
      className="w-full text-left px-5 py-2.5 font-serif text-[19px] text-[var(--ink)] hover:text-[var(--gold)] transition-colors flex items-center justify-between group"
    >
      <span>{children}</span>
      <span className="text-[var(--gold)] opacity-0 group-hover:opacity-100 transition-opacity">→</span>
    </button>
  );
}
