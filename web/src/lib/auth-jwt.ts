import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { SESSION_COOKIE_NAME } from "./session-cookie";

const getSecret = () => {
  const key = process.env.JWT_KEY;
  if (!key) throw new Error("JWT_KEY is not set");
  return new TextEncoder().encode(key);
};

export type AuthPayload = { email: string; role: string };

export async function signToken(payload: AuthPayload): Promise<string> {
  return new SignJWT({ email: payload.email, role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .setIssuer(process.env.JWT_ISSUER ?? "CourseManagementAPI")
    .setAudience(process.env.JWT_AUDIENCE ?? "CourseManagementClient")
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<AuthPayload> {
  const { payload } = await jwtVerify(token, getSecret(), {
    issuer: process.env.JWT_ISSUER,
    audience: process.env.JWT_AUDIENCE,
  });
  const p = payload as JWTPayload & { email?: string; role?: string };
  if (!p.email || !p.role) throw new Error("Invalid token");
  return { email: p.email, role: p.role };
}

export function getBearerToken(request: Request): string | null {
  const h = request.headers.get("authorization");
  if (!h?.toLowerCase().startsWith("bearer ")) return null;
  return h.slice(7).trim();
}

/** Prefer Authorization Bearer, then HTTP-only session cookie (for Axios + withCredentials). */
export function extractAuthToken(request: Request): string | null {
  const bearer = getBearerToken(request);
  if (bearer) return bearer;
  const raw = request.headers.get("cookie");
  if (!raw) return null;
  const prefix = `${SESSION_COOKIE_NAME}=`;
  for (const part of raw.split(";")) {
    const p = part.trim();
    if (p.startsWith(prefix)) {
      return decodeURIComponent(p.slice(prefix.length));
    }
  }
  return null;
}
