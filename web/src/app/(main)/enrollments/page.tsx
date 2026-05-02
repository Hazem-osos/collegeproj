"use client";

import { useCallback, useEffect, useState } from "react";
import { api, getAxiosErrorMessage } from "@/lib/axios-instance";
import type {
  EnrollmentItem,
  PersonItem,
  CourseItem,
} from "@/lib/api-client";

function localInputToISO(value: string) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

export default function EnrollmentsPage() {
  const [rows, setRows] = useState<EnrollmentItem[]>([]);
  const [students, setStudents] = useState<PersonItem[]>([]);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const [studentId, setStudentId] = useState<number | "">("");
  const [courseId, setCourseId] = useState<number | "">("");
  const [enrolledAtLocal, setEnrolledAtLocal] = useState("");
  const [gradeNew, setGradeNew] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState<EnrollmentItem | null>(null);
  const [editGrade, setEditGrade] = useState("");
  const [editEnrolledLocal, setEditEnrolledLocal] = useState("");

  const load = useCallback(async () => {
    setErr(null);
    try {
      const [en, st, cr] = await Promise.all([
        api.get<EnrollmentItem[]>("/api/enrollments"),
        api.get<PersonItem[]>("/api/students"),
        api.get<CourseItem[]>("/api/courses"),
      ]);
      setRows(en.data);
      setStudents(st.data);
      setCourses(cr.data);
    } catch (e) {
      setErr(getAxiosErrorMessage(e));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (students.length > 0 && studentId === "") setStudentId(students[0]!.id);
    if (courses.length > 0 && courseId === "") setCourseId(courses[0]!.id);
  }, [students, courses, studentId, courseId]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (studentId === "" || courseId === "") return;
    setErr(null);
    try {
      const iso = enrolledAtLocal ? localInputToISO(enrolledAtLocal) : undefined;
      await api.post("/api/enrollments", {
        studentId,
        courseId,
        ...(iso ? { enrolledAt: iso } : {}),
        ...(gradeNew.trim() !== "" ? { grade: gradeNew.trim() } : {}),
      });
      setGradeNew("");
      await load();
    } catch (e) {
      setErr(getAxiosErrorMessage(e));
    }
  }

  function openEdit(r: EnrollmentItem) {
    setEditRow(r);
    setEditGrade(r.grade ?? "");
    const d = new Date(r.enrolledAt);
    const pad = (n: number) => String(n).padStart(2, "0");
    const local =
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T` +
      `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    setEditEnrolledLocal(local);
    setEditOpen(true);
  }

  async function onSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editRow) return;
    setErr(null);
    try {
      const iso = localInputToISO(editEnrolledLocal);
      await api.patch(`/api/enrollments/${editRow.id}`, {
        grade: editGrade.trim() === "" ? null : editGrade.trim(),
        ...(iso ? { enrolledAt: iso } : {}),
      });
      setEditOpen(false);
      await load();
    } catch (e) {
      setErr(getAxiosErrorMessage(e));
    }
  }

  async function onDelete(id: number) {
    if (!window.confirm("Remove this enrollment?")) return;
    setErr(null);
    try {
      await api.delete(`/api/enrollments/${id}`);
      await load();
    } catch (e) {
      setErr(getAxiosErrorMessage(e));
    }
  }

  return (
    <div>
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-white">Enrollments</h1>
        <p className="text-sm text-zinc-400">Many-to-many link between students and courses with optional grade.</p>
      </header>

      <form
        onSubmit={onCreate}
        className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:flex-row sm:flex-wrap sm:items-end"
      >
        <div className="flex min-w-[160px] flex-1 flex-col gap-1">
          <label className="text-xs text-zinc-500">Student</label>
          <select
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
            value={studentId === "" ? "" : String(studentId)}
            onChange={(e) => setStudentId(Number(e.target.value))}
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.fullName}
              </option>
            ))}
          </select>
        </div>
        <div className="flex min-w-[160px] flex-1 flex-col gap-1">
          <label className="text-xs text-zinc-500">Course</label>
          <select
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
            value={courseId === "" ? "" : String(courseId)}
            onChange={(e) => setCourseId(Number(e.target.value))}
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
        <div className="flex min-w-[180px] flex-col gap-1">
          <label className="text-xs text-zinc-500">Enrolled at (optional)</label>
          <input
            type="datetime-local"
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
            value={enrolledAtLocal}
            onChange={(e) => setEnrolledAtLocal(e.target.value)}
          />
        </div>
        <div className="flex w-24 flex-col gap-1">
          <label className="text-xs text-zinc-500">Grade</label>
          <input
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
            value={gradeNew}
            onChange={(e) => setGradeNew(e.target.value)}
            maxLength={10}
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          Enroll
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
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Course</th>
              <th className="px-4 py-3">Enrolled</th>
              <th className="px-4 py-3">Grade</th>
              <th className="px-4 py-3 w-40">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-zinc-500 text-center">
                  No enrollments yet.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-zinc-800/60 hover:bg-zinc-900/30">
                <td className="px-4 py-3 text-zinc-100 font-medium">{r.studentName}</td>
                <td className="px-4 py-3 text-zinc-300">{r.courseTitle}</td>
                <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">
                  {new Date(r.enrolledAt).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-zinc-300">{r.grade ?? "—"}</td>
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

      {editOpen && editRow && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4" role="dialog">
          <div className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-white">Edit enrollment</h2>
            <p className="text-xs text-zinc-500 mt-1">
              {editRow.studentName} → {editRow.courseTitle}
            </p>
            <form className="mt-4 space-y-3" onSubmit={onSaveEdit}>
              <div className="space-y-1">
                <label className="text-xs text-zinc-500">Enrolled at</label>
                <input
                  type="datetime-local"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
                  value={editEnrolledLocal}
                  onChange={(e) => setEditEnrolledLocal(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-zinc-500">Grade (blank = none)</label>
                <input
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
                  value={editGrade}
                  onChange={(e) => setEditGrade(e.target.value)}
                  maxLength={10}
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
