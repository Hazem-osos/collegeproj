"use client";

import { useCallback, useEffect, useState } from "react";
import { api, getAxiosErrorMessage } from "@/lib/axios-instance";
import type { CourseItem, PersonItem } from "@/lib/api-client";

export default function CoursesPage() {
  const [rows, setRows] = useState<CourseItem[]>([]);
  const [instructors, setInstructors] = useState<PersonItem[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [credits, setCredits] = useState(3);
  const [instructorId, setInstructorId] = useState<number | "">("");

  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCredits, setEditCredits] = useState(3);
  const [editInstrId, setEditInstrId] = useState<number | "">("");

  const load = useCallback(async () => {
    setErr(null);
    try {
      const [c, i] = await Promise.all([
        api.get<CourseItem[]>("/api/courses"),
        api.get<PersonItem[]>("/api/instructors"),
      ]);
      setRows(c.data);
      setInstructors(i.data);
    } catch (e) {
      setErr(getAxiosErrorMessage(e));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (instructors.length > 0 && instructorId === "") {
      setInstructorId(instructors[0]!.id);
    }
  }, [instructors, instructorId]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (instructorId === "") return;
    setErr(null);
    try {
      await api.post("/api/courses", { title, credits, instructorId });
      setTitle("");
      setCredits(3);
      await load();
    } catch (e) {
      setErr(getAxiosErrorMessage(e));
    }
  }

  function openEdit(r: CourseItem) {
    setEditId(r.id);
    setEditTitle(r.title);
    setEditCredits(r.credits);
    const inst = instructors.find((i) => i.fullName === r.instructorName);
    setEditInstrId(inst?.id ?? "");
    setEditOpen(true);
  }

  async function onSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (editId == null || editInstrId === "") return;
    setErr(null);
    try {
      await api.patch(`/api/courses/${editId}`, {
        title: editTitle,
        credits: editCredits,
        instructorId: editInstrId,
      });
      setEditOpen(false);
      await load();
    } catch (e) {
      setErr(getAxiosErrorMessage(e));
    }
  }

  async function onDelete(id: number) {
    if (!window.confirm("Delete this course?")) return;
    setErr(null);
    try {
      await api.delete(`/api/courses/${id}`);
      await load();
    } catch (e) {
      setErr(getAxiosErrorMessage(e));
    }
  }

  return (
    <div>
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-white">Courses</h1>
        <p className="text-sm text-zinc-400">Create, edit, delete; each record belongs to an instructor.</p>
      </header>

      <form
        onSubmit={onCreate}
        className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:flex-row sm:flex-wrap sm:items-end"
      >
        <div className="flex flex-1 min-w-[180px] flex-col gap-1">
          <label className="text-xs text-zinc-500" htmlFor="c-title">
            Title
          </label>
          <input
            id="c-title"
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={100}
          />
        </div>
        <div className="flex w-24 flex-col gap-1">
          <label className="text-xs text-zinc-500" htmlFor="c-credits">
            Credits
          </label>
          <input
            id="c-credits"
            type="number"
            min={1}
            max={10}
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
            value={credits}
            onChange={(e) => setCredits(Number(e.target.value))}
          />
        </div>
        <div className="flex min-w-[200px] flex-1 flex-col gap-1">
          <label className="text-xs text-zinc-500" htmlFor="c-inst">
            Instructor
          </label>
          <select
            id="c-inst"
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
            value={instructorId === "" ? "" : String(instructorId)}
            onChange={(e) => setInstructorId(Number(e.target.value))}
          >
            {instructors.length === 0 && <option value="">— add an instructor first —</option>}
            {instructors.map((i) => (
              <option key={i.id} value={i.id}>
                {i.fullName}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          Add course
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
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Credits</th>
              <th className="px-4 py-3">Instructor</th>
              <th className="px-4 py-3 w-40">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-zinc-500 text-center">
                  No courses yet.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-zinc-800/60 hover:bg-zinc-900/30">
                <td className="px-4 py-3 text-zinc-100 font-medium">{r.title}</td>
                <td className="px-4 py-3 text-zinc-300 tabular-nums">{r.credits}</td>
                <td className="px-4 py-3 text-zinc-300">{r.instructorName}</td>
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
            <h2 className="text-lg font-semibold text-white">Edit course</h2>
            <form className="mt-4 space-y-3" onSubmit={onSaveEdit}>
              <div className="space-y-1">
                <label className="text-xs text-zinc-500">Title</label>
                <input
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  maxLength={100}
                />
              </div>
              <div className="flex gap-4">
                <div className="space-y-1 flex-1">
                  <label className="text-xs text-zinc-500">Credits</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
                    value={editCredits}
                    onChange={(e) => setEditCredits(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1 flex-[2]">
                  <label className="text-xs text-zinc-500">Instructor</label>
                  <select
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
                    value={editInstrId === "" ? "" : String(editInstrId)}
                    onChange={(e) => setEditInstrId(Number(e.target.value))}
                    required
                  >
                    {instructors.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.fullName}
                      </option>
                    ))}
                  </select>
                </div>
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
                  className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500"
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
