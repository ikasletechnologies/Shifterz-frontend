import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const token = request.cookies.get("token")?.value;

  let userRole = null;
  if (token) {
    try {
      // Decode JWT payload (Edge runtime safe)
      const payloadBase64 = token.split('.')[1];
      // Replace safe base64 chars
      let base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4) {
        base64 += '=';
      }
      const decodedJson = atob(base64);
      const payload = JSON.parse(decodedJson);
      userRole = payload.role;
    } catch (e) {
      console.error("Token decode error in middleware:", e);
    }
  }

  // If trying to access protected routes without token, redirect to login
  const isProtectedRoute = pathname.startsWith("/dashboard") || pathname.startsWith("/technician");
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If trying to access login with token, redirect to appropriate portal
  if (pathname === "/login" && token) {
    if (userRole === "TECHNICIAN" || userRole === "technician") {
      return NextResponse.redirect(new URL("/technician", request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Prevent technicians from accessing admin dashboard
  if (pathname.startsWith("/dashboard") && (userRole === "TECHNICIAN" || userRole === "technician")) {
    return NextResponse.redirect(new URL("/technician", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/technician/:path*", "/login"],
};
