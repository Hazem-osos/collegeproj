import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminDb, requireAuth } from "@/lib/api-helpers";

const createSchema = z.object({
  studentId: z.number().int().positive(),
  courseId: z.number().int().positive(),
  enrolledAt: z.string().datetime().optional(),
  grade: z.string().max(10).nullable().optional(),
});

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if ("response" in auth) return auth.response;
  const forbid = await requireAdminDb(auth.user);
  if (forbid) return forbid;

  const rows = await prisma.enrollment.findMany({
    orderBy: { enrolledAt: "desc" },
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

  const body = rows.map((r) => ({
    id: r.id,
    enrolledAt: r.enrolledAt.toISOString(),
    grade: r.grade,
    studentId: r.studentId,
    courseId: r.courseId,
    studentName: r.student.fullName,
    courseTitle: r.course.title,
  }));

  return NextResponse.json(body);
}

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if ("response" in auth) return auth.response;
  const forbid = await requireAdminDb(auth.user);
  if (forbid) return forbid;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const { studentId, courseId, enrolledAt: enAt, grade } = parsed.data;
  const enrolledAtDate = enAt ? new Date(enAt) : new Date();

  const [studentOK, courseOK] = await Promise.all([
    prisma.student.findUnique({ where: { id: studentId } }),
    prisma.course.findUnique({ where: { id: courseId } }),
  ]);
  if (!studentOK) return NextResponse.json({ error: "Student not found" }, { status: 400 });
  if (!courseOK) return NextResponse.json({ error: "Course not found" }, { status: 400 });

  const dupEnrollment = await prisma.enrollment.findFirst({
    where: { studentId, courseId },
  });
  if (dupEnrollment) {
    return NextResponse.json(
      { error: "Enrollment already exists for this student and course" },
      { status: 409 },
    );
  }

  const created = await prisma.enrollment.create({
    data: {
      studentId,
      courseId,
      enrolledAt: enrolledAtDate,
      grade: grade ?? null,
    },
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

  return NextResponse.json(
    {
      id: created.id,
      enrolledAt: created.enrolledAt.toISOString(),
      grade: created.grade,
      studentId: created.studentId,
      courseId: created.courseId,
      studentName: created.student.fullName,
      courseTitle: created.course.title,
    },
    { status: 201, headers: { Location: `/api/enrollments/${created.id}` } },
  );
}