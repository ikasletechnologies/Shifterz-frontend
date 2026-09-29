import { NextRequest, NextResponse } from "next/server";

function normalizeRole(role?: string | null): string {
  if (!role) return "";
  const base = role.split("|")[0].trim().toUpperCase();
  const aliasMap: Record<string, string> = {
    RECEPTIONIST: "RECEPTION_EXECUTIVE",
    QC: "QUALITY_INSPECTOR",
    QC_INSPECTOR: "QUALITY_INSPECTOR",
    QUALITY_ASSURANCE: "QUALITY_INSPECTOR",
    BILLING: "BILLING_EXECUTIVE",
    INVENTORY: "INVENTORY_EXECUTIVE",
  };
  return aliasMap[base] || base;
}

function resolveModuleForPath(pathname: string): string | null {
  const path = pathname.replace(/\/+$/, "") || "/";

  // Non-gated / general routes
  if (
    path === "/login" ||
    path === "/access-denied" ||
    path === "/dashboard/profile" ||
    path === "/technician/profile"
  ) {
    return null;
  }

  // Exact roots
  if (path === "/dashboard" || path === "/technician") {
    return "dashboard";
  }

  if (path.startsWith("/technician/my-jobs")) return "jobs";
  if (path.startsWith("/technician/attendance")) return "attendance";

  const sub = path.replace(/^\/dashboard\/?/, "");
  const firstSegment = sub.split("/")[0];

  const directMap: Record<string, string> = {
    carin: "carin",
    "vehicle-inspection": "carin",
    jobs: "jobs",
    workshop: "jobs",
    qc: "jobs",
    "live-status": "jobs",
    outpass: "outpass",
    leads: "leads",
    customers: "customers",
    billing: "billing",
    warranties: "billing",
    payments: "payments",
    inventory: "inventory",
    reports: "reports",
    employees: "employees",
    technicians: "employees",
    "service-advisors": "employees",
    "billing-staff": "employees",
    receptionists: "employees",
    "inventory-staff": "employees",
    attendance: "attendance",
    settings: "settings",
    masters: "settings",
    services: "settings",
    roles: "roles",
  };

  if (directMap[firstSegment]) {
    return directMap[firstSegment];
  }

  if (firstSegment === "franchise-control") {
    const secondSegment = sub.split("/")[1] || "";
    if (secondSegment === "users" || secondSegment === "employee-approval") return "employees";
    if (
      secondSegment === "purchases" ||
      secondSegment === "inventory-approval" ||
      secondSegment === "inventory-requests" ||
      secondSegment === "stock-allocation"
    ) {
      return "inventory";
    }
    return "settings";
  }

  return null;
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const token = request.cookies.get("token")?.value;

  let userRole: string | null = null;
  let userPermissions: string[] = [];

  if (token) {
    try {
      // Decode JWT payload (Edge runtime safe)
      const payloadBase64 = token.split(".")[1];
      let base64 = payloadBase64.replace(/-/g, "+").replace(/_/g, "/");
      while (base64.length % 4) {
        base64 += "=";
      }
      const decodedJson = atob(base64);
      const payload = JSON.parse(decodedJson);
      userRole = payload.role || null;
      userPermissions = Array.isArray(payload.permissions) ? payload.permissions : [];
    } catch (e) {
      console.error("Token decode error in proxy:", e);
    }
  }

  // 1. Unauthenticated route protection
  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/technician") ||
    pathname === "/access-denied";

  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const canonicalRole = normalizeRole(userRole);
  const isSuperAdmin = canonicalRole === "SUPER_ADMIN";
  const isTech = canonicalRole === "TECHNICIAN";

  // 2. Already logged in -> redirect from login to appropriate dashboard
  if (pathname === "/login" && token) {
    if (isTech) {
      return NextResponse.redirect(new URL("/technician", request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 3. Technicians default root is /technician
  if (pathname === "/dashboard" && isTech) {
    return NextResponse.redirect(new URL("/technician", request.url));
  }

  // 4. Module-level route protection
  if ((pathname.startsWith("/dashboard") || pathname.startsWith("/technician")) && userRole) {
    const requiredModule = resolveModuleForPath(pathname);

    if (requiredModule) {
      // Super Admin retains full, unconditional system access
      if (isSuperAdmin) {
        return NextResponse.next();
      }

      // Roles & Permissions management is strictly Super Admin
      if (requiredModule === "roles" && !isSuperAdmin) {
        return NextResponse.redirect(new URL("/access-denied", request.url));
      }

      // Check if user's role has permission for this module
      if (!userPermissions.includes(requiredModule)) {
        return NextResponse.redirect(new URL("/access-denied", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/technician/:path*", "/login", "/access-denied"],
};
