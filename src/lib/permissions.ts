"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { apiCall } from "@/lib/api";

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

export type PermissionModule = (typeof PERMISSION_MODULES)[number];

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
    "dashboard", "jobs", "workshop", "attendance"
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

export function normalizeRole(role?: string | null): string {
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
  if (normalized === "job_cards" || normalized === "job-cards" || normalized === "jobs" || normalized === "workshop") {
    return "jobs";
  }
  if (normalized === "out_pass" || normalized === "out-pass" || normalized === "outpass") {
    return "outpass";
  }
  return normalized;
}

export function syncPermissionsCookie(perms?: string[] | null) {
  if (typeof document === "undefined") return;
  try {
    const list = Array.isArray(perms) ? perms.map(canonicalizePermission) : [];
    document.cookie = `shifterz_perms=${encodeURIComponent(JSON.stringify(list))}; path=/; max-age=86400; SameSite=Lax`;
  } catch (e) {
    // ignore
  }
}

export function getStoredUser(): any | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function notifyPermissionsUpdated(updatedUser?: any) {
  if (typeof window === "undefined") return;
  if (updatedUser) {
    localStorage.setItem("user", JSON.stringify(updatedUser));
    if (Array.isArray(updatedUser.permissions)) {
      syncPermissionsCookie(updatedUser.permissions);
    }
  }
  window.dispatchEvent(new CustomEvent("shifterz-permissions-updated", { detail: updatedUser }));
}

/**
 * Checks if a user has access to a specific ERP module.
 * Super Admin retains full, unconditional access.
 */
export function isFranchiseOperational(user?: any): boolean {
  const currentUser = user !== undefined ? user : getStoredUser();
  if (!currentUser) return true;
  const canonicalRole = normalizeRole(currentUser.role);
  if (canonicalRole === "SUPER_ADMIN" || canonicalRole === "HQ_USER") {
    return true;
  }
  const fStatus = (currentUser.franchiseStatus || currentUser.franchise?.status || "").toUpperCase();
  if (fStatus === "PENDING" || fStatus === "DEACTIVE" || fStatus === "INACTIVE") {
    return false;
  }
  return true;
}

export function canAccessModule(
  moduleKey: string,
  user?: { role?: string; permissions?: string[] | null; franchiseStatus?: string; franchise?: { status?: string } } | null
): boolean {
  const currentUser = user !== undefined ? user : getStoredUser();
  if (!currentUser) return false;

  const canonicalRole = normalizeRole(currentUser.role);
  if (canonicalRole === "SUPER_ADMIN") {
    return true;
  }

  const targetKey = canonicalizePermission(moduleKey);

  // Restrict operational modules if franchise is PENDING or DEACTIVE
  if (!isFranchiseOperational(currentUser) && targetKey !== "dashboard") {
    return false;
  }

  const perms = currentUser.permissions;
  if (Array.isArray(perms)) {
    return perms.map(canonicalizePermission).includes(targetKey);
  }

  // Fallback to default matrix for this role if permissions array is missing
  const roleDefaults = DEFAULT_ROLE_MATRIX[canonicalRole] || [];
  return roleDefaults.map(canonicalizePermission).includes(targetKey);
}

/**
 * Maps a URL pathname to the required ERP module key.
 * Returns null if the route does not require a specific module permission (e.g. profile, login).
 */
export function getModuleForRoute(pathname: string): string | null {
  // Normalize path without trailing slash
  const path = pathname.replace(/\/+$/, "") || "/";

  // Public / non-gated routes
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

  // Specific route mapping
  if (path.startsWith("/technician/my-jobs")) return "jobs";
  if (path.startsWith("/technician/attendance")) return "attendance";
  if (path.startsWith("/technician/workshop")) return "jobs";
  if (path.startsWith("/vehicle-inspection")) return "vehicle-inspection";
  if (path.startsWith("/qc")) return "qc";

  // Sub-routes under dashboard
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

  // Franchise control nested submodules
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
    if (
      secondSegment === "licenses" ||
      secondSegment === "audit-logs" ||
      secondSegment === "notifications"
    ) {
      return "settings";
    }
    return "settings";
  }

  if (firstSegment === "franchise") {
    return "settings";
  }

  return null;
}

/**
 * React hook to access and subscribe to the current user's permissions.
 * Synchronizes with `/auth/me` to ensure changes made in Super Admin take immediate effect.
 */
export function usePermissions() {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const syncUser = useCallback((userData: any) => {
    if (!userData) return;
    setUser((prev: any) => {
      if (prev && JSON.stringify(prev) === JSON.stringify(userData)) return prev;
      return userData;
    });
    if (Array.isArray(userData.permissions)) {
      syncPermissionsCookie(userData.permissions);
    }
    setLoading(false);
  }, []);

  const refreshPermissions = useCallback(async () => {
    try {
      const res = await apiCall("/auth/me");
      if (res && res.user) {
        const storedStr = localStorage.getItem("user");
        const newStr = JSON.stringify(res.user);
        if (storedStr !== newStr) {
          localStorage.setItem("user", newStr);
          if (Array.isArray(res.user.permissions)) {
            syncPermissionsCookie(res.user.permissions);
          }
          setUser(res.user);
          window.dispatchEvent(
            new CustomEvent("shifterz-permissions-updated", { detail: res.user })
          );
        }
      }
    } catch (e) {
      // User may not be logged in yet
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initial = getStoredUser();
    if (initial) {
      setUser(initial);
      if (Array.isArray(initial.permissions)) {
        syncPermissionsCookie(initial.permissions);
      }
      setLoading(false);
    }

    // Refresh from server to get live permissions
    refreshPermissions();

    const handleCustomUpdate = (e: any) => {
      if (e.detail) {
        syncUser(e.detail);
      } else {
        syncUser(getStoredUser());
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "user") {
        syncUser(getStoredUser());
      }
    };

    const handleVisibilityOrFocus = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        refreshPermissions();
      }
    };

    window.addEventListener("shifterz-permissions-updated", handleCustomUpdate);
    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", handleVisibilityOrFocus);
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);

    return () => {
      window.removeEventListener("shifterz-permissions-updated", handleCustomUpdate);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", handleVisibilityOrFocus);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
    };
  }, [refreshPermissions, syncUser]);

  const role = normalizeRole(user?.role);
  const isSuperAdmin = role === "SUPER_ADMIN";
  const permissionsKey = Array.isArray(user?.permissions)
    ? user.permissions.join(",")
    : (DEFAULT_ROLE_MATRIX[role] || []).join(",");

  const permissions = useMemo(() => {
    const rawPermissions: string[] = isSuperAdmin
      ? [...PERMISSION_MODULES]
      : Array.isArray(user?.permissions)
      ? user.permissions
      : DEFAULT_ROLE_MATRIX[role] || [];
    return rawPermissions.map(canonicalizePermission);
  }, [isSuperAdmin, permissionsKey, role]);

  const canAccess = useCallback(
    (moduleKey: string) => {
      if (isSuperAdmin) return true;
      const target = canonicalizePermission(moduleKey);
      return permissions.includes(target);
    },
    [isSuperAdmin, permissions]
  );

  return {
    user,
    role,
    isSuperAdmin,
    permissions,
    canAccess,
    loading,
    refreshPermissions,
  };
}
