import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdminDb, requireAuth } from "@/lib/api-helpers";

type Ctx = { params: Promise<{ id: string }> };

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: Request, context: Ctx) {
  const auth = await requireAuth(request);
  if ("response" in auth) return auth.response;
  const forbid = await requireAdminDb(auth.user);
  if (forbid) return forbid;

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

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed (email, password ≥ 8)" }, { status: 400 });
  }

  const instructor = await prisma.instructor.findUnique({
    where: { id },
    include: { user: { select: { id: true } } },
  });
  if (!instructor) return NextResponse.json({ error: "Instructor not found" }, { status: 404 });
  if (instructor.user != null) {
    return NextResponse.json(
      { error: "This instructor already has a login account" },
      { status: 409 },
    );
  }

  const normalized = parsed.data.email.toLowerCase();

  const emailTaken = await prisma.user.findUnique({ where: { email: normalized } });
  if (emailTaken) {
    return NextResponse.json({ error: "Email already in use by another login" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  await prisma.user.create({
    data: {
      email: normalized,
      passwordHash,
      role: "Instructor",
      instructorId: id,
      studentId: null,
    },
  });

  return NextResponse.json(
    { ok: true, email: normalized, instructorId: id },
    { status: 201 },
  );
}
