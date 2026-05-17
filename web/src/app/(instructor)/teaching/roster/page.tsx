"use client";

import { useCallback, useEffect, useState } from "react";
import { api, getAxiosErrorMessage } from "@/lib/axios-instance";

type Row = {
  id: number;
  enrolledAt: string;
  status: string;
  grade: string | null;
  studentId: number;
  courseId: number;
  studentName: string;
  courseTitle: string;
};

export default function TeachingRosterPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const { data } = await api.get<Row[]>("/api/teaching/enrollments");
      setRows(data);
    } catch (e) {
      setErr(getAxiosErrorMessage(e));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function patchEnrollment(id: number, body: { status?: "approved" | "rejected"; grade?: string | null }) {
    setBusyId(id);
    setErr(null);
    try {
      await api.patch(`/api/teaching/enrollments/${id}`, body);
      await load();
    } catch (e) {
      setErr(getAxiosErrorMessage(e));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Roster & grades</h1>
        <p className="text-sm text-zinc-400">
          Approve or decline enrollment requests from students on your roster. Grade only applies after approval.
        </p>
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
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Course</th>
              <th className="px-4 py-3">Requested</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Grade</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-zinc-500 text-center">
                  No enrollments in your courses yet.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <RosterRow
                key={r.id}
                row={r}
                disabled={busyId === r.id}
                onPatch={(body) => void patchEnrollment(r.id, body)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RosterRow({
  row,
  disabled,
  onPatch,
}: {
  row: Row;
  disabled: boolean;
  onPatch: (body: { status?: "approved" | "rejected"; grade?: string | null }) => void | Promise<void>;
}) {
  const [val, setVal] = useState(row.grade ?? "");
  useEffect(() => setVal(row.grade ?? ""), [row.grade]);

  const pending = row.status === "pending";
  const approved = row.status === "approved";
  const rejected = row.status === "rejected";

  return (
    <tr className="border-b border-zinc-800/60 hover:bg-zinc-900/30 align-top">
      <td className="px-4 py-3 text-zinc-100 font-medium">{row.studentName}</td>
      <td className="px-4 py-3">{row.courseTitle}</td>
      <td className="px-4 py-3 text-xs text-zinc-500">{new Date(row.enrolledAt).toLocaleDateString()}</td>
      <td className="px-4 py-3">
        {pending && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={disabled}
              onClick={() => void onPatch({ status: "approved" })}
              className="rounded bg-emerald-700/80 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
            >
              Approve
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => void onPatch({ status: "rejected" })}
              className="rounded border border-zinc-600 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
            >
              Decline
            </button>
          </div>
        )}
        {approved && <span className="text-xs font-medium text-emerald-400/90">Approved</span>}
        {rejected && <span className="text-xs text-red-400/90">Declined</span>}
      </td>
      <td className="px-4 py-3">
        {!approved ? (
          <span className="text-xs text-zinc-600">—</span>
        ) : (
          <div className="flex gap-2 items-center flex-wrap">
            <input
              className="w-20 rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs"
              value={val}
              onChange={(e) => setVal(e.target.value)}
              placeholder="—"
              maxLength={10}
              disabled={disabled}
            />
            <button
              type="button"
              disabled={
                disabled || val.trim() === (row.grade ?? "") || (val.trim() === "" && row.grade == null)
              }
              onClick={() => void onPatch({ grade: val.trim() === "" ? null : val.trim() })}
              className="text-xs text-indigo-400 hover:text-indigo-300 disabled:opacity-40"
            >
              Save
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}
