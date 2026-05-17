"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, getAxiosErrorMessage } from "@/lib/axios-instance";

type Row = {
  id: number;
  title: string;
  credits: number;
  enrollmentCount: number;
  pendingEnrollmentCount: number;
};

export default function TeachingOverviewPage() {
  const [courses, setCourses] = useState<Row[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { data } = await api.get<Row[]>("/api/teaching/courses");
        if (!cancelled) setCourses(data);
      } catch (e) {
        if (!cancelled) setErr(getAxiosErrorMessage(e));
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const approvedTotal = courses.reduce((s, c) => s + c.enrollmentCount, 0);
  const pendingTotal = courses.reduce((s, c) => s + c.pendingEnrollmentCount, 0);

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-white">Teaching overview</h1>
        <p className="text-sm text-zinc-400">
          Manage courses you&apos;re assigned to, roster enrollments, and your office profile.
        </p>
      </header>

      {err && (
        <p className="text-sm text-red-400" role="alert">
          {err}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
          <p className="text-xs text-zinc-500 uppercase tracking-wide">Courses</p>
          <p className="text-3xl font-semibold text-white mt-1">{courses.length}</p>
          <Link
            href="/teaching/courses"
            className="text-xs text-indigo-400 hover:text-indigo-300 mt-2 inline-block"
          >
            Open course list →
          </Link>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
          <p className="text-xs text-zinc-500 uppercase tracking-wide">Approved enrollments</p>
          <p className="text-3xl font-semibold text-white mt-1">{approvedTotal}</p>
          {pendingTotal > 0 && (
            <p className="text-sm text-amber-400/90 mt-1">{pendingTotal} awaiting approval</p>
          )}
          <Link
            href="/teaching/roster"
            className="text-xs text-indigo-400 hover:text-indigo-300 mt-2 inline-block"
          >
            Roster & grades →
          </Link>
        </div>
      </div>
    </div>
  );
}
