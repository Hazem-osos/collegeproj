"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api, getAxiosErrorMessage } from "@/lib/axios-instance";

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const isStudent = user?.role === "Student";

  const [fullName, setFullName] = useState("");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [busyProfile, setBusyProfile] = useState(false);
  const [busyPw, setBusyPw] = useState(false);

  useEffect(() => {
    if (user?.fullName) setFullName(user.fullName);
  }, [user?.fullName]);

  async function onProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileMsg(null);
    setBusyProfile(true);
    try {
      await api.patch("/api/me/profile", { fullName });
      await refreshUser();
      setProfileMsg("Display name saved.");
    } catch (err) {
      setProfileMsg(getAxiosErrorMessage(err));
    } finally {
      setBusyProfile(false);
    }
  }

  async function onPassword(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg(null);
    if (newPw !== confirmPw) {
      setPwMsg("New passwords do not match.");
      return;
    }
    setBusyPw(true);
    try {
      await api.post("/api/auth/password", { currentPassword: currentPw, newPassword: newPw });
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      setPwMsg("Password updated.");
    } catch (err) {
      setPwMsg(getAxiosErrorMessage(err));
    } finally {
      setBusyPw(false);
    }
  }

  return (
    <div className="space-y-10">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-white">Settings</h1>
        <p className="text-sm text-zinc-400">
          Update your password{isStudent ? " and how your name appears on the roster." : "."}
        </p>
      </header>

      {isStudent && (
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-4">
          <h2 className="text-sm font-medium text-white">Profile</h2>
          <form className="space-y-4 max-w-md" onSubmit={onProfile}>
            <div className="space-y-1">
              <label htmlFor="fullName" className="text-xs text-zinc-500">
                Display name
              </label>
              <input
                id="fullName"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                maxLength={100}
              />
            </div>
            <button
              type="submit"
              disabled={busyProfile}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              Save profile
            </button>
            {profileMsg && (
              <p
                className={`text-sm ${profileMsg.includes("saved") ? "text-emerald-400" : "text-red-400"}`}
              >
                {profileMsg}
              </p>
            )}
          </form>
        </section>
      )}

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-4">
        <h2 className="text-sm font-medium text-white">Password</h2>
        <form className="space-y-4 max-w-md" onSubmit={onPassword}>
          <div className="space-y-1">
            <label htmlFor="cur" className="text-xs text-zinc-500">
              Current password
            </label>
            <input
              id="cur"
              type="password"
              autoComplete="current-password"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="nw" className="text-xs text-zinc-500">
              New password (min 8)
            </label>
            <input
              id="nw"
              type="password"
              autoComplete="new-password"
              minLength={8}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="cf" className="text-xs text-zinc-500">
              Confirm new password
            </label>
            <input
              id="cf"
              type="password"
              autoComplete="new-password"
              minLength={8}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            disabled={busyPw}
            className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-white disabled:opacity-50"
          >
            Change password
          </button>
          {pwMsg && (
            <p className={`text-sm ${pwMsg.includes("updated") ? "text-emerald-400" : "text-red-400"}`}>
              {pwMsg}
            </p>
          )}
        </form>
      </section>
    </div>
  );
}
