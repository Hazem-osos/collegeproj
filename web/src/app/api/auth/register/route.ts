import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth-jwt";
import { setSessionCookie } from "@/lib/session-cookie";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(1).max(100),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed (email, password ≥ 8 chars, full name)" },
      { status: 400 },
    );
  }

  const { email, password, fullName } = parsed.data;
  const normalized = email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: normalized } });
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const student = await prisma.$transaction(async (tx) => {
    const createdStudent = await tx.student.create({
      data: { fullName: fullName.trim(), email: normalized },
    });
    await tx.user.create({
      data: {
        email: normalized,
        passwordHash,
        role: "Student",
        studentId: createdStudent.id,
      },
    });
    return createdStudent;
  });

  const jwt = await signToken({
    email: normalized,
    role: "Student",
    studentId: student.id,
  });
  const res = NextResponse.json(
    {
      user: {
        email: normalized,
        role: "Student",
        studentId: student.id,
        fullName: student.fullName,
      },
    },
    { status: 201 },
  );
  setSessionCookie(res, jwt);
  return res;
}
