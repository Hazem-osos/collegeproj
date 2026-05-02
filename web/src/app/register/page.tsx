"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api, getAxiosErrorMessage } from "@/lib/axios-instance";

export default function RegisterPage() {
  const { setUserFromAuthResponse, user, isReady } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isReady && user) {
      router.replace("/");
    }
  }, [isReady, user, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const { data } = await api.post<{ user: { email: string; role: string } }>(
        "/api/auth/register",
        { email, password },
      );
      setUserFromAuthResponse(data.user);
      router.replace("/");
    } catch (e) {
      setErr(getAxiosErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  if (!isReady) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-zinc-950 text-zinc-200">
        <p className="text-sm">Loading…</p>
      </div>
    );
  }
  if (user) return null;

  return (
    <div className="min-h-dvh flex items-center justify-center bg-zinc-950 px-4 py-12">
      <div className="w-full max-w-sm space-y-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 shadow-xl shadow-black/30">
        <div className="text-center space-y-1">
          <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">Course Management</p>
          <h1 className="text-2xl font-semibold text-white">Register</h1>
          <p className="text-sm text-zinc-400">
            New accounts get the Student role (full CRUD in this demo). Password must be at least 8 characters.
          </p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="email" className="text-xs text-zinc-500">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="password" className="text-xs text-zinc-500">
              Password (min 8)
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {err && (
            <p className="text-sm text-red-400" role="alert">
              {err}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>
        <p className="text-center text-sm">
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300">
            Already registered? Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
