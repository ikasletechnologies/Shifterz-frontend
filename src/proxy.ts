import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const token = request.cookies.get("token")?.value;

  let userRole = null;
  let userPermissions: string[] = [];
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
      userPermissions = payload.permissions || [];
    } catch (e) {
      console.error("Token decode error in middleware:", e);
    }
  }

  // If trying to access protected routes without token, redirect to login
  const isProtectedRoute = pathname.startsWith("/dashboard") || pathname.startsWith("/technician");
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const isTech = userRole?.toUpperCase() === "TECHNICIAN";

  // If trying to access login with token, redirect to appropriate portal
  if (pathname === "/login" && token) {
    if (isTech) {
      return NextResponse.redirect(new URL("/technician", request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Prevent technicians from accessing admin dashboard
  if (pathname.startsWith("/dashboard") && isTech) {
    return NextResponse.redirect(new URL("/technician", request.url));
  }

  // Enforce module-level permission guards
  if (pathname.startsWith("/dashboard/") && userRole) {
    const parts = pathname.split("/");
    const urlModule = parts[2];

    // URL slugs that don't map 1:1 onto a permission key — they piggyback on
    // an existing module's permission (matches how their Sidebar nav items
    // are tagged, e.g. Workshop/QC use module: "jobs").
    const moduleAliasMap: Record<string, string> = {
      workshop: "jobs",
      qc: "jobs",
      "vehicle-inspection": "carin",
    };
    const moduleName = moduleAliasMap[urlModule] || urlModule;

    const protectedModules = [
      "carin", "jobs", "outpass", "leads", "customers",
      "billing", "payments", "inventory", "reports",
      "employees", "attendance", "settings", "roles"
    ];

    if (protectedModules.includes(moduleName)) {
      const isSuperAdmin = userRole.startsWith("SUPER_ADMIN");
      const isServiceAdvisor = userRole.includes("SERVICE_ADVISOR");
      const isReceptionist = userRole.includes("RECEPTION");

      if (!isSuperAdmin) {
        if ((moduleName === "outpass" || moduleName === "attendance") && (isServiceAdvisor || isReceptionist)) {
          return NextResponse.next();
        }

        if (userPermissions.length > 0 && !userPermissions.includes(moduleName)) {
          return NextResponse.redirect(new URL("/dashboard", request.url));
        }
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/technician/:path*", "/login"],
};
