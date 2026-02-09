import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  console.log("Middleware triggered for:", req.nextUrl.pathname);
  const session = req.cookies.get("better-auth.session")?.value;
  const pathname = req.nextUrl.pathname;

  const protectedRoutes = ["/dashboard", "/users", "/settings"];
  const authRoutes = ["/sign-in", "/sign-up"];

  // 1. Block unauthenticated users from protected routes
  if (!session && protectedRoutes.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  // 2. Block authenticated users from auth pages
  if (session && authRoutes.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/users/:path*",
    "/settings/:path*",
    "/sign-in",
    "/sign-up",
  ],
};
