import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-helpers";

const createSchema = z.object({
  instructorId: z.number().int().positive(),
  bio: z.string().min(1).max(1000),
  officeLocation: z.string().min(1).max(255),
});

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if ("response" in auth) return auth.response;

  const rows = await prisma.instructorProfile.findMany({
    orderBy: { id: "asc" },
    select: {
      id: true,
      instructorId: true,
      bio: true,
      officeLocation: true,
      instructor: { select: { fullName: true, email: true } },
    },
  });

  return NextResponse.json(
    rows.map((r) => ({
      id: r.id,
      instructorId: r.instructorId,
      bio: r.bio,
      officeLocation: r.officeLocation,
      instructorName: r.instructor.fullName,
      instructorEmail: r.instructor.email,
    })),
  );
}

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if ("response" in auth) return auth.response;

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

  const { instructorId, bio, officeLocation } = parsed.data;
  const instructor = await prisma.instructor.findUnique({ where: { id: instructorId } });
  if (!instructor) return NextResponse.json({ error: "Instructor not found" }, { status: 400 });

  const dup = await prisma.instructorProfile.findUnique({ where: { instructorId } });
  if (dup) {
    return NextResponse.json(
      { error: "Profile already exists for this instructor — use PATCH" },
      { status: 409 },
    );
  }

  const created = await prisma.instructorProfile.create({
    data: { instructorId, bio, officeLocation },
    select: {
      id: true,
      instructorId: true,
      bio: true,
      officeLocation: true,
      instructor: { select: { fullName: true, email: true } },
    },
  });

  return NextResponse.json(
    {
      id: created.id,
      instructorId: created.instructorId,
      bio: created.bio,
      officeLocation: created.officeLocation,
      instructorName: created.instructor.fullName,
      instructorEmail: created.instructor.email,
    },
    { status: 201, headers: { Location: `/api/instructor-profiles/${created.id}` } },
  );
}
