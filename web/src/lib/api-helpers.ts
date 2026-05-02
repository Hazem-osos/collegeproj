import { NextResponse } from "next/server";
import { extractAuthToken, verifyToken, type AuthPayload } from "./auth-jwt";

export type AuthResult = { user: AuthPayload } | { response: NextResponse };

export async function requireAuth(request: Request): Promise<AuthResult> {
  const t = extractAuthToken(request);
  if (!t) {
    return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  try {
    const user = await verifyToken(t);
    return { user };
  } catch {
    return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
}

export function asJsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}
