import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireStudentScoped } from "@/lib/api-helpers";

const patchSchema = z.object({
  fullName: z.string().min(1).max(100),
});

export async function PATCH(request: Request) {
  const auth = await requireAuth(request);
  if ("response" in auth) return auth.response;
  const st = await requireStudentScoped(auth.user);
  if (st instanceof NextResponse) return st;

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

  const sid = st.studentId;
  const updated = await prisma.student.update({
    where: { id: sid },
    data: { fullName: parsed.data.fullName.trim() },
    select: { fullName: true, email: true },
  });

  return NextResponse.json(updated);
}
