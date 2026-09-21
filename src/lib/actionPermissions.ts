import { apiCall } from "@/services/api.client";

// Phase 4B-2E — this frontend never had a fine-grained RBAC action-checking
// mechanism before (confirmed by a full repo audit: gating was always by
// coarse module-name string or raw role comparison). GET /auth/me now also
// returns `actions` (backend Phase 4B-2E addition to authService.getMe,
// reusing the exact same resolveActionPermissions() every protected route's
// requireAction() middleware already relies on — no new authorization
// decision, just surfaced to the client). This file is the one place that
// wraps it; any future module needing real action-based gating (not just
// the QC template UI) should reuse this rather than re-deriving it.
//
// IMPORTANT: this is UX only. The backend's own requireAction() on each
// route remains the actual authority — nothing here can be trusted to
// enforce anything by itself (Part 33).
export const ALL_ACTIONS_SENTINEL = "*";

export interface ResolvedActionUser {
  id: string;
  username: string | null;
  role: string;
  actions: string[];
  franchiseId: string | null;
  hqControlled: boolean;
}

export async function fetchCurrentUserActions(): Promise<ResolvedActionUser> {
  const res = await apiCall("/auth/me");
  return res.user as ResolvedActionUser;
}

export function hasAction(actions: string[] | undefined | null, action: string): boolean {
  if (!actions) return false;
  return actions.includes(ALL_ACTIONS_SENTINEL) || actions.includes(action);
}
