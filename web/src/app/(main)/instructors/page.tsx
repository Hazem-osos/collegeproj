"use client";

import { useCallback, useEffect, useState } from "react";
import { api, getAxiosErrorMessage } from "@/lib/axios-instance";
import type { PersonItem } from "@/lib/api-client";

export default function InstructorsPage() {
  const [rows, setRows] = useState<PersonItem[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");

  const load = useCallback(async () => {
    setErr(null);
    try {
      const r = await api.get<PersonItem[]>("/api/instructors");
      setRows(r.data);
    } catch (e) {
      setErr(getAxiosErrorMessage(e));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      await api.post("/api/instructors", { fullName, email });
      setFullName("");
      setEmail("");
      await load();
    } catch (e) {
      setErr(getAxiosErrorMessage(e));
    }
  }

  function openEdit(r: PersonItem) {
    setEditId(r.id);
    setEditName(r.fullName);
    setEditEmail(r.email);
    setEditOpen(true);
  }

  async function onSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (editId == null) return;
    setErr(null);
    try {
      await api.patch(`/api/instructors/${editId}`, { fullName: editName, email: editEmail });
      setEditOpen(false);
      await load();
    } catch (e) {
      setErr(getAxiosErrorMessage(e));
    }
  }

  async function onDelete(id: number) {
    if (!window.confirm("Delete this instructor? Related courses are removed (cascade).")) return;
    setErr(null);
    try {
      await api.delete(`/api/instructors/${id}`);
      await load();
    } catch (e) {
      setErr(getAxiosErrorMessage(e));
    }
  }

  return (
    <div>
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-white">Instructors</h1>
        <p className="text-sm text-zinc-400">Optional 1:1 profile lives on the Instructor profiles page.</p>
      </header>

      <form
        onSubmit={onCreate}
        className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:flex-row sm:flex-wrap sm:items-end"
      >
        <div className="flex flex-1 min-w-[160px] flex-col gap-1">
          <label className="text-xs text-zinc-500" htmlFor="i-name">
            Full name
          </label>
          <input
            id="i-name"
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            maxLength={100}
          />
        </div>
        <div className="flex flex-1 min-w-[200px] flex-col gap-1">
          <label className="text-xs text-zinc-500" htmlFor="i-email">
            Email
          </label>
          <input
            id="i-email"
            type="email"
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          Add instructor
        </button>
      </form>

      {err && (
        <p className="text-sm text-red-400" role="alert">
          {err}
        </p>
      )}

      <div className="overflow-x-auto rounded-2xl border border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-800 bg-zinc-900/50 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3 w-40">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-zinc-500 text-center">
                  No instructors yet.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-zinc-800/60 hover:bg-zinc-900/30">
                <td className="px-4 py-3 text-zinc-100 font-medium">{r.fullName}</td>
                <td className="px-4 py-3 text-zinc-300">{r.email}</td>
                <td className="px-4 py-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(r)}
                    className="text-indigo-400 hover:text-indigo-300 text-xs font-medium"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void onDelete(r.id)}
                    className="text-red-400 hover:text-red-300 text-xs"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editOpen && editId !== null && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4" role="dialog">
          <div className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-white">Edit instructor</h2>
            <form className="mt-4 space-y-3" onSubmit={onSaveEdit}>
              <div className="space-y-1">
                <label className="text-xs text-zinc-500">Full name</label>
                <input
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  maxLength={100}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-zinc-500">Email</label>
                <input
                  type="email"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="rounded-lg border border-zinc-700 px-3 py-2 text-sm"
                  onClick={() => setEditOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
