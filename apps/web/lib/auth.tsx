"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { AuthUser } from "@fintrack/shared";
import { api, loginUser, registerUser, refreshTokens, getProfile } from "./api";
import { setSavedCurrency } from "./utils";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: AuthUser) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "fintrack_access_token";
const REFRESH_KEY = "fintrack_refresh_token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const persist = useCallback((accessToken: string, refreshToken: string) => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
    api.setToken(accessToken);
  }, []);

  const clear = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    api.setToken(null);
    setUser(null);
  }, []);

  // Restore session on mount
  useEffect(() => {
    const restore = async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      const refresh = localStorage.getItem(REFRESH_KEY);
      if (!token || !refresh) {
        setLoading(false);
        return;
      }
      api.setToken(token);
      try {
        const profile = await getProfile();
        setUser(profile);
        if (profile?.currency) setSavedCurrency(profile.currency);
      } catch {
        // Access token expired — try refresh
        try {
          const tokens = await refreshTokens(refresh);
          persist(tokens.accessToken, tokens.refreshToken);
          const profile = await getProfile();
          setUser(profile);
          if (profile?.currency) setSavedCurrency(profile.currency);
        } catch {
          clear();
        }
      }
      setLoading(false);
    };
    restore();
  }, [persist, clear]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { user: u, tokens } = await loginUser(email, password);
      persist(tokens.accessToken, tokens.refreshToken);
      setUser(u);
      if (u?.currency) setSavedCurrency(u.currency);
    },
    [persist],
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const { user: u, tokens } = await registerUser(name, email, password);
      persist(tokens.accessToken, tokens.refreshToken);
      setUser(u);
      if (u?.currency) setSavedCurrency(u.currency);
    },
    [persist],
  );

  const updateUser = useCallback((updated: AuthUser) => {
    setUser(updated);
    if (updated?.currency) setSavedCurrency(updated.currency);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout: clear, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
