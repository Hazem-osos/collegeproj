import { NextResponse, type NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth-jwt";
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
        await verifyToken(tokenEarly);
        return NextResponse.redirect(new URL("/", request.url));
      } catch {
        /* stale cookie → allow login */
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

  try {
    await verifyToken(token);
    return NextResponse.next();
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
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
