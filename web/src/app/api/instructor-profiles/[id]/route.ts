import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-helpers";

type Ctx = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  bio: z.string().min(1).max(1000).optional(),
  officeLocation: z.string().min(1).max(255).optional(),
});

async function profileJson(profileId: number) {
  const row = await prisma.instructorProfile.findFirst({
    where: { id: profileId },
    select: {
      id: true,
      instructorId: true,
      bio: true,
      officeLocation: true,
      instructor: { select: { fullName: true, email: true } },
    },
  });
  if (!row) return null;
  return {
    id: row.id,
    instructorId: row.instructorId,
    bio: row.bio,
    officeLocation: row.officeLocation,
    instructorName: row.instructor.fullName,
    instructorEmail: row.instructor.email,
  };
}

export async function GET(request: Request, context: Ctx) {
  const auth = await requireAuth(request);
  if ("response" in auth) return auth.response;

  const id = Number((await context.params).id);
  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const body = await profileJson(id);
  if (!body) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(body);
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

  const existing = await prisma.instructorProfile.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.instructorProfile.update({
    where: { id },
    data: parsed.data,
  });

  const body = await profileJson(id);
  return NextResponse.json(body);
}

export async function DELETE(request: Request, context: Ctx) {
  const auth = await requireAuth(request);
  if ("response" in auth) return auth.response;

  const id = Number((await context.params).id);
  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const existing = await prisma.instructorProfile.findUnique({ where: { id } });
  if (!existing) return new NextResponse(null, { status: 404 });

  await prisma.instructorProfile.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
