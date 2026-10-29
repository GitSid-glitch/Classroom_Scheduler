import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  authSessionCookieName,
  canAccessPath,
  readIdentityFromSessionValue,
} from "@/lib/auth/access";

const PUBLIC_PATHS = ["/", "/login"];

export async function proxy(request: NextRequest) {
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
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (role && pathname === "/login") {
    return NextResponse.redirect(
      new URL(
        role === "ADMIN" || role === "COORDINATOR" ? "/dashboard" : "/published-timetable",
        request.url,
      ),
    );
  }

  if (role && !isPublicPath && !canAccessPath(role, pathname)) {
    return NextResponse.redirect(new URL("/published-timetable", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api).*)"],
};
