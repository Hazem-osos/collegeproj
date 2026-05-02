import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-helpers";

const createSchema = z.object({
  title: z.string().min(1).max(100),
  credits: z.number().int().min(1).max(10),
  instructorId: z.number().int().positive(),
});

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if ("response" in auth) return auth.response;

  const courses = await prisma.course.findMany({
    select: {
      id: true,
      title: true,
      credits: true,
      instructor: { select: { fullName: true } },
    },
  });

  const body = courses.map((c) => ({
    id: c.id,
    title: c.title,
    credits: c.credits,
    instructorName: c.instructor.fullName,
  }));

  return NextResponse.json(body);
}

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if ("response" in auth) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const { title, credits, instructorId } = parsed.data;
  const instructor = await prisma.instructor.findUnique({ where: { id: instructorId } });
  if (!instructor) {
    return NextResponse.json({ error: "Instructor not found" }, { status: 400 });
  }

  const created = await prisma.course.create({
    data: { title, credits, instructorId },
    select: {
      id: true,
      title: true,
      credits: true,
      instructor: { select: { fullName: true } },
    },
  });

  return NextResponse.json(
    {
      id: created.id,
      title: created.title,
      credits: created.credits,
      instructorName: created.instructor.fullName,
    },
    { status: 201, headers: { Location: `/api/courses/${created.id}` } },
  );
}
