"use client";

import { useCallback, useEffect, useState } from "react";
import { api, getAxiosErrorMessage } from "@/lib/axios-instance";

type CatalogRow = {
  id: number;
  title: string;
  credits: number;
  instructorName: string;
  enrollmentId: number | null;
  enrollmentStatus: string | null;
};

function statusLabel(status: string | null) {
  if (!status) return "Not requested";
  if (status === "pending") return "Awaiting approval";
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Declined";
  return status;
}

export default function BrowseCoursesPage() {
  const [rows, setRows] = useState<CatalogRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busyCourseId, setBusyCourseId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const { data } = await api.get<CatalogRow[]>("/api/catalog/courses");
      setRows(data);
    } catch (e) {
      setRows([]);
      setErr(getAxiosErrorMessage(e));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function requestEnrollment(courseId: number) {
    setMsg(null);
    setErr(null);
    setBusyCourseId(courseId);
    try {
      await api.post("/api/me/enrollments", { courseId });
      setMsg("Request submitted. Your instructor or an admin must approve your enrollment.");
      await load();
    } catch (e) {
      setErr(getAxiosErrorMessage(e));
    } finally {
      setBusyCourseId(null);
    }
  }

  return (
    <div>
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-white">Browse courses</h1>
        <p className="text-sm text-zinc-400">
          Request a seat in open courses. You will appear on the roster only after approval from the course
          instructor or an administrator.
        </p>
      </header>

      {err && (
        <p className="text-sm text-red-400" role="alert">
          {err}
        </p>
      )}
      {msg && (
        <p className="text-sm text-emerald-400" role="status">
          {msg}
        </p>
      )}

      <div className="overflow-x-auto rounded-2xl border border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-800 bg-zinc-900/50 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3">Course</th>
              <th className="px-4 py-3">Instructor</th>
              <th className="px-4 py-3">Credits</th>
              <th className="px-4 py-3">Your status</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                  No courses are available yet.
                </td>
              </tr>
            )}
            {rows.map((r) => {
              const busy = busyCourseId === r.id;
              return (
                <tr key={r.id} className="border-b border-zinc-800/60 hover:bg-zinc-900/30">
                  <td className="px-4 py-3 font-medium text-zinc-100">{r.title}</td>
                  <td className="px-4 py-3 text-zinc-300">{r.instructorName}</td>
                  <td className="px-4 py-3 tabular-nums text-zinc-400">{r.credits}</td>
                  <td className="px-4 py-3 text-zinc-300 text-xs">{statusLabel(r.enrollmentStatus)}</td>
                  <td className="px-4 py-3">
                    {r.enrollmentStatus === "approved" ? (
                      <span className="text-xs text-zinc-500">—</span>
                    ) : r.enrollmentStatus === "pending" ? (
                      <span className="text-xs text-amber-400/90">Waiting for approval</span>
                    ) : (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void requestEnrollment(r.id)}
                        className="text-xs font-medium text-indigo-400 hover:text-indigo-300 disabled:opacity-50"
                      >
                        {r.enrollmentStatus === "rejected" ? "Request again" : "Request enrollment"}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
