import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireInstructorScoped } from "@/lib/api-helpers";

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if ("response" in auth) return auth.response;
  const scoped = await requireInstructorScoped(auth.user);
  if (scoped instanceof NextResponse) return scoped;

  const courseIds = await prisma.course.findMany({
    where: { instructorId: scoped.instructorId },
    select: { id: true },
  });
  const ids = courseIds.map((c) => c.id);
  if (ids.length === 0) return NextResponse.json([]);

  const rows = await prisma.enrollment.findMany({
    where: { courseId: { in: ids } },
    orderBy: [{ courseId: "asc" }, { enrolledAt: "desc" }],
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

  const prio = (s: string) => (s === "pending" ? 0 : s === "approved" ? 1 : 2);

  const mapped = rows.map((r) => ({
    id: r.id,
    enrolledAt: r.enrolledAt.toISOString(),
    status: r.status,
    grade: r.grade,
    studentId: r.studentId,
    courseId: r.courseId,
    studentName: r.student.fullName,
    courseTitle: r.course.title,
  }));
  mapped.sort((a, b) => prio(a.status) - prio(b.status) || b.enrolledAt.localeCompare(a.enrolledAt));

  return NextResponse.json(mapped);
}
