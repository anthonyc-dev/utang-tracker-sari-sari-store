// middleware.ts
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Only protect API routes
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    // Allow auth-related endpoints
    if (request.nextUrl.pathname.startsWith("/api/auth")) {
      return NextResponse.next();
    }

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
