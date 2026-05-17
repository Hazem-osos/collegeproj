import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { enrollmentCountsByCourse } from "@/lib/enrollment-queries";
import { requireAuth, requireInstructorScoped } from "@/lib/api-helpers";

type Ctx = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  credits: z.number().int().min(1).max(10).optional(),
});

export async function GET(_request: Request, context: Ctx) {
  const auth = await requireAuth(_request);
  if ("response" in auth) return auth.response;
  const scoped = await requireInstructorScoped(auth.user);
  if (scoped instanceof NextResponse) return scoped;

  const id = Number((await context.params).id);
  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const row = await prisma.course.findFirst({
    where: { id, instructorId: scoped.instructorId },
    select: {
      id: true,
      title: true,
      credits: true,
    },
  });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const counts = await enrollmentCountsByCourse([row.id]);
  const c = counts.get(row.id) ?? { approved: 0, pending: 0, rejected: 0 };

  return NextResponse.json({
    id: row.id,
    title: row.title,
    credits: row.credits,
    enrollmentCount: c.approved,
    pendingEnrollmentCount: c.pending,
    rejectedEnrollmentCount: c.rejected,
  });
}

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

  if (parsed.data.title === undefined && parsed.data.credits === undefined) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const existing = await prisma.course.findFirst({
    where: { id, instructorId: scoped.instructorId },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.course.update({
    where: { id },
    data: {
      ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
      ...(parsed.data.credits !== undefined ? { credits: parsed.data.credits } : {}),
    },
    select: {
      id: true,
      title: true,
      credits: true,
    },
  });

  const counts = await enrollmentCountsByCourse([updated.id]);
  const c = counts.get(updated.id) ?? { approved: 0, pending: 0, rejected: 0 };

  return NextResponse.json({
    id: updated.id,
    title: updated.title,
    credits: updated.credits,
    enrollmentCount: c.approved,
    pendingEnrollmentCount: c.pending,
    rejectedEnrollmentCount: c.rejected,
  });
}
