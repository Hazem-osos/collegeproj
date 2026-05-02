import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-helpers";

type Ctx = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  credits: z.number().int().min(1).max(10).optional(),
  instructorId: z.number().int().positive().optional(),
});

export async function GET(_request: Request, context: Ctx) {
  const auth = await requireAuth(_request);
  if ("response" in auth) return auth.response;

  const id = Number((await context.params).id);
  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const c = await prisma.course.findFirst({
    where: { id },
    select: {
      id: true,
      title: true,
      credits: true,
      instructor: { select: { fullName: true } },
    },
  });

  if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    id: c.id,
    title: c.title,
    credits: c.credits,
    instructorName: c.instructor.fullName,
  });
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

  const existing = await prisma.course.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (parsed.data.instructorId !== undefined) {
    const instructor = await prisma.instructor.findUnique({
      where: { id: parsed.data.instructorId },
    });
    if (!instructor) {
      return NextResponse.json({ error: "Instructor not found" }, { status: 400 });
    }
  }

  const updated = await prisma.course.update({
    where: { id },
    data: parsed.data,
    select: {
      id: true,
      title: true,
      credits: true,
      instructor: { select: { fullName: true } },
    },
  });

  return NextResponse.json({
    id: updated.id,
    title: updated.title,
    credits: updated.credits,
    instructorName: updated.instructor.fullName,
  });
}

export async function DELETE(request: Request, context: Ctx) {
  const auth = await requireAuth(request);
  if ("response" in auth) return auth.response;

  const id = Number((await context.params).id);
  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const existing = await prisma.course.findUnique({ where: { id } });
  if (!existing) return new NextResponse(null, { status: 404 });

  await prisma.course.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
