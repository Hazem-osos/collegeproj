import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminDb, requireAuth } from "@/lib/api-helpers";

const createSchema = z.object({
  fullName: z.string().min(1).max(100),
  email: z.string().email(),
});

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if ("response" in auth) return auth.response;
  const forbid = await requireAdminDb(auth.user);
  if (forbid) return forbid;

  const rows = await prisma.student.findMany({
    select: { id: true, fullName: true, email: true },
  });
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if ("response" in auth) return auth.response;
  const forbid = await requireAdminDb(auth.user);
  if (forbid) return forbid;

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

  const created = await prisma.student.create({
    data: { fullName: parsed.data.fullName, email: parsed.data.email },
    select: { id: true, fullName: true, email: true },
  });

  return NextResponse.json(created, {
    status: 201,
    headers: { Location: `/api/students/${created.id}` },
  });
}
