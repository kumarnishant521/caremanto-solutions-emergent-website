import { useEffect, useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { api, formatApiError } from "../lib/api";

/**
 * Passless studio entry.
 * Auto-signs the studio in on visit — no credentials required for now.
 * The old email/password form has been retired at the user's request.
 */
export default function AdminLoginPage() {
  const { user, loading, refresh } = useAuth();
  const [err, setErr] = useState("");
  const nav = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (user) { nav("/admin", { replace: true }); return; }
    (async () => {
      try {
        await api.post("/auth/passless-login");
        if (refresh) await refresh();
        nav("/admin", { replace: true });
        // full reload guarantees AuthProvider re-hydrates from /auth/me
        window.location.replace("/admin");
      } catch (e) {
        setErr(formatApiError(e?.response?.data?.detail) || "Unable to enter studio.");
      }
    })();
  }, [loading, user, nav, refresh]);

  if (loading) return <div className="min-h-screen bg-[var(--bg-0)]" />;
  if (user) return <Navigate to="/admin" replace />;

  return (
    <main data-testid="admin-login-page" className="admin-shell min-h-screen flex items-center justify-center px-6 py-24">
      <div className="admin-card w-full max-w-md p-10 text-center">
        <div className="overline mb-4">Caremanto · Studio</div>
        <h1 className="font-serif text-4xl leading-tight mb-6">Entering studio…</h1>
        <p className="text-[13px] text-[var(--muted)] mb-8">Signing you in — no credentials needed.</p>
        {err ? (
          <div data-testid="admin-error" className="text-[13px] text-[#ef7c7c] mb-6">{err}</div>
        ) : (
          <div className="mx-auto h-1 w-24 bg-[var(--gold-hi)] animate-pulse" />
        )}
        {err && (
          <button
            data-testid="admin-retry"
            onClick={() => window.location.reload()}
            className="admin-btn w-full"
          >
            Retry
          </button>
        )}
      </div>
    </main>
  );
}
