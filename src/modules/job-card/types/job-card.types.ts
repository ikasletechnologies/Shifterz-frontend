export type JobPriority = "High" | "Normal" | "Low";

export type JobStatus =
  | "Pending"
  | "Assigned"
  | "In Progress"
  | "Completed"
  | "QC Passed"
  | "Ready For Billing"
  | "Cancelled"
  | "Delivered"
  | "Out";

export interface JobCard {
  id: string;
  vehicle: string;
  customer: string;
  phone?: string;
  customerPhone?: string;
  service: string;
  technician: string;
  technicianId?: string;
  priority: JobPriority;
  status: JobStatus;
  startDate: string;
  estCompletion: string;
  actualCompletion: string;
  notes: string;
  photos?: string[];
}

export interface JobCardFormData {
  id?: string;
  vehicle: string;
  customer: string;
  phone?: string;
  customerPhone?: string;
  service: string;
  technician: string;
  technicianId?: string;
  priority: string;
  status: string;
  startDate: string;
  estCompletion: string;
  actualCompletion: string;
  notes: string;
  photos?: string[];
}

export interface JobCardStats {
  pending: number;
  assigned: number;
  inProgress: number;
  completed: number;
  delivery: number;
  readyForBilling: number;
}
