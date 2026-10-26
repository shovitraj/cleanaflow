import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Customer routes guard
    if (path.startsWith("/dashboard")) {
      if (token?.role !== "CUSTOMER" && token?.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/pro/jobs", req.url));
      }
    }

    // Cleaner routes guard
    if (path.startsWith("/pro")) {
      if (token?.role !== "CLEANER" && token?.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    secret: process.env.NEXTAUTH_SECRET || "cleanaglow-default-secret-key-32-chars-long",
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        if (
          path.startsWith("/dashboard") ||
          path.startsWith("/pro") ||
          path.startsWith("/api/admin")
        ) {
          return !!token;
        }
        return true;
      }
    }
  }
);

export const config = {
  matcher: ["/dashboard/:path*", "/pro/:path*", "/api/admin/:path*"]
};
