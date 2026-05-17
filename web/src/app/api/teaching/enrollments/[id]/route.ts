import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireInstructorScoped } from "@/lib/api-helpers";

type Ctx = { params: Promise<{ id: string }> };

const patchSchema = z
  .object({
    grade: z.string().max(10).nullable().optional(),
    status: z.enum(["approved", "rejected"]).optional(),
  })
  .refine((x) => x.grade !== undefined || x.status !== undefined, {
    message: "Provide grade and/or status",
  });

export async function PATCH(request: Request, context: Ctx) {
  const auth = await requireAuth(request);
  if ("response" in auth) return auth.response;
  const scoped = await requireInstructorScoped(auth.user);
  if (scoped instanceof NextResponse) return scoped;

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

  const enrollment = await prisma.enrollment.findFirst({
    where: { id },
    include: { course: { select: { instructorId: true } } },
  });
  if (!enrollment || enrollment.course.instructorId !== scoped.instructorId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const nextStatus =
    parsed.data.status !== undefined ? parsed.data.status : enrollment.status;

  if (parsed.data.grade !== undefined && nextStatus !== "approved") {
    return NextResponse.json(
      { error: "Grade can only be set when the enrollment is approved" },
      { status: 400 },
    );
  }

  const data: { grade?: string | null; status?: string } = {};
  if (parsed.data.grade !== undefined) {
    data.grade = parsed.data.grade;
  }
  if (parsed.data.status !== undefined) {
    data.status = parsed.data.status;
    if (parsed.data.status === "rejected") {
      data.grade = null;
    }
  }

  const updated = await prisma.enrollment.update({
    where: { id },
    data,
    select: {
      id: true,
      enrolledAt: true,
      status: true,
      grade: true,
      studentId: true,
      courseId: true,
      student: { select: { fullName: true } },
      course: { select: { title: true } },
    },
  });

  return NextResponse.json({
    id: updated.id,
    enrolledAt: updated.enrolledAt.toISOString(),
    status: updated.status,
    grade: updated.grade,
    studentId: updated.studentId,
    courseId: updated.courseId,
    studentName: updated.student.fullName,
    courseTitle: updated.course.title,
  });
}
