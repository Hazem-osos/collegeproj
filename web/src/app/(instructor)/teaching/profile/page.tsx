"use client";

import { useEffect, useState } from "react";
import { api, getAxiosErrorMessage } from "@/lib/axios-instance";

type Profile = {
  id: number;
  fullName: string;
  email: string;
  profile: { id: number; bio: string; officeLocation: string } | null;
};

export default function TeachingProfilePage() {
  const [data, setData] = useState<Profile | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [office, setOffice] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { data: d } = await api.get<Profile>("/api/teaching/profile");
        if (!cancelled) {
          setData(d);
          setFullName(d.fullName);
          setBio(d.profile?.bio ?? "");
          setOffice(d.profile?.officeLocation ?? "");
        }
      } catch (e) {
        if (!cancelled) setErr(getAxiosErrorMessage(e));
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    try {
      const body: { fullName: string; bio?: string; officeLocation?: string } = {
        fullName: fullName.trim(),
      };
      if (!data.profile) {
        if (bio.trim() || office.trim()) {
          if (!bio.trim() || !office.trim()) {
            setMsg("To create a profile record, fill both bio and office location.");
            setBusy(false);
            return;
          }
          body.bio = bio.trim();
          body.officeLocation = office.trim();
        }
      } else {
        if (bio.trim()) body.bio = bio.trim();
        if (office.trim()) body.officeLocation = office.trim();
      }
      const { data: d } = await api.patch<Profile>("/api/teaching/profile", body);
      setData(d);
      setMsg("Saved.");
    } catch (e2) {
      setMsg(getAxiosErrorMessage(e2));
    } finally {
      setBusy(false);
    }
  }

  if (err) {
    return (
      <p className="text-sm text-red-400" role="alert">
        {err}
      </p>
    );
  }
  if (!data) {
    return <p className="text-sm text-zinc-400">Loading…</p>;
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Office profile</h1>
        <p className="text-sm text-zinc-400">
          Public-facing name, bio, and office. First time: include both bio and office together.
        </p>
      </header>

      <form
        onSubmit={(e) => void onSubmit(e)}
        className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-4 max-w-lg"
      >
        <div className="space-y-1">
          <label className="text-xs text-zinc-500">Display name</label>
          <input
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            maxLength={100}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-zinc-500">Bio</label>
          <textarea
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm min-h-[100px]"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={1000}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-zinc-500">Office location</label>
          <input
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
            value={office}
            onChange={(e) => setOffice(e.target.value)}
            maxLength={255}
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Save
        </button>
        {msg && (
          <p className={`text-sm ${msg === "Saved." ? "text-emerald-400" : "text-red-400"}`}>{msg}</p>
        )}
      </form>
    </div>
  );
}
