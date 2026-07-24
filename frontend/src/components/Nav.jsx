import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Home as HomeIcon } from "lucide-react";
import { NAV_CATEGORIES } from "../lib/api";
import { useConsultation } from "../lib/useConsultation";
import { useSiteSettings } from "../lib/useSiteSettings";
import CMLogo from "./CMLogo";

/**
 * Header + primary navigation
 *
 * Order per spec:
 *   HOME · PORTFOLIO · INTERIOR PROJECTS ▾ · SERVICES ▾ · PROCESS · ABOUT US
 * Consult CTA retained on the right (lead capture).
 *
 * ROUTING CONTRACT (iteration 14 — fixes user report):
 *
 * Portfolio nav → `/works` (Residential default) with query string cleared
 *   so the click always shows the full curated portfolio, never a stale
 *   category from a prior visit.
 *
 * Interior Projects dropdown items → each ROUTES to the exact category
 *   the label implies:
 *     Residential  → /works?cat=RESIDENTIAL
 *     Commercial   → /works?cat=COMMERCIAL
 *     Retail Design→ /works?cat=COMMERCIAL&sub=Retail Design
 *     Hospitality  → /works?cat=COMMERCIAL&sub=Hospitality
 *
 * Services dropdown items:
 *   • Any item whose label contains "Restoration" or "Renovation" routes to
 *     /works?cat=RESTORATION%20%26%20RENOVATIONS (the gallery).
 *   • Every other service (Sound Proofing, Water-Proofing, Modernisation,
 *     …) opens the Consultation modal — no separate page, straight to lead
 *     capture.
 */

// Map Interior Projects dropdown labels → the exact ({cat, sub}) tuple the
// /works page filters on. Kept exhaustive so the router never falls back to
// the "unknown category → residential" behaviour that produced the bug.
const INTERIOR_ROUTE = {
  "Residential":   { cat: "RESIDENTIAL",              sub: null },
  "Commercial":    { cat: "COMMERCIAL",               sub: null },
  "Retail Design": { cat: "COMMERCIAL",               sub: "Retail Design" },
  "Hospitality":   { cat: "COMMERCIAL",               sub: "Hospitality" },
};

// Only the EXACT "Restoration & Renovations" service routes to the
// portfolio gallery. Everything else in the Services dropdown — including
// Heritage Restoration, Modernisation, Water-Proofing, Sound Proofing,
// Structural Renovations & Facade Renewal — opens the Consultation modal
// pre-filled with the service label the user clicked. (Iteration 21 —
// aligns with the studio's lead-capture priority.)
const isRestorationPortfolioService = (label) =>
  /^\s*restoration\s*(?:&|and)\s*renovations?\s*$/i.test(label || "");

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
        className="w-[58px] h-[58px] md:w-[62px] md:h-[62px] object-contain"
      />
    );
  }
  return <CMLogo size={44} className="cm-logo-color text-[var(--ink)]" />;
}

const RESTORATION_SHORT = "Services";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(null); // "interiors" | "restoration" | null
  const [mobileOpen, setMobileOpen] = useState(false);
  const nav = useNavigate();
  const loc = useLocation();
  const { open: openConsult } = useConsultation();
  const { settings } = useSiteSettings();

  // Dynamic (admin-editable) nav config with static fallbacks.
  const navLabels     = (settings.nav && settings.nav.labels) || {};
  const interiorItems = (settings.nav && Array.isArray(settings.nav.interior_items) && settings.nav.interior_items.length)
    ? settings.nav.interior_items
    : NAV_CATEGORIES.interiors.items;
  const servicesItems = (settings.nav && Array.isArray(settings.nav.services_items) && settings.nav.services_items.length)
    ? settings.nav.services_items
    : NAV_CATEGORIES.restoration.items;
  const L = {
    home:       navLabels.home       || "Home",
    portfolio:  navLabels.portfolio  || "Portfolio",
    interiors:  navLabels.interior_projects || "Interior Projects",
    services:   navLabels.services   || RESTORATION_SHORT,
    process:    navLabels.process    || "Process",
    about:      navLabels.about_us   || "About Us",
    consult:    navLabels.consult    || "Consult",
  };

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
    // WorksPage reads `?cat=` + `?folder=`. Values MUST match the uppercase
    // constants declared inside WorksPage.jsx.
    const params = new URLSearchParams({ cat });
    if (sub) params.set("folder", sub);
    nav(`/works?${params.toString()}`);
    // Scroll to top so the visitor lands on the fresh page, not wherever
    // they were before.
    window.scrollTo({ top: 0, behavior: "instant" });
    setOpen(null);
    setMobileOpen(false);
  };

  // Portfolio nav — dedicated `/portfolio` page rendering ONLY admin-flagged
  // (`featured_portfolio: true`) photographs. Fresh cache on every entry.
  const goPortfolio = () => {
    nav("/portfolio");
    window.scrollTo({ top: 0, behavior: "instant" });
    setOpen(null);
    setMobileOpen(false);
  };

  // Interior Projects dropdown click — resolves the label to the exact
  // ({cat, sub}) tuple the /works page expects; falls back to residential
  // if the label is unknown (safety net, should never trigger).
  const goInteriorItem = (label) => {
    const route = INTERIOR_ROUTE[label];
    if (route) goWorks(route.cat, route.sub);
    else       goWorks("RESIDENTIAL");
  };

  // Services dropdown click — ONLY "Restoration & Renovations" routes to
  // the portfolio gallery. Every other service label (Heritage Restoration,
  // Modernisation, Water-Proofing, Sound Proofing, Structural Renovations
  // & Facade Renewal, etc.) opens the Consultation modal pre-filled with
  // the exact service clicked.
  const goServiceItem = (label) => {
    if (isRestorationPortfolioService(label)) {
      goWorks("RESTORATION & RENOVATIONS");
    } else {
      setOpen(null);
      setMobileOpen(false);
      openConsult({ service_type: label });
    }
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
          {/* Explicit home-icon button — always visible on the header row so
              the visitor can jump back to `/` from any deep-nested page. */}
          <Link
            to="/"
            data-testid="nav-home-icon"
            aria-label="Home"
            title="Home"
            className={`inline-flex items-center justify-center w-9 h-9 border border-[var(--line-strong)] transition-colors hover:border-[var(--gold)] hover:text-[var(--gold)] ${
              active("/") ? "text-[var(--gold)] border-[var(--gold)]" : "text-[var(--ink)]/85"
            }`}
          >
            <HomeIcon size={15} strokeWidth={1.6} />
          </Link>
          <Link to="/" data-testid="nav-home" className={`nav-link nav-label ${active("/") ? "text-[var(--gold)]" : ""}`}>{L.home}</Link>
          <button
            type="button"
            onClick={goPortfolio}
            data-testid="nav-portfolio"
            className={`nav-link nav-label ${active("/portfolio") ? "text-[var(--gold)]" : ""}`}
          >
            {L.portfolio}
          </button>

          {/* Interior Projects */}
          <div
            className="relative"
            onMouseEnter={() => setOpen("interiors")}
            onMouseLeave={() => setOpen(null)}
          >
            <button
              data-testid="nav-dropdown-interiors"
              data-open={open === "interiors"}
              onClick={() => goWorks("RESIDENTIAL")}
              className="nav-link nav-label flex items-center gap-2"
            >
              Interior Projects
              <Chevron open={open === "interiors"} />
            </button>
            <DropdownPanel open={open === "interiors"} align="center" testid="dropdown-panel-interiors">
              <PanelHeader label={`${L.interiors} — Practices`} />
              {interiorItems.map((item, i) => (
                <PanelItem
                  key={item}
                  data-testid={`dropdown-item-interiors-${i}`}
                  onClick={() => goInteriorItem(item)}
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
              onClick={() => goWorks("RESTORATION & RENOVATIONS")}
              className="nav-link nav-label flex items-center gap-2 whitespace-nowrap"
            >
              {L.services}
              <Chevron open={open === "restoration"} />
            </button>
            <DropdownPanel open={open === "restoration"} align="center" wide testid="dropdown-panel-restoration">
              <PanelHeader label={`${L.services} — Restoration & Renovation`} />
              {servicesItems.map((item, i) => (
                <PanelItem
                  key={item}
                  data-testid={`dropdown-item-restoration-${i}`}
                  onClick={() => goServiceItem(item)}
                >
                  {item}
                </PanelItem>
              ))}
            </DropdownPanel>
          </div>

          <Link to="/approach" data-testid="nav-process" className={`nav-link nav-label ${active("/approach") ? "text-[var(--gold)]" : ""}`}>{L.process}</Link>
          <Link to="/studio" data-testid="nav-about" className={`nav-link nav-label ${active("/studio") ? "text-[var(--gold)]" : ""}`}>{L.about}</Link>

          <button
            type="button"
            onClick={openConsult}
            data-testid="nav-cta"
            className="ml-2 btn-pill text-[10px] py-[10px] px-5"
          >
            {L.consult}
          </button>
        </nav>

        {/* Mobile controls: home shortcut + drawer toggle, grouped so they
            share the right edge instead of being distributed by flex. */}
        <div className="xl:hidden flex items-center gap-2">
          <Link
            to="/"
            data-testid="mobile-nav-home-icon"
            aria-label="Home"
            className="inline-flex items-center justify-center w-11 h-11 border border-[var(--line-strong)] hover:border-[var(--gold)] hover:text-[var(--gold)] text-[var(--ink)]/85 transition-colors"
          >
            <HomeIcon size={16} strokeWidth={1.6} />
          </Link>
          <button
            data-testid="mobile-menu-toggle"
            onClick={() => setMobileOpen((v) => !v)}
            className="w-11 h-11 flex flex-col items-center justify-center gap-[5px] border border-[var(--line-strong)] hover:border-[var(--gold)] transition-colors"
            aria-label="Menu"
          >
          <span className={`w-4 h-[1.5px] bg-current transition-transform ${mobileOpen ? "translate-y-[3px] rotate-45" : ""}`}/>
          <span className={`w-4 h-[1.5px] bg-current transition-transform ${mobileOpen ? "-translate-y-[3px] -rotate-45" : ""}`}/>
        </button>
        </div>
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
              <Link to="/" data-testid="mobile-home" className="nav-label block text-[13px]">HOME</Link>
              <button
                type="button"
                onClick={goPortfolio}
                data-testid="mobile-portfolio"
                className="nav-label block text-[13px] text-left"
              >
                PORTFOLIO
              </button>

              <div>
                <button
                  onClick={() => goWorks("RESIDENTIAL")}
                  data-testid="mobile-cat-interiors"
                  className="nav-label text-[var(--gold)] text-[11px] mb-3 block"
                >
                  INTERIOR PROJECTS →
                </button>
                <div className="grid grid-cols-1 gap-1 pl-1">
                  {interiorItems.map((it, i) => (
                    <button
                      key={it}
                      data-testid={`mobile-item-interiors-${i}`}
                      onClick={() => goInteriorItem(it)}
                      className="text-left uppercase text-[var(--ink)]/85 hover:text-[var(--gold)] transition py-1
                                 text-[12px] tracking-[0.18em]"
                      style={{ fontFamily: "'Manrope', 'Outfit', sans-serif", fontWeight: 400 }}
                    >
                      {it.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <button
                  onClick={() => goWorks("RESTORATION & RENOVATIONS")}
                  data-testid="mobile-cat-restoration"
                  className="nav-label text-[var(--gold)] text-[11px] mb-3 block"
                >
                  SERVICES →
                </button>
                <div className="grid grid-cols-1 gap-1 pl-1">
                  {servicesItems.map((it, i) => (
                    <button
                      key={it}
                      data-testid={`mobile-item-restoration-${i}`}
                      onClick={() => goServiceItem(it)}
                      className="text-left uppercase text-[var(--ink)]/85 hover:text-[var(--gold)] transition py-1
                                 text-[12px] tracking-[0.18em]"
                      style={{ fontFamily: "'Manrope', 'Outfit', sans-serif", fontWeight: 400 }}
                    >
                      {it.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="hairline" />
              <Link to="/approach" data-testid="mobile-process" className="nav-label block text-[13px]">PROCESS</Link>
              <Link to="/studio" data-testid="mobile-about" className="nav-label block text-[13px]">ABOUT US</Link>
              <button
                type="button"
                onClick={() => { setMobileOpen(false); openConsult(); }}
                className="btn-gold w-fit mt-2"
                data-testid="mobile-consult"
              >
                REQUEST CONSULTATION
              </button>
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
    <div className="px-5 pb-3 overline text-[10px] text-[var(--muted)] uppercase">
      {label}
    </div>
  );
}

function PanelItem({ children, onClick, ...rest }) {
  return (
    <button
      onClick={onClick}
      {...rest}
      className="w-full text-left px-5 py-2 uppercase text-[12px] tracking-[0.18em] text-[var(--ink)]/85 hover:text-[var(--gold)] transition-colors flex items-center justify-between group"
      style={{ fontFamily: "'Manrope', 'Outfit', sans-serif", fontWeight: 400 }}
    >
      <span>{typeof children === "string" ? children.toUpperCase() : children}</span>
      <span className="text-[var(--gold)] opacity-0 group-hover:opacity-100 transition-opacity">→</span>
    </button>
  );
}
