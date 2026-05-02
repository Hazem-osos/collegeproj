/** Admin-only paths (students are redirected away by middleware). */
export const STUDENT_BLOCKED_PREFIXES = [
  "/courses",
  "/instructors",
  "/instructor-profiles",
  "/students",
  "/enrollments",
  "/dashboard",
] as const;

export function isAdminOnlyPagePath(pathname: string) {
  if (pathname === "/") return true;
  return STUDENT_BLOCKED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export function studentDefaultPath() {
  return "/my-courses";
}

export function postLoginRedirectPath(role: string, nextFromQuery: string | null): string {
  if (role === "Admin") {
    const next = nextFromQuery?.trim();
    return next?.startsWith("/") ? next : "/";
  }

  const next = nextFromQuery?.trim();
  if (
    next?.startsWith("/") &&
    (next === "/my-courses" || next.startsWith("/my-courses/") || next === "/settings")
  ) {
    return next;
  }
  return studentDefaultPath();
}
