"use client";

import { useCallback, useEffect, useState } from "react";
import { api, getAxiosErrorMessage } from "@/lib/axios-instance";

type Row = {
  enrollmentId: number;
  courseId: number;
  courseTitle: string;
  credits: number;
  instructorFullName: string;
  grade: string | null;
  enrolledAt: string;
};

export default function MyCoursesPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const { data } = await api.get<Row[]>("/api/me/enrollments");
      setRows(data);
    } catch (e) {
      setRows([]);
      setErr(getAxiosErrorMessage(e));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-white">My courses</h1>
        <p className="text-sm text-zinc-400">
          Courses you are enrolled in, with instructor (professor) name. Admins enroll you via the roster.
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
              <th className="px-4 py-3">Course</th>
              <th className="px-4 py-3">Instructor</th>
              <th className="px-4 py-3">Credits</th>
              <th className="px-4 py-3">Grade</th>
              <th className="px-4 py-3">Enrolled</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                  No enrollments yet. Contact your administrator once you appear on the roster.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.enrollmentId} className="border-b border-zinc-800/60 hover:bg-zinc-900/30">
                <td className="px-4 py-3 font-medium text-zinc-100">{r.courseTitle}</td>
                <td className="px-4 py-3 text-zinc-300">{r.instructorFullName}</td>
                <td className="px-4 py-3 tabular-nums text-zinc-400">{r.credits}</td>
                <td className="px-4 py-3 text-zinc-300">{r.grade ?? "—"}</td>
                <td className="px-4 py-3 text-zinc-500 whitespace-nowrap text-xs">
                  {new Date(r.enrolledAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
