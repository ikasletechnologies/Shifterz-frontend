// Phase 4B-2E — types matching the Phase 4B-2D-C/D backend contract exactly
// (QCChecklistTemplateVersion / QCChecklistTemplateVersionItem). These are
// the ONLY authoritative source for QC checklist configuration — the legacy
// ChecklistTemplateItem/QCChecklistTemplate types (qc.types.ts) remain for
// the old, now-inert CRUD surface and must not be used here.

export type TemplateVersionStatus = "Draft" | "Published" | "Superseded";

// "Global" is this module's own name for the HQ scope (franchiseId: null),
// kept distinct from the string "null" so components never have to juggle
// the raw nullable id themselves.
export type TemplateScope = "Global" | string;

export interface TemplateVersionItem {
  id: string;
  versionId: string;
  logicalItemId: string;
  label: string;
  category: string;
  order: number;
  mandatory: boolean;
}

export interface TemplateVersion {
  id: string;
  franchiseId: string | null;
  versionNumber: number;
  status: TemplateVersionStatus;
  createdById: string | null;
  createdAt: string;
  publishedById: string | null;
  publishedAt: string | null;
  items: TemplateVersionItem[];
}

// The wire shape sent to create/update — logicalItemId is intentionally
// optional (Part 11: omitted means "brand-new conceptual item," the backend
// generates the identity; the frontend must never fabricate one itself).
export interface TemplateVersionItemInput {
  logicalItemId?: string;
  label: string;
  category: string;
  order: number;
  mandatory: boolean;
}
