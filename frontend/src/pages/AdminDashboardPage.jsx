import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { Toaster } from "sonner";
import AdminProjects from "../components/admin/AdminProjects";
import AdminGallery from "../components/admin/AdminGallery";
import AdminLeads from "../components/admin/AdminLeads";
import AdminCovers from "../components/admin/AdminCovers";
import AdminVideos from "../components/admin/AdminVideos";
import AdminPortfolio from "../components/admin/AdminPortfolio";
import AdminHomeSequence from "../components/admin/AdminHomeSequence";
import AdminSEOManager from "../components/admin/AdminSEOManager";

/**
 * Streamlined 4-tab admin navigation (iteration 24).
 *   1. GALLERY            — Photos · Videos
 *   2. HERO & COVERS      — Home Sequence · Portfolio Features · Hero Covers
 *   3. GRID LAYOUTS       — Projects
 *   4. TEXT CUSTOMIZATION — SEO · Footer · Nav · Home Copy   (see AdminSEOManager)
 * Leads is available via a header pill (not counted as a primary tab).
 *
 * Each primary tab that owns multiple legacy sections renders a
 * secondary "sub-toggle" row so we don't lose functionality — the
 * database associations, permissions and API endpoints are unchanged.
 */
const PRIMARY_TABS = [
  {
    key:   "gallery",
    label: "Gallery",
    subs:  [
      { key: "photos", label: "Photos", render: () => <AdminGallery /> },
      { key: "videos", label: "Videos", render: () => <AdminVideos  /> },
    ],
  },
  {
    key:   "hero-covers",
    label: "Hero & Covers",
    subs:  [
      { key: "home-seq",  label: "Home Sequence",      render: () => <AdminHomeSequence /> },
      { key: "portfolio", label: "Portfolio Features", render: () => <AdminPortfolio    /> },
      { key: "covers",    label: "Hero Covers",        render: () => <AdminCovers       /> },
    ],
  },
  {
    key:   "grid-layouts",
    label: "Grid Layouts",
    subs:  [
      { key: "projects", label: "Projects", render: () => <AdminProjects /> },
    ],
  },
  {
    key:   "text",
    label: "Text Customization",
    subs:  [
      // AdminSEOManager already renders its own sub-tabs (SEO / Footer /
      // Nav / Home Copy) so we mount it as the only sub here.
      { key: "cms", label: "Content", render: () => <AdminSEOManager /> },
    ],
  },
];

export default function AdminDashboardPage() {
  const { user, loading, logout } = useAuth();
  const [tab, setTab]       = useState("gallery");
  const [subs, setSubs]     = useState({});         // { primaryKey: subKey } — sticky sub-selection per tab
  const [leadsOpen, setLeadsOpen] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    if (!loading && !user) nav("/admin/login", { replace: true });
  }, [loading, user, nav]);

  if (loading || !user) {
    return <main className="admin-shell pt-32 text-center overline text-[var(--muted)]">Loading…</main>;
  }

  const doLogout = async () => { await logout(); nav("/admin/login"); };

  const primary   = PRIMARY_TABS.find((t) => t.key === tab) || PRIMARY_TABS[0];
  const activeSub = primary.subs.find((s) => s.key === (subs[primary.key] || primary.subs[0].key)) || primary.subs[0];

  return (
    <main data-testid="admin-dashboard-page" className="admin-shell pt-8 pb-24">
      <Toaster position="top-center" theme="dark" richColors />

      <header className="max-w-[1440px] mx-auto px-6 md:px-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
        <div>
          <div className="overline text-[var(--gold-hi)] mb-3">Caremanto · Studio Console</div>
          <h1 className="font-serif text-[44px] md:text-[56px] leading-none">Welcome back.</h1>
          <div className="text-[13px] text-[#F5EEE0]/60 mt-2">Signed in as {user.email}</div>
        </div>
        <div className="flex items-center gap-3">
          <button
            data-testid="admin-leads-open"
            onClick={() => setLeadsOpen(true)}
            className="admin-btn ghost"
            title="Consultation leads inbox"
          >
            ☰ Leads
          </button>
          <button data-testid="admin-view-site" onClick={() => nav("/")}  className="admin-btn ghost">View Site</button>
          <button data-testid="admin-logout"    onClick={doLogout}         className="admin-btn ghost">Sign Out</button>
        </div>
      </header>

      {/* Primary tabs — strictly 4 */}
      <nav
        className="max-w-[1440px] mx-auto px-6 md:px-10 border-b border-[#F5EEE0]/10 mb-4"
        data-testid="admin-primary-nav"
      >
        <div className="flex items-center gap-8 overflow-x-auto scrollbar-thin">
          {PRIMARY_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              data-testid={`admin-tab-${t.key}`}
              className={`whitespace-nowrap py-4 overline text-[11px] uppercase tracking-[0.28em] relative transition-colors ${
                tab === t.key ? "text-[var(--gold-hi)]" : "text-[#F5EEE0]/75 hover:text-[var(--gold-hi)]"
              }`}
            >
              {t.label}
              {tab === t.key && <span className="absolute left-0 right-0 -bottom-[1px] h-[2px] bg-[var(--gold-hi)]" />}
            </button>
          ))}
        </div>
      </nav>

      {/* Secondary sub-toggle — visible only when the primary tab owns
          more than one sub. `AdminSEOManager` renders its own inner
          tabs so we hide the outer row in that case (single sub). */}
      {primary.subs.length > 1 && (
        <div
          className="max-w-[1440px] mx-auto px-6 md:px-10 mb-8"
          data-testid={`admin-sub-nav-${primary.key}`}
        >
          <div className="inline-flex items-center bg-[#241D16] border border-[#F5EEE0]/10 p-1">
            {primary.subs.map((s) => {
              const isActive = activeSub.key === s.key;
              return (
                <button
                  key={s.key}
                  onClick={() => setSubs((prev) => ({ ...prev, [primary.key]: s.key }))}
                  data-testid={`admin-subtab-${primary.key}-${s.key}`}
                  className={`px-4 md:px-5 py-2 text-[11px] uppercase tracking-[0.24em] transition-colors ${
                    isActive
                      ? "bg-[var(--gold-hi)] text-black font-medium"
                      : "text-[#F5EEE0]/70 hover:text-[var(--gold-hi)]"
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="max-w-[1440px] mx-auto px-6 md:px-10">
        {activeSub.render()}
      </div>

      {/* Leads slide-over — kept out of primary nav per iter 24 spec.
          Same underlying AdminLeads component, unchanged permissions. */}
      {leadsOpen && (
        <div
          className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-stretch justify-end"
          onClick={() => setLeadsOpen(false)}
          data-testid="admin-leads-overlay"
        >
          <div
            className="w-full md:w-[720px] h-full bg-[#1B1611] border-l border-[#F5EEE0]/10 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-[#F5EEE0]/10">
              <div>
                <div className="overline text-[var(--gold-hi)] mb-1">Studio Console</div>
                <h2 className="font-serif text-[24px]">Leads</h2>
              </div>
              <button
                onClick={() => setLeadsOpen(false)}
                data-testid="admin-leads-close"
                className="w-10 h-10 border border-[#F5EEE0]/25 text-white hover:border-[var(--gold-hi)] hover:text-[var(--gold-hi)]"
              >×</button>
            </div>
            <div className="p-6">
              <AdminLeads />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
