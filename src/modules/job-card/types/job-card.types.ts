export type JobPriority = "High" | "Normal" | "Low";

export type JobStatus =
  | "Pending"
  | "Unassigned"
  | "Assigned"
  | "In Progress"
  | "Ongoing"
  | "Review for QC"
  | "Waiting QC"
  | "QC Pending"
  | "Inspecting"
  | "In QC"
  | "Rework"
  | "QC Failed"
  | "Completed"
  | "Complete"
  | "Work Completed"
  | "QC Passed"
  | "Ready For Billing"
  | "Cancelled"
  | "Canceled"
  | "Delivered"
  | "Out"
  | "Delivery";

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
  checkInPhotos?: string[];
  workProgressPhotos?: string[];
  completionPhotos?: string[];
  technicianInstructions?: string;
  internalRemarks?: string;
  inspectionDetails?: any;
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
  checkInPhotos?: string[];
  workProgressPhotos?: string[];
  completionPhotos?: string[];
  technicianInstructions?: string;
  internalRemarks?: string;
  inspectionDetails?: any;
}

export interface JobCardStats {
  all: number;
  assigned: number;
  unassigned: number;
  inProgress: number;
  reviewForQC: number;
  completed: number;
  rework: number;
  readyForBilling: number;
  delivered: number;
  cancelled: number;
}
