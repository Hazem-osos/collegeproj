import { prisma } from "@/lib/prisma";

export type EnrollmentCountBreakdown = { approved: number; pending: number; rejected: number };

/** Aggregates enrollment rows by course and status (for instructor dashboards). */
export async function enrollmentCountsByCourse(
  courseIds: number[],
): Promise<Map<number, EnrollmentCountBreakdown>> {
  const m = new Map<number, EnrollmentCountBreakdown>();
  for (const id of courseIds) {
    m.set(id, { approved: 0, pending: 0, rejected: 0 });
  }
  if (courseIds.length === 0) return m;

  const rows = await prisma.enrollment.groupBy({
    by: ["courseId", "status"],
    where: { courseId: { in: courseIds } },
    _count: { _all: true },
  });

  for (const r of rows) {
    const cur = m.get(r.courseId);
    if (!cur) continue;
    const n = r._count._all;
    if (r.status === "approved") cur.approved += n;
    else if (r.status === "pending") cur.pending += n;
    else if (r.status === "rejected") cur.rejected += n;
  }
  return m;
}
