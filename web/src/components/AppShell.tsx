"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const nav = [
  { href: "/", label: "Dashboard" },
  { href: "/courses", label: "Courses" },
  { href: "/instructors", label: "Instructors" },
  { href: "/instructor-profiles", label: "Instructor profiles" },
  { href: "/students", label: "Students" },
  { href: "/enrollments", label: "Enrollments" },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuth();

  return (
    <div className="min-h-dvh flex bg-zinc-950 text-zinc-100">
      <aside className="w-60 shrink-0 border-r border-zinc-800/80 p-4 flex flex-col gap-6 bg-zinc-900/50">
        <div>
          <p className="text-xs uppercase tracking-widest text-zinc-500">Course Management</p>
          <h1 className="text-lg font-semibold text-white mt-1">Control Center</h1>
        </div>
        <nav className="flex flex-col gap-1" aria-label="Main">
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-indigo-600 text-white"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto space-y-3">
          {user && (
            <p className="text-xs text-zinc-400 rounded-md border border-zinc-700/80 bg-zinc-950/60 px-2 py-1.5 text-center truncate" title={user.email}>
              {user.email}{" "}
              <span className="block text-emerald-400/90 capitalize mt-1">{user.role}</span>
            </p>
          )}
          <button
            type="button"
            onClick={async () => {
              await logout();
              router.replace("/login");
            }}
            className="w-full rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6 md:p-10 overflow-auto">
        <div className="max-w-5xl mx-auto space-y-8">{children}</div>
      </main>
    </div>
  );
}
