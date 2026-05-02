import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireStudentScoped } from "@/lib/api-helpers";

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
    grade: r.grade,
    enrolledAt: r.enrolledAt.toISOString(),
  }));

  return NextResponse.json(body);
}
