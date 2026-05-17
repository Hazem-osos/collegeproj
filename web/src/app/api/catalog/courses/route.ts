import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireStudentScoped } from "@/lib/api-helpers";

/** Read-only course list for students, with per-row enrollment status when present. */
export async function GET() {
  const auth = await requireAuth(request);
  if ("response" in auth) return auth.response;
  const st = await requireStudentScoped(auth.user);
  if (st instanceof NextResponse) return st;

  const studentId = st.studentId;

  const courses = await prisma.course.findMany({
    orderBy: { title: "asc" },
    select: {
      id: true,
      title: true,
      credits: true,
      instructor: { select: { fullName: true } },
    },
  });

  const mine = await prisma.enrollment.findMany({
    where: { studentId },
    select: { courseId: true, id: true, status: true },
  });
  const byCourse = new Map(mine.map((e) => [e.courseId, { enrollmentId: e.id, status: e.status }]));

  const body = courses.map((c) => {
    const link = byCourse.get(c.id);
    return {
      id: c.id,
      title: c.title,
      credits: c.credits,
      instructorName: c.instructor.fullName,
      enrollmentId: link?.enrollmentId ?? null,
      enrollmentStatus: link?.status ?? null,
    };
  });

  return NextResponse.json(body);
}
