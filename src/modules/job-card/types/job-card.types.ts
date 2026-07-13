export type JobPriority = "High" | "Normal" | "Low";

export type JobStatus =
  | "Pending"
  | "Assigned"
  | "In Progress"
  | "Completed"
  | "QC Passed"
  | "Ready For Billing"
  | "Cancelled";

export interface JobCard {
  id: string;
  vehicle: string;
  customer: string;
  service: string;
  technician: string;
  technicianId?: string;
  priority: JobPriority;
  status: JobStatus;
  startDate: string;
  estCompletion: string;
  actualCompletion: string;
  notes: string;
}

export interface JobCardFormData {
  id?: string;
  vehicle: string;
  customer: string;
  service: string;
  technician: string;
  technicianId?: string;
  priority: string;
  status: string;
  startDate: string;
  estCompletion: string;
  actualCompletion: string;
  notes: string;
}

export interface JobCardStats {
  pending: number;
  inProgress: number;
  completed: number;
  cancelled: number;
}
