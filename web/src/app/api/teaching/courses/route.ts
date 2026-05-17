import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enrollmentCountsByCourse } from "@/lib/enrollment-queries";
import { requireAuth, requireInstructorScoped } from "@/lib/api-helpers";

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if ("response" in auth) return auth.response;
  const scoped = await requireInstructorScoped(auth.user);
  if (scoped instanceof NextResponse) return scoped;

  const { instructorId } = scoped;
  const rows = await prisma.course.findMany({
    where: { instructorId },
    orderBy: { title: "asc" },
    select: {
      id: true,
      title: true,
      credits: true,
    },
  });

  const ids = rows.map((r) => r.id);
  const counts = await enrollmentCountsByCourse(ids);

  const body = rows.map((r) => {
    const c = counts.get(r.id) ?? { approved: 0, pending: 0, rejected: 0 };
    return {
      id: r.id,
      title: r.title,
      credits: r.credits,
      enrollmentCount: c.approved,
      pendingEnrollmentCount: c.pending,
      rejectedEnrollmentCount: c.rejected,
    };
  });
  return NextResponse.json(body);
}
