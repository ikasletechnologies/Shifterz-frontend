// Roles that get the full company-wide first-time setup wizard (Company
// Info + Tax Details + Services) — the same set franchise-scope.ts's
// isHQRole() treats as HQ, kept as a local literal list here (rather than
// importing isHQRole) since it needs to render a component choice, not a
// boolean.
export const HQ_SETUP_ROLES = ["SUPER_ADMIN", "SUPERADMIN", "HQ_USER", "HQ"];

// Franchise admin and branch manager accounts do not require setup onboarding wizard.
export const BRANCH_ADMIN_SETUP_ROLES: string[] = [];

export function normalizeRole(role?: string | null): string {
  return (role || "").toUpperCase().replace(/[\s_]+/g, "_");
}
