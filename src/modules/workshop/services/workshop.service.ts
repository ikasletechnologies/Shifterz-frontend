import { apiCall } from "@/services/api.client";
import { WorkshopJob, MaterialRecord } from "../types/workshop.types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export async function getMyJobs(): Promise<WorkshopJob[]> {
  return apiCall("/jobs");
}

export async function startWork(jobId: string): Promise<WorkshopJob> {
  return apiCall(`/jobs/${jobId}`, {
    method: "PUT",
    body: JSON.stringify({
      status: "In Progress",
      startedAt: new Date().toISOString(),
    }),
  });
}

export async function pauseWork(jobId: string, note?: string): Promise<WorkshopJob> {
  return apiCall(`/jobs/${jobId}`, {
    method: "PUT",
    body: JSON.stringify({
      status: "Paused",
      notes: note,
    }),
  });
}

export async function resumeWork(jobId: string): Promise<WorkshopJob> {
  return apiCall(`/jobs/${jobId}`, {
    method: "PUT",
    body: JSON.stringify({
      status: "In Progress",
    }),
  });
}

export async function updateProgress(jobId: string, notes: string): Promise<WorkshopJob> {
  return apiCall(`/jobs/${jobId}`, {
    method: "PUT",
    body: JSON.stringify({ notes }),
  });
}

export async function completeWork(
  jobId: string,
  data: { notes?: string; actualCompletion?: string }
): Promise<WorkshopJob> {
  return apiCall(`/jobs/${jobId}`, {
    method: "PUT",
    body: JSON.stringify({
      status: "Completed",
      actualCompletion: data.actualCompletion || new Date().toISOString().slice(0, 10),
      notes: data.notes,
    }),
  });
}

export async function uploadPhotos(jobId: string, files: File[]): Promise<{ photos: string[] }> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  const res = await fetch(`${API_URL}/jobs/${jobId}/photos`, {
    method: "POST",
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Upload failed");
  }

  return res.json();
}

export async function recordMaterial(
  jobId: string,
  material: Omit<MaterialRecord, "jobId" | "addedAt">
): Promise<MaterialRecord> {
  return apiCall(`/jobs/${jobId}/materials`, {
    method: "POST",
    body: JSON.stringify(material),
  });
}

export async function sendToQC(jobId: string, notes?: string): Promise<WorkshopJob> {
  return apiCall(`/jobs/${jobId}`, {
    method: "PUT",
    body: JSON.stringify({
      status: "Waiting QC",
      notes,
    }),
  });
}
