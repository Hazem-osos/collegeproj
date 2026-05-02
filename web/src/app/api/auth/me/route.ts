import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-helpers";

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if ("response" in auth) return auth.response;
  return NextResponse.json({
    user: { email: auth.user.email, role: auth.user.role },
  });
}
