import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyToken } from "@/lib/auth-jwt";
import { setSessionCookie } from "@/lib/session-cookie";

const bodySchema = z.object({ token: z.string().min(1) });

/**
 * After logging in against the ASP.NET API, the browser holds a JWT in memory.
 * This route copies that JWT into the HTTP-only `cm_session` cookie so Next.js
 * middleware can protect page routes with the same secret as the .NET backend.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  try {
    await verifyToken(parsed.data.token);
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  setSessionCookie(res, parsed.data.token);
  return res;
}
