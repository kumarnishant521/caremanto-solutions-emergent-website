import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { formatApiError } from "../lib/api";

export default function AdminLoginPage() {
  const { user, login, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  if (loading) return <div className="min-h-screen bg-[var(--bg-0)]" />;
  if (user) return <Navigate to="/admin" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      await login(email, pw);
      nav("/admin", { replace: true });
    } catch (e) {
      setErr(formatApiError(e.response?.data?.detail) || "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main data-testid="admin-login-page" className="admin-shell min-h-screen flex items-center justify-center px-6 py-24">
      <div className="admin-card w-full max-w-md p-10">
        <div className="overline mb-4">Caremanto · Admin</div>
        <h1 className="font-serif text-4xl leading-tight mb-8">Sign in.</h1>
        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="overline text-[10px] block mb-2 text-[var(--muted)]">Email</label>
            <input
              data-testid="admin-email"
              type="email"
              className="admin-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="overline text-[10px] block mb-2 text-[var(--muted)]">Password</label>
            <input
              data-testid="admin-password"
              type="password"
              className="admin-input"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              required
            />
          </div>
          {err && <div className="text-[13px] text-[#ef7c7c]" data-testid="admin-error">{err}</div>}
          <button
            data-testid="admin-login-submit-button"
            disabled={busy}
            type="submit"
            className="admin-btn w-full disabled:opacity-50"
          >
            {busy ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </main>
  );
}
