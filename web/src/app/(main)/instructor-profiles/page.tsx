"use client";

import { useCallback, useEffect, useState } from "react";
import { api, getAxiosErrorMessage } from "@/lib/axios-instance";
import type { InstructorProfileItem, PersonItem } from "@/lib/api-client";

export default function InstructorProfilesPage() {
  const [rows, setRows] = useState<InstructorProfileItem[]>([]);
  const [instructors, setInstructors] = useState<PersonItem[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const [instructorId, setInstructorId] = useState<number | "">("");
  const [bio, setBio] = useState("");
  const [officeLocation, setOfficeLocation] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editBio, setEditBio] = useState("");
  const [editOffice, setEditOffice] = useState("");

  const load = useCallback(async () => {
    setErr(null);
    try {
      const [p, i] = await Promise.all([
        api.get<InstructorProfileItem[]>("/api/instructor-profiles"),
        api.get<PersonItem[]>("/api/instructors"),
      ]);
      setRows(p.data);
      setInstructors(i.data);
    } catch (e) {
      setErr(getAxiosErrorMessage(e));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (instructors.length > 0 && instructorId === "") setInstructorId(instructors[0]!.id);
  }, [instructors, instructorId]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (instructorId === "") return;
    setErr(null);
    try {
      await api.post("/api/instructor-profiles", { instructorId, bio, officeLocation });
      setBio("");
      setOfficeLocation("");
      await load();
    } catch (e) {
      setErr(getAxiosErrorMessage(e));
    }
  }

  function openEdit(r: InstructorProfileItem) {
    setEditId(r.id);
    setEditBio(r.bio);
    setEditOffice(r.officeLocation);
    setEditOpen(true);
  }

  async function onSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (editId == null) return;
    setErr(null);
    try {
      await api.patch(`/api/instructor-profiles/${editId}`, { bio: editBio, officeLocation: editOffice });
      setEditOpen(false);
      await load();
    } catch (e) {
      setErr(getAxiosErrorMessage(e));
    }
  }

  async function onDelete(id: number) {
    if (!window.confirm("Delete this profile?")) return;
    setErr(null);
    try {
      await api.delete(`/api/instructor-profiles/${id}`);
      await load();
    } catch (e) {
      setErr(getAxiosErrorMessage(e));
    }
  }

  const profiledIds = new Set(rows.map((r) => r.instructorId));
  const availableForNew = instructors.filter((i) => !profiledIds.has(i.id));

  return (
    <div>
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-white">Instructor profiles</h1>
        <p className="text-sm text-zinc-400">
          Optional 1:1 extension (bio & office); one profile per instructor in this schema.
        </p>
      </header>

      {availableForNew.length === 0 && instructors.length > 0 ? (
        <p className="text-sm text-zinc-500 rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          Every instructor already has a profile. Delete a profile first to create a replacement, or add a new
          instructor.
        </p>
      ) : (
        <form
          onSubmit={onCreate}
          className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:flex-row sm:flex-wrap sm:items-end"
        >
          <div className="flex min-w-[200px] flex-1 flex-col gap-1">
            <label className="text-xs text-zinc-500">Instructor</label>
            <select
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
              value={instructorId === "" ? "" : String(instructorId)}
              onChange={(e) => setInstructorId(Number(e.target.value))}
              required
            >
              {availableForNew.length === 0 && <option value="">— none —</option>}
              {(availableForNew.length > 0 ? availableForNew : instructors).map((i) => (
                <option key={i.id} value={i.id}>
                  {i.fullName}
                </option>
              ))}
            </select>
          </div>
          <div className="flex min-w-[200px] flex-[2] flex-col gap-1">
            <label className="text-xs text-zinc-500">Bio</label>
            <input
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              required
              maxLength={1000}
            />
          </div>
          <div className="flex min-w-[160px] flex-1 flex-col gap-1">
            <label className="text-xs text-zinc-500">Office</label>
            <input
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
              value={officeLocation}
              onChange={(e) => setOfficeLocation(e.target.value)}
              required
              maxLength={255}
            />
          </div>
          <button
            type="submit"
            disabled={availableForNew.length === 0}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-40"
          >
            Add profile
          </button>
        </form>
      )}

      {err && (
        <p className="text-sm text-red-400" role="alert">
          {err}
        </p>
      )}

      <div className="overflow-x-auto rounded-2xl border border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-800 bg-zinc-900/50 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3">Instructor</th>
              <th className="px-4 py-3">Office</th>
              <th className="px-4 py-3">Bio</th>
              <th className="px-4 py-3 w-40">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-zinc-500 text-center">
                  No profiles yet.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-zinc-800/60 hover:bg-zinc-900/30 align-top">
                <td className="px-4 py-3 text-zinc-100 font-medium">
                  {r.instructorName}
                  <span className="block text-xs text-zinc-500 font-normal">{r.instructorEmail}</span>
                </td>
                <td className="px-4 py-3 text-zinc-300 max-w-[140px]">{r.officeLocation}</td>
                <td className="px-4 py-3 text-zinc-400 text-xs max-w-md line-clamp-3" title={r.bio}>
                  {r.bio}
                </td>
                <td className="px-4 py-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(r)}
                    className="text-indigo-400 hover:text-indigo-300 text-xs font-medium shrink-0"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void onDelete(r.id)}
                    className="text-red-400 hover:text-red-300 text-xs shrink-0"
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
          <div className="w-full max-w-lg rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-white">Edit profile</h2>
            <form className="mt-4 space-y-3" onSubmit={onSaveEdit}>
              <div className="space-y-1">
                <label className="text-xs text-zinc-500">Bio</label>
                <textarea
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm min-h-[100px]"
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  required
                  maxLength={1000}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-zinc-500">Office location</label>
                <input
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
                  value={editOffice}
                  onChange={(e) => setEditOffice(e.target.value)}
                  required
                  maxLength={255}
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
