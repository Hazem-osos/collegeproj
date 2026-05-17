import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-helpers";

const patchSchema = z.object({
  fullName: z.string().min(1).max(100),
});

export async function PATCH(request: Request) {
  const auth = await requireAuth(request);
  if ("response" in auth) return auth.response;

  const row = await prisma.user.findUnique({
    where: { email: auth.user.email.toLowerCase() },
    select: { role: true, studentId: true, instructorId: true },
  });

  if (!row) {
    return NextResponse.json({ error: "Profile not available" }, { status: 403 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  if (row.role === "Student" && row.studentId != null) {
    const updated = await prisma.student.update({
      where: { id: row.studentId },
      data: { fullName: parsed.data.fullName.trim() },
      select: { fullName: true, email: true },
    });
    return NextResponse.json(updated);
  }

  if (row.role === "Instructor" && row.instructorId != null) {
    const updated = await prisma.instructor.update({
      where: { id: row.instructorId },
      data: { fullName: parsed.data.fullName.trim() },
      select: { fullName: true, email: true },
    });
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Profile not available for this account" }, { status: 403 });
}
