import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { Toaster } from "sonner";
import AdminProjects from "../components/admin/AdminProjects";
import AdminGallery from "../components/admin/AdminGallery";
import AdminLeads from "../components/admin/AdminLeads";

const TABS = [
  { key: "projects", label: "Projects" },
  { key: "gallery",  label: "Gallery"  },
  { key: "leads",    label: "Leads"    },
];

export default function AdminDashboardPage() {
  const { user, loading, logout } = useAuth();
  const [tab, setTab] = useState("gallery");   // land on Gallery — the tab studio uses most
  const nav = useNavigate();

  useEffect(() => {
    if (!loading && !user) nav("/admin/login", { replace: true });
  }, [loading, user, nav]);

  if (loading || !user) {
    return <main className="admin-shell pt-32 text-center overline text-[var(--muted)]">Loading…</main>;
  }

  const doLogout = async () => { await logout(); nav("/admin/login"); };

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
          <button data-testid="admin-view-site" onClick={() => nav("/")} className="admin-btn ghost">View Site</button>
          <button data-testid="admin-logout" onClick={doLogout} className="admin-btn ghost">Sign Out</button>
        </div>
      </header>

      <nav className="max-w-[1440px] mx-auto px-6 md:px-10 border-b border-[#F5EEE0]/10 mb-8">
        <div className="flex items-center gap-8">
          {TABS.map((t) => (
            <button
              key={t.key}
              data-testid={`admin-tab-${t.key}`}
              onClick={() => setTab(t.key)}
              className={`py-4 overline text-[11px] transition-colors relative ${
                tab === t.key ? "text-[var(--gold-hi)]" : "text-[#F5EEE0]/80 hover:text-[var(--gold-hi)]"
              }`}
            >
              {t.label}
              {tab === t.key && <span className="absolute left-0 right-0 -bottom-[1px] h-[2px] bg-[var(--gold-hi)]"/>}
            </button>
          ))}
        </div>
      </nav>

      <div className="max-w-[1440px] mx-auto px-6 md:px-10">
        {tab === "projects" && <AdminProjects />}
        {tab === "gallery"  && <AdminGallery  />}
        {tab === "leads"    && <AdminLeads    />}
      </div>
    </main>
  );
}
