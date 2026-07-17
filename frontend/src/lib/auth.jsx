import { createContext, useContext, useEffect, useState } from "react";
import { api } from "./api";

const AuthCtx = createContext({ user: null, loading: true, login: async () => {}, logout: async () => {} });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // Suppress 401 console noise on public pages — expected when not signed in
        const { data } = await api.get("/auth/me", { validateStatus: (s) => s < 500 || s === 401 });
        if (data && data.role) setUser(data);
        else setUser(null);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    setUser(data);
    return data;
  };

  const logout = async () => {
    try { await api.post("/auth/logout"); } catch { /* ignore */ }
    setUser(null);
  };

  const refresh = async () => {
    try {
      const { data } = await api.get("/auth/me", { validateStatus: (s) => s < 500 || s === 401 });
      if (data && data.role) setUser(data);
      else setUser(null);
    } catch { setUser(null); }
  };

  return <AuthCtx.Provider value={{ user, loading, login, logout, refresh }}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
