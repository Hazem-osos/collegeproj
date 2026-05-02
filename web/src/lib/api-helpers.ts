import { NextResponse } from "next/server";
import { prisma } from "./prisma";
import { extractAuthToken, verifyToken, type AuthPayload } from "./auth-jwt";

export type AuthResult = { user: AuthPayload } | { response: NextResponse };

export async function requireAuth(request: Request): Promise<AuthResult> {
  const t = extractAuthToken(request);
  if (!t) {
    return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  try {
    const user = await verifyToken(t);
    return { user };
  } catch {
    return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
}

export function asJsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/** Admin-only actions; DB role wins when a Users row exists; otherwise trust JWT Admin (demo bootstrap). */
export async function requireAdminDb(auth: AuthPayload): Promise<NextResponse | null> {
  const row = await prisma.user.findUnique({
    where: { email: auth.email.toLowerCase() },
    select: { role: true },
  });

  if (row) {
    if (row.role !== "Admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    return null;
  }

  if (auth.role === "Admin") return null;

  return NextResponse.json({ error: "Admin access required" }, { status: 403 });
}

/** Logged-in roster student (Users.StudentId → Students). */
export async function requireStudentScoped(
  auth: AuthPayload,
): Promise<{ studentId: number } | NextResponse> {
  const row = await prisma.user.findUnique({
    where: { email: auth.email.toLowerCase() },
    select: { role: true, studentId: true },
  });

  if (!row || row.role !== "Student" || row.studentId == null) {
    return NextResponse.json({ error: "Student access only" }, { status: 403 });
  }

  return { studentId: row.studentId };
}
