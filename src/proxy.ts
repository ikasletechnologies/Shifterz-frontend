import { NextRequest, NextResponse } from "next/server";

export const PERMISSION_MODULES = [
  "dashboard",
  "carin",
  "jobs",
  "vehicle-inspection",
  "qc",
  "outpass",
  "leads",
  "customers",
  "billing",
  "payments",
  "inventory",
  "reports",
  "employees",
  "attendance",
  "settings",
  "roles",
] as const;

export const DEFAULT_ROLE_MATRIX: Record<string, string[]> = {
  SUPER_ADMIN: [
    "dashboard", "carin", "jobs", "vehicle-inspection", "qc", "outpass", "leads", "customers",
    "billing", "payments", "inventory", "reports", "employees",
    "attendance", "settings", "roles"
  ],
  HQ_USER: [
    "dashboard", "carin", "jobs", "vehicle-inspection", "qc", "outpass", "leads", "customers",
    "billing", "payments", "inventory", "reports", "employees",
    "attendance", "settings"
  ],
  FRANCHISE_ADMIN: [
    "dashboard", "carin", "jobs", "vehicle-inspection", "qc", "outpass", "leads", "customers",
    "billing", "payments", "inventory", "reports", "employees",
    "attendance"
  ],
  BRANCH_MANAGER: [
    "dashboard", "carin", "jobs", "vehicle-inspection", "qc", "outpass", "leads", "customers",
    "billing", "payments", "inventory", "reports", "attendance"
  ],
  RECEPTION_EXECUTIVE: [
    "dashboard", "carin", "outpass", "customers", "leads", "attendance"
  ],
  SERVICE_ADVISOR: [
    "dashboard", "carin", "jobs", "attendance"
  ],
  TECHNICIAN: [
    "dashboard", "jobs", "attendance"
  ],
  QUALITY_INSPECTOR: [
    "dashboard", "vehicle-inspection", "qc", "attendance"
  ],
  BILLING_EXECUTIVE: [
    "dashboard", "billing", "payments", "reports", "attendance"
  ],
  INVENTORY_EXECUTIVE: [
    "dashboard", "inventory", "reports", "attendance"
  ],
};

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

export function canonicalizePermission(perm?: string | null): string {
  if (!perm) return "";
  const normalized = perm.trim().toLowerCase();
  if (normalized === "vehicle_inspection" || normalized === "vehicleinspection" || normalized === "vehicle-inspection") {
    return "vehicle-inspection";
  }
  if (normalized === "quality_control" || normalized === "quality-control" || normalized === "qc") {
    return "qc";
  }
  if (normalized === "car_in" || normalized === "car-in" || normalized === "carin") {
    return "carin";
  }
  if (normalized === "job_cards" || normalized === "job-cards" || normalized === "jobs") {
    return "jobs";
  }
  if (normalized === "out_pass" || normalized === "out-pass" || normalized === "outpass") {
    return "outpass";
  }
  return normalized;
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
  if (path.startsWith("/vehicle-inspection") || path.startsWith("/dashboard/vehicle-inspection")) return "vehicle-inspection";
  if (path.startsWith("/qc") || path.startsWith("/dashboard/qc")) return "qc";

  const sub = path.replace(/^\/dashboard\/?/, "");
  const firstSegment = sub.split("/")[0];

  const directMap: Record<string, string> = {
    carin: "carin",
    "vehicle-inspection": "vehicle-inspection",
    jobs: "jobs",
    workshop: "jobs",
    qc: "qc",
    "live-status": "jobs",
    outpass: "outpass",
    leads: "leads",
    customers: "customers",
    billing: "billing",
    warranties: "billing",
    payments: "payments",
    inventory: "inventory",
    purchases: "inventory",
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
  const permsCookie = request.cookies.get("shifterz_perms")?.value;

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
      if (Array.isArray(payload.permissions)) {
        userPermissions = payload.permissions;
      }
    } catch (e) {
      console.error("Token decode error in proxy:", e);
    }
  }

  // Live client-synced cookie takes precedence if available
  if (permsCookie) {
    try {
      const decodedPerms = JSON.parse(decodeURIComponent(permsCookie));
      if (Array.isArray(decodedPerms) && decodedPerms.length > 0) {
        userPermissions = decodedPerms;
      }
    } catch (e) {
      // ignore
    }
  }

  // 1. Unauthenticated route protection
  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/technician") ||
    pathname.startsWith("/vehicle-inspection") ||
    pathname.startsWith("/qc") ||
    pathname === "/access-denied";

  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const canonicalRole = normalizeRole(userRole);
  const isSuperAdmin = canonicalRole === "SUPER_ADMIN";
  const isTech = canonicalRole === "TECHNICIAN";

  // Fallback to default matrix for role if permissions array is empty
  if (!isSuperAdmin && userPermissions.length === 0 && canonicalRole && DEFAULT_ROLE_MATRIX[canonicalRole]) {
    userPermissions = DEFAULT_ROLE_MATRIX[canonicalRole];
  }

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
  if ((pathname.startsWith("/dashboard") || pathname.startsWith("/technician") || pathname.startsWith("/vehicle-inspection") || pathname.startsWith("/qc")) && userRole) {
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
      const targetModule = canonicalizePermission(requiredModule);
      const canonicalUserPerms = userPermissions.map(canonicalizePermission);

      if (!canonicalUserPerms.includes(targetModule)) {
        return NextResponse.redirect(new URL("/access-denied", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/technician/:path*",
    "/login",
    "/access-denied",
    "/vehicle-inspection",
    "/vehicle-inspection/:path*",
    "/qc",
    "/qc/:path*",
  ],
};
