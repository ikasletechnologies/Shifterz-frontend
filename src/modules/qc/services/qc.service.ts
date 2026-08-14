import { apiCall } from "@/services/api.client";
import { QCJob, ChecklistResult } from "../types/qc.types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

/**
 * Fetch all jobs currently in the QC pipeline.
 * Filters: Waiting QC, Inspecting, QC Passed, QC Failed, Rework
 */
export async function getPendingQC(): Promise<QCJob[]> {
  return apiCall("/jobs");
}

/**
 * Begin inspection — move job to "Inspecting" status.
 */
export async function startInspection(jobId: string): Promise<QCJob> {
  return apiCall(`/jobs/${jobId}`, {
    method: "PUT",
    body: JSON.stringify({ status: "Inspecting" }),
  });
}

/**
 * Submit completed checklist without making pass/fail decision.
 */
export async function submitChecklist(
  jobId: string,
  checklist: ChecklistResult[]
): Promise<QCJob> {
  return apiCall(`/jobs/${jobId}/qc-checklist`, {
    method: "POST",
    body: JSON.stringify({ checklist }),
  });
}

/**
 * Mark QC as Passed → job moves to "Ready For Billing".
 * QC must never skip directly to Billing without this step.
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
 * Mark QC as Failed — job moves to "QC Failed" state.
 */
export async function failQC(jobId: string, notes: string): Promise<QCJob> {
  return apiCall(`/qc/${jobId}/decision`, {
    method: "POST",
    body: JSON.stringify({
      result: "Failed",
      remarks: notes,
      reworkRequired: true,
    }),
  });
}

/**
 * Send job back for Rework — job moves to "Rework" status.
 * Workshop will pick it back up.
 */
export async function rework(jobId: string, reason: string, notes?: string): Promise<QCJob> {
  return apiCall(`/jobs/${jobId}`, {
    method: "PUT",
    body: JSON.stringify({
      status: "Rework",
      qcNotes: `${reason}${notes ? ` — ${notes}` : ""}`,
    }),
  });
}

/**
 * Upload QC inspection photos.
 * Uses raw fetch because FormData requires multipart encoding.
 */
export async function uploadQCPhotos(jobId: string, files: File[]): Promise<{ photos: string[] }> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  const res = await fetch(`${API_URL}/jobs/${jobId}/qc-photos`, {
    method: "POST",
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "QC photo upload failed");
  }
  return res.json();
}

/**
 * Add or update QC remarks on a job.
 */
export async function addRemarks(jobId: string, notes: string): Promise<QCJob> {
  return apiCall(`/jobs/${jobId}`, {
    method: "PUT",
    body: JSON.stringify({ qcNotes: notes }),
  });
}
