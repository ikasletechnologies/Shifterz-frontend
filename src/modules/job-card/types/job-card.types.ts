export type JobPriority = "High" | "Normal" | "Low";

export type JobStatus =
  | "Pending"
  | "Unassigned"
  | "Assigned"
  | "In Progress"
  | "Ongoing"
  | "Review for QC"
  | "Waiting QC"
  | "Waiting for Quality Check"
  | "QC Pending"
  | "Inspecting"
  | "In QC"
  | "Rework"
  | "Rework Required"
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

// A priced service line item as the backend's GST resolver expects it
// (gstInvoiceResolver.service.ts's resolveLineItemsFromJob): `name` is matched
// against the Service catalog by exact string, so it must be the catalog
// entry's real name, not a free-text label.
export interface JobServiceLineItem {
  name: string;
  price: number;
  qty: number;
}

export interface JobCard {
  id: string;
  vehicle: string;
  customer: string;
  phone?: string;
  customerPhone?: string;
  // Real relational link to the originating Car-In record (backend's
  // createJobCardSchema/updateJobCardSchema both accept it) — the frontend
  // never set this before, so a job card's connection to its check-in only
  // ever existed as fuzzy vehicle-number string matching, never this FK.
  carInId?: string | null;
  service: string;
  // Priced line items billing's GST calculation is actually computed from —
  // separate from the free-text `service` label above, which is display-only.
  services?: JobServiceLineItem[];
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
  // Service-Advisor-assigned QC inspector — set before/independent of the
  // QCInspection.inspectorId the backend stamps at Pass/Fail decision time.
  qcInspectorId?: string;
  qcInspector?: string;
}

export interface JobCardFormData {
  id?: string;
  vehicle: string;
  customer: string;
  phone?: string;
  customerPhone?: string;
  carInId?: string | null;
  service: string;
  services?: JobServiceLineItem[];
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
  qcInspectorId?: string;
  qcInspector?: string;
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
