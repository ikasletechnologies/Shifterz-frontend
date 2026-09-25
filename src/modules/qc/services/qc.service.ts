import { apiCall } from "@/services/api.client";
import { QCJob, QCInspection, ChecklistResult, ChecklistTemplateItem } from "../types/qc.types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

/**
 * Fetch the QC queue — jobs Waiting for Quality Check, mid-inspection, or
 * back for Rework Required. Franchise-scoped server-side.
 * Phase 4B-1: switched from GET /jobs (unfiltered, client-side status
 * whitelist that didn't even include the real "Waiting for Quality Check"
 * string) to the canonical, correctly-scoped QC queue endpoint.
 */
export async function getPendingQC(): Promise<QCJob[]> {
  return apiCall("/qc/queue");
}

/**
 * Fetch the HQ/franchise-configured checklist template.
 */
export async function getChecklistTemplate(): Promise<ChecklistTemplateItem[]> {
  return apiCall("/qc/checklist-template");
}

/**
 * Open (lazy-start) or resume the current QCInspection attempt for a job.
 * Returns the attempt — a fresh Pending one if none was open, or the
 * existing open one if inspection was already in progress.
 */
export async function startInspection(jobId: string): Promise<QCInspection> {
  return apiCall(`/qc/${jobId}/start`, { method: "POST" });
}

/**
 * All QC attempts for a job (current + historical), newest first, with
 * photos included. Used both to hydrate "the current attempt" and to show
 * prior attempts.
 */
export async function getInspections(jobId: string): Promise<QCInspection[]> {
  return apiCall(`/qc/${jobId}/inspections`);
}

/**
 * Submit the checklist against the job's current open QCInspection attempt
 * (lazily created if one isn't already open). Writes QCInspection.checklist —
 * never the legacy Job.checklist field.
 */
export async function submitChecklist(
  jobId: string,
  checklist: ChecklistResult[]
): Promise<QCInspection> {
  return apiCall(`/qc/${jobId}/checklist`, {
    method: "PUT",
    body: JSON.stringify({ checklist }),
  });
}

/**
 * Assign a Quality Inspector (management only). Opens the job's QC attempt
 * owned by that inspector.
 */
export async function assignInspector(jobId: string, inspectorId: string): Promise<QCInspection> {
  return apiCall(`/qc/${jobId}/assign`, {
    method: "POST",
    body: JSON.stringify({ inspectorId }),
  });
}

/**
 * Management shortcut: make sure the job has an open attempt with every
 * checklist item answered, so a Pass/Fail can be recorded straight away.
 * Items the inspector already answered keep their result; the rest are
 * marked Passed.
 */
export async function prepareForDecision(jobId: string): Promise<void> {
  const attempt = await startInspection(jobId);
  const existing = new Map((attempt.checklist || []).map((item) => [item.id, item]));
  const ids = Array.from(new Set([
    ...(attempt.checklistDefinition || []).map((item) => item.id),
    ...existing.keys(),
  ]));
  const isAnswered = (id: string) => {
    const r = existing.get(id)?.result;
    return r === "Passed" || r === "Failed";
  };
  if (ids.length === 0 || ids.every(isAnswered)) return;

  const filled: ChecklistResult[] = ids.map((id) => {
    const item = existing.get(id);
    return item && isAnswered(id)
      ? { id, result: item.result, remark: item.remark ?? undefined }
      : { id, result: "Passed" };
  });
  await submitChecklist(jobId, filled);
}

/**
 * Mark QC as Passed → job moves to "Ready For Billing".
 */
export async function passQC(jobId: string, notes?: string): Promise<QCJob> {
  return apiCall(`/qc/${jobId}/decision`, {
    method: "POST",
    body: JSON.stringify({
      result: "Passed",
      remarks: notes,
    }),
  });
}

/**
 * Mark QC as Failed — job moves to "Rework Required".
 */
export async function failQC(jobId: string, notes: string): Promise<QCJob> {
  return apiCall(`/qc/${jobId}/decision`, {
    method: "POST",
    body: JSON.stringify({
      result: "Failed",
      reason: notes,
      remarks: notes,
      reworkRequired: true,
    }),
  });
}

/**
 * Upload QC inspection photos against the job's current open QCInspection
 * attempt. Uses raw fetch because FormData requires multipart encoding.
 * Writes JobPhoto.qcInspectionId — never the legacy Job.qcPhotos field.
 */
export async function uploadQCPhotos(
  jobId: string,
  category: string,
  files: File[]
): Promise<{ photos: { id: string; url: string; category: string }[] }> {
  const formData = new FormData();
  formData.append("category", category);
  files.forEach((file) => formData.append("files", file));

  // Phase 0.10 — auth travels via httpOnly cookie now; credentials:
  // "include" is required for the browser to attach it cross-origin.
  const res = await fetch(`${API_URL}/qc/${jobId}/photos`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "QC photo upload failed");
  }
  return { photos: await res.json() };
}

/**
 * Add or update QC remarks on a job. Unrelated to the checklist/photo/decision
 * canonical path — this is a freeform note stored on Job.qcNotes.
 */
export async function addRemarks(jobId: string, notes: string): Promise<QCJob> {
  return apiCall(`/jobs/${jobId}`, {
    method: "PUT",
    body: JSON.stringify({ qcNotes: notes }),
  });
}
