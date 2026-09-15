import { apiCall } from "@/services/api.client";
import { TemplateVersion, TemplateVersionItemInput } from "../types/qc-template-version.types";

// Phase 4B-2E — the ONLY frontend surface for QC checklist configuration.
// Every call here targets QCChecklistTemplateVersion(Item) — the legacy
// /qc/checklist-template CRUD (see qc.service.ts's getChecklistTemplate) is
// never called from this file, and must never become the authoring path
// for this UI (Part 30).

/**
 * List template versions in the caller's own scope (HQ sees the HQ scope,
 * a franchise user sees their own franchise's versions) — server-derived,
 * never a franchiseId the client can choose.
 */
export async function listTemplateVersions(): Promise<TemplateVersion[]> {
  return apiCall("/qc/template-versions");
}

export async function getTemplateVersion(id: string): Promise<TemplateVersion> {
  return apiCall(`/qc/template-versions/${id}`);
}

/**
 * The current HQ Published version, read-only, visible regardless of the
 * caller's own scope — this is what lets a franchise user see "the HQ
 * Standard" for context while editing their own additions (Part 13).
 * Distinct from listTemplateVersions(), which only ever returns the
 * caller's own scope.
 */
export async function getHqPublishedVersion(): Promise<TemplateVersion | null> {
  return apiCall("/qc/template-versions/hq-published");
}

/**
 * Creates a new Draft in the caller's own scope. `items` must be the
 * COMPLETE desired set for the new version (whole-template versioning, not
 * an incremental diff) — see updateTemplateVersion's own note.
 */
export async function createTemplateVersion(items: TemplateVersionItemInput[]): Promise<TemplateVersion> {
  return apiCall("/qc/template-versions", {
    method: "POST",
    body: JSON.stringify({ items }),
  });
}

/**
 * Replaces a Draft's full item set. Rejected by the backend if the version
 * is not currently Draft.
 */
export async function updateTemplateVersion(id: string, items: TemplateVersionItemInput[]): Promise<TemplateVersion> {
  return apiCall(`/qc/template-versions/${id}`, {
    method: "PUT",
    body: JSON.stringify({ items }),
  });
}

/** Permanently deletes a Draft. Rejected by the backend for Published/Superseded. */
export async function discardTemplateVersion(id: string): Promise<{ success: boolean; message: string }> {
  return apiCall(`/qc/template-versions/${id}`, { method: "DELETE" });
}

/**
 * Publishes a Draft: it becomes Published, and whatever was previously
 * Published in that same scope becomes Superseded — atomically, on the
 * backend. Never call this without the user having explicitly confirmed
 * (Part 19) — this function itself performs no confirmation.
 */
export async function publishTemplateVersion(id: string): Promise<TemplateVersion> {
  return apiCall(`/qc/template-versions/${id}/publish`, { method: "POST" });
}
