import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { SESSION_COOKIE_NAME } from "./session-cookie";

const getSecret = () => {
  const key = process.env.JWT_KEY;
  if (!key) throw new Error("JWT_KEY is not set");
  return new TextEncoder().encode(key);
};

export type AuthPayload = {
  email: string;
  role: string;
  /** Present for logged-in roster students (registration links Users → Students). */
  studentId?: number;
};

/** Claims written into the JWT (subset serializable). */
export type JwtSignPayload = AuthPayload;

export async function signToken(payload: JwtSignPayload): Promise<string> {
  const body: Record<string, unknown> = {
    email: payload.email,
    role: payload.role,
  };
  if (payload.studentId != null) body.studentId = payload.studentId;
  return new SignJWT(body)
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
  const p = payload as JWTPayload & { email?: string; role?: string; studentId?: number };
  if (!p.email || !p.role) throw new Error("Invalid token");
  const out: AuthPayload = { email: p.email, role: p.role };
  if (typeof p.studentId === "number" && Number.isInteger(p.studentId)) {
    out.studentId = p.studentId;
  }
  return out;
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
