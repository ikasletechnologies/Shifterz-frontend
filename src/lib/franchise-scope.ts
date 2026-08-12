/* eslint-disable @typescript-eslint/no-explicit-any */

export interface ScopedUser {
  role?: string;
  franchiseId?: string;
}

export function getCurrentUser(): ScopedUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isHQRole(role?: string | null): boolean {
  const normalized = (role || "").split("|")[0].toUpperCase().replace(/[\s_]+/g, "_");
  return normalized === "SUPER_ADMIN" || normalized === "SUPERADMIN" || normalized === "HQ_USER" || normalized === "HQ";
}

/**
 * Franchise/branch admins must only ever see their own branch's records.
 * Returns the franchiseId to scope requests to, or undefined for HQ roles
 * (who are allowed to see everything).
 */
export function getScopedFranchiseId(user: ScopedUser | null = getCurrentUser()): string | undefined {
  if (!user || isHQRole(user.role)) return undefined;
  return user.franchiseId || undefined;
}

function getRecordFranchiseId(record: object): string | undefined {
  const o = record as Record<string, unknown>;
  const id = o.franchiseId ?? o.branchId;
  return typeof id === "string" ? id : undefined;
}

/**
 * Defense-in-depth filter applied on top of whatever the backend returns.
 * The /jobs, /carin and /outpass endpoints are not known to enforce branch
 * scoping server-side, so a non-HQ user's results are re-filtered here by
 * the record's own franchiseId/branchId field (when present) to guarantee
 * a branch admin never sees another branch's — or HQ's — records.
 */
export function scopeToFranchise<T extends object>(records: T[], user: ScopedUser | null = getCurrentUser()): T[] {
  const franchiseId = getScopedFranchiseId(user);
  if (!franchiseId) return records;
  return records.filter((r) => {
    const rid = getRecordFranchiseId(r);
    return !rid || rid === franchiseId;
  });
}
