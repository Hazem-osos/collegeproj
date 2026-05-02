import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-helpers";

type Ctx = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  grade: z.string().max(10).nullable().optional(),
  enrolledAt: z.string().datetime().optional(),
});

async function enrollmentJson(id: number) {
  const row = await prisma.enrollment.findFirst({
    where: { id },
    select: {
      id: true,
      enrolledAt: true,
      grade: true,
      studentId: true,
      courseId: true,
      student: { select: { fullName: true } },
      course: { select: { title: true } },
    },
  });
  if (!row) return null;
  return {
    id: row.id,
    enrolledAt: row.enrolledAt.toISOString(),
    grade: row.grade,
    studentId: row.studentId,
    courseId: row.courseId,
    studentName: row.student.fullName,
    courseTitle: row.course.title,
  };
}

export async function GET(request: Request, context: Ctx) {
  const auth = await requireAuth(request);
  if ("response" in auth) return auth.response;

  const id = Number((await context.params).id);
  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const body = await enrollmentJson(id);
  if (!body) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(body);
}

export async function PATCH(request: Request, context: Ctx) {
  const auth = await requireAuth(request);
  if ("response" in auth) return auth.response;

  const id = Number((await context.params).id);
  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
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

  const existing = await prisma.enrollment.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data: { grade?: string | null; enrolledAt?: Date } = {};
  if (parsed.data.grade !== undefined) data.grade = parsed.data.grade;
  if (parsed.data.enrolledAt !== undefined) data.enrolledAt = new Date(parsed.data.enrolledAt);

  await prisma.enrollment.update({ where: { id }, data });

  const body = await enrollmentJson(id);
  return NextResponse.json(body);
}

export async function DELETE(request: Request, context: Ctx) {
  const auth = await requireAuth(request);
  if ("response" in auth) return auth.response;

  const id = Number((await context.params).id);
  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const existing = await prisma.enrollment.findUnique({ where: { id } });
  if (!existing) return new NextResponse(null, { status: 404 });

  await prisma.enrollment.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
