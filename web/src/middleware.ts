import { NextResponse, type NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth-jwt";
import {
  isAdminOnlyPagePath,
  postLoginRedirectPath,
  studentDefaultPath,
} from "@/lib/auth-redirects";
import { SESSION_COOKIE_NAME } from "@/lib/session-cookie";

function isPublicAuthPath(pathname: string) {
  return (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/login/") ||
    pathname.startsWith("/register/")
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isPublicAuthPath(pathname)) {
    const tokenEarly = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (
      tokenEarly &&
      (pathname === "/login" || pathname.startsWith("/login/") || pathname === "/register")
    ) {
      try {
        const payload = await verifyToken(tokenEarly);
        const dst = postLoginRedirectPath(
          payload.role,
          pathname === "/login" || pathname.startsWith("/login/")
            ? request.nextUrl.searchParams.get("next")
            : null,
        );
        return NextResponse.redirect(new URL(dst, request.url));
      } catch {
        /* stale cookie */
      }
    }
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  let payload;
  try {
    payload = await verifyToken(token);
  } catch {
    const res = NextResponse.redirect(new URL("/login", request.url));
    res.cookies.set(SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 0,
    });
    return res;
  }

  if (payload.role === "Student" && isAdminOnlyPagePath(pathname)) {
    return NextResponse.redirect(new URL(studentDefaultPath(), request.url));
  }

  if (payload.role === "Admin") {
    if (pathname === "/my-courses" || pathname.startsWith("/my-courses/")) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
