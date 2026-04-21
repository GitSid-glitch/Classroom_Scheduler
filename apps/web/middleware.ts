import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  authSessionCookieName,
  canAccessPath,
  readIdentityFromSessionValue,
} from "@/lib/auth/access";

const PUBLIC_PATHS = ["/", "/login"];

export function middleware(request: NextRequest) {
  return handleRequest(request);
}

async function handleRequest(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const isPublicPath = PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const sessionValue = request.cookies.get(authSessionCookieName)?.value;
  const identity = await readIdentityFromSessionValue(sessionValue);
  const role = identity?.role;

  if (!role && !isPublicPath) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (role && pathname === "/login") {
    const nextUrl = new URL(
      role === "ADMIN" || role === "COORDINATOR" ? "/dashboard" : "/published-timetable",
      request.url,
    );
    return NextResponse.redirect(nextUrl);
  }

  if (role && !isPublicPath && !canAccessPath(role, pathname)) {
    const deniedUrl = new URL("/published-timetable", request.url);
    return NextResponse.redirect(deniedUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api).*)"],
};
