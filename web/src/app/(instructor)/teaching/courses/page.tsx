"use client";

import { useCallback, useEffect, useState } from "react";
import { api, getAxiosErrorMessage } from "@/lib/axios-instance";

type Row = {
  id: number;
  title: string;
  credits: number;
  enrollmentCount: number;
  pendingEnrollmentCount: number;
};

export default function TeachingCoursesPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [credits, setCredits] = useState(3);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const { data } = await api.get<Row[]>("/api/teaching/courses");
      setRows(data);
    } catch (e) {
      setErr(getAxiosErrorMessage(e));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openEdit(r: Row) {
    setEditId(r.id);
    setTitle(r.title);
    setCredits(r.credits);
    setEditOpen(true);
  }

  async function onSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (editId == null) return;
    setErr(null);
    try {
      await api.patch(`/api/teaching/courses/${editId}`, { title, credits });
      setEditOpen(false);
      await load();
    } catch (e2) {
      setErr(getAxiosErrorMessage(e2));
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-white">My courses</h1>
        <p className="text-sm text-zinc-400">Edit titles and credits only for courses assigned to you.</p>
      </header>

      {err && (
        <p className="text-sm text-red-400" role="alert">
          {err}
        </p>
      )}

      <div className="overflow-x-auto rounded-2xl border border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-800 bg-zinc-900/50 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Credits</th>
              <th className="px-4 py-3">Enrolled</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-zinc-500 text-center">
                  No courses yet — ask an admin to assign courses to your instructor record.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-zinc-800/60 hover:bg-zinc-900/30">
                <td className="px-4 py-3 text-zinc-100 font-medium">{r.title}</td>
                <td className="px-4 py-3">{r.credits}</td>
                <td className="px-4 py-3 text-zinc-400">
                  <span className="tabular-nums">{r.enrollmentCount} approved</span>
                  {r.pendingEnrollmentCount > 0 ? (
                    <span className="block text-xs text-amber-400/90">
                      +{r.pendingEnrollmentCount} pending
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => openEdit(r)}
                    className="text-indigo-400 hover:text-indigo-300 text-xs font-medium"
                  >
                    Edit
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
            <h2 className="text-lg font-semibold text-white">Edit course</h2>
            <form className="mt-4 space-y-3" onSubmit={(e) => void onSaveEdit(e)}>
              <div className="space-y-1">
                <label className="text-xs text-zinc-500">Title</label>
                <input
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  maxLength={100}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-zinc-500">Credits (1–10)</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
                  value={credits}
                  onChange={(e) => setCredits(Number(e.target.value))}
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
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white"
                >
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
