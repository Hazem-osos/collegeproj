"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { api, getAxiosErrorMessage } from "@/lib/axios-instance";
import type { CourseItem, PersonItem } from "@/lib/api-client";
import type { EnrollmentItem } from "@/lib/api-client";

export default function DashboardPage() {
  const { user, isReady } = useAuth();
  const [stats, setStats] = useState<{
    courses: number;
    instructors: number;
    students: number;
    enrollments: number;
    profiles: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setError(null);
    try {
      const [courses, instructors, students, enrollments, profiles] = await Promise.all([
        api.get<CourseItem[]>("/api/courses"),
        api.get<PersonItem[]>("/api/instructors"),
        api.get<PersonItem[]>("/api/students"),
        api.get<EnrollmentItem[]>("/api/enrollments"),
        api.get<unknown[]>("/api/instructor-profiles"),
      ]);
      setStats({
        courses: courses.data.length,
        instructors: instructors.data.length,
        students: students.data.length,
        enrollments: enrollments.data.length,
        profiles: profiles.data.length,
      });
    } catch (e) {
      setStats(null);
      setError(getAxiosErrorMessage(e));
    }
  }, [user]);

  useEffect(() => {
    if (isReady && user) void load();
  }, [isReady, user, load]);

  return (
    <div>
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-white">Dashboard</h1>
        <p className="text-sm text-zinc-400">
          Overview across all domain entities. Use the sidebar for full CRUD on each module.
        </p>
      </header>
      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
      {stats && (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 pt-2">
          {(
            [
              ["Courses", stats.courses, "/courses"],
              ["Instructors", stats.instructors, "/instructors"],
              ["Profiles", stats.profiles, "/instructor-profiles"],
              ["Students", stats.students, "/students"],
              ["Enrollments", stats.enrollments, "/enrollments"],
            ] as const
          ).map(([label, n, href]) => (
            <li key={label}>
              <Link
                href={href}
                className="block rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 shadow-sm shadow-black/20 hover:border-indigo-500/40 transition-colors"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
                <p className="mt-2 text-3xl font-semibold text-white tabular-nums">{n}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
