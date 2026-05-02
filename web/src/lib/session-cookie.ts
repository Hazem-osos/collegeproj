import type { NextResponse } from "next/server";

/** HTTP-only session cookie storing the signed JWT (same claims as Bearer flow). */
export const SESSION_COOKIE_NAME = "cm_session";

const ONE_HOUR_SEC = 60 * 60;

export function cookieOptions() {
  return {
    httpOnly: true as const,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: ONE_HOUR_SEC,
  };
}

export function setSessionCookie(res: NextResponse, token: string) {
  res.cookies.set(SESSION_COOKIE_NAME, token, cookieOptions());
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  });
}
