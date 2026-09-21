// Roles that get the full company-wide first-time setup wizard (Company
// Info + Tax Details + Services) — the same set franchise-scope.ts's
// isHQRole() treats as HQ, kept as a local literal list here (rather than
// importing isHQRole) since it needs to render a component choice, not a
// boolean.
export const HQ_SETUP_ROLES = ["SUPER_ADMIN", "SUPERADMIN", "HQ_USER", "HQ"];

// Roles that get the lighter, branch-scoped welcome/review wizard — their
// franchise record (address/GST/contact) is already filled in by whichever
// Super Admin created it (see AddFranchiseDialog), so there's nothing to
// re-collect, only to review.
export const BRANCH_ADMIN_SETUP_ROLES = ["FRANCHISE_ADMIN", "BRANCH_MANAGER"];

export function normalizeRole(role?: string | null): string {
  return (role || "").toUpperCase().replace(/[\s_]+/g, "_");
}
