"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { InstructorShell } from "./InstructorShell";

function Loading() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-zinc-950 text-zinc-200">
      <p className="text-sm">Loading…</p>
    </div>
  );
}

export function InstructorAuthedLayout({ children }: { children: React.ReactNode }) {
  const { user, isReady } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isReady && !user) router.replace("/login");
  }, [isReady, user, router]);

  useEffect(() => {
    if (isReady && user?.role === "Admin") router.replace("/");
  }, [isReady, user, router]);

  useEffect(() => {
    if (isReady && user?.role === "Student") router.replace("/my-courses");
  }, [isReady, user, router]);

  if (!isReady) return <Loading />;
  if (!user) return null;
  if (user.role !== "Instructor") return null;

  return <InstructorShell>{children}</InstructorShell>;
}
