import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-helpers";

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if ("response" in auth) return auth.response;

  const row = await prisma.user.findUnique({
    where: { email: auth.user.email.toLowerCase() },
    select: {
      email: true,
      role: true,
      studentId: true,
      student: { select: { fullName: true } },
    },
  });

  if (!row) {
    return NextResponse.json({
      user: {
        email: auth.user.email,
        role: auth.user.role,
        studentId: auth.user.studentId ?? null,
        fullName: null as string | null,
      },
    });
  }

  return NextResponse.json({
    user: {
      email: row.email,
      role: row.role,
      studentId: row.studentId,
      fullName: row.student?.fullName ?? null,
    },
  });
}
