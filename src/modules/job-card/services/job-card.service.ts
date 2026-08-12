import { apiCall } from "@/services/api.client";
import { JobCard, JobCardFormData } from "../types/job-card.types";

export async function getJobCards(franchiseId?: string): Promise<JobCard[]> {
  const query = franchiseId ? `?franchiseId=${encodeURIComponent(franchiseId)}` : "";
  return apiCall(`/jobs${query}`);
}

export async function createJobCard(data: JobCardFormData): Promise<JobCard> {
  return apiCall("/jobs", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateJobCard(id: string, data: Partial<JobCardFormData>): Promise<JobCard> {
  return apiCall(`/jobs/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteJobCard(id: string): Promise<void> {
  return apiCall(`/jobs/${id}`, { method: "DELETE" });
}
