"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api } from "@/lib/axios-instance";

export type AuthUser = {
  email: string;
  role: string;
  studentId?: number | null;
  fullName?: string | null;
};

type AuthContextValue = {
  user: AuthUser | null;
  isReady: boolean;
  refreshUser: () => Promise<void>;
  setUserFromAuthResponse: (u: AuthUser) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get<{ user: AuthUser }>("/api/auth/me");
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const setUserFromAuthResponse = useCallback((u: AuthUser) => {
    setUser(u);
    setIsReady(true);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/api/auth/logout");
    } finally {
      setUser(null);
    }
  }, []);

  const v = useMemo(
    () => ({ user, isReady, refreshUser, setUserFromAuthResponse, logout }),
    [user, isReady, refreshUser, setUserFromAuthResponse, logout],
  );

  return <AuthContext.Provider value={v}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const c = useContext(AuthContext);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}
