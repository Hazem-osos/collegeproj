import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireStudentScoped } from "@/lib/api-helpers";

const postSchema = z.object({
  courseId: z.number().int().positive(),
});

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if ("response" in auth) return auth.response;
  const st = await requireStudentScoped(auth.user);
  if (st instanceof NextResponse) return st;

  const sid = st.studentId;
  const rows = await prisma.enrollment.findMany({
    where: { studentId: sid },
    orderBy: { enrolledAt: "desc" },
    select: {
      id: true,
      enrolledAt: true,
      status: true,
      grade: true,
      course: {
        select: {
          id: true,
          title: true,
          credits: true,
          instructor: { select: { fullName: true } },
        },
      },
    },
  });

  const body = rows.map((r) => ({
    enrollmentId: r.id,
    courseId: r.course.id,
    courseTitle: r.course.title,
    credits: r.course.credits,
    instructorFullName: r.course.instructor.fullName,
    status: r.status,
    grade: r.grade,
    enrolledAt: r.enrolledAt.toISOString(),
  }));

  return NextResponse.json(body);
}

/** Student self-service: request enrollment as <c>pending</c> (or re-request after <c>rejected</c>). */
export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if ("response" in auth) return auth.response;
  const st = await requireStudentScoped(auth.user);
  if (st instanceof NextResponse) return st;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = postSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const { courseId } = parsed.data;
  const studentId = st.studentId;

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

  const existing = await prisma.enrollment.findFirst({
    where: { studentId, courseId },
  });

  if (!existing) {
    const created = await prisma.enrollment.create({
      data: {
        studentId,
        courseId,
        enrolledAt: new Date(),
        status: "pending",
      },
      select: {
        id: true,
        enrolledAt: true,
        status: true,
        grade: true,
      },
    });
    return NextResponse.json(
      {
        enrollmentId: created.id,
        courseId,
        status: created.status,
        grade: created.grade,
        enrolledAt: created.enrolledAt.toISOString(),
      },
      { status: 201 },
    );
  }

  if (existing.status === "pending") {
    return NextResponse.json(
      { error: "You already have a pending enrollment request for this course" },
      { status: 409 },
    );
  }
  if (existing.status === "approved") {
    return NextResponse.json({ error: "You are already enrolled in this course" }, { status: 409 });
  }

  const updated = await prisma.enrollment.update({
    where: { id: existing.id },
    data: { status: "pending", enrolledAt: new Date() },
    select: {
      id: true,
      enrolledAt: true,
      status: true,
      grade: true,
    },
  });

  return NextResponse.json({
    enrollmentId: updated.id,
    courseId,
    status: updated.status,
    grade: updated.grade,
    enrolledAt: updated.enrolledAt.toISOString(),
  });
}
