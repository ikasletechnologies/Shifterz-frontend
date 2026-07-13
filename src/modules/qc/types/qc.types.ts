export type QCStatus =
  | "Waiting QC"
  | "Inspecting"
  | "QC Passed"
  | "QC Failed"
  | "Rework"
  | "Ready For Billing";

export interface QCJob {
  id: string;
  vehicle: string;
  customer: string;
  service: string;
  technician: string;
  technicianId?: string;
  priority: string;
  status: QCStatus;
  receivedAt?: string;
  inspectedAt?: string;
  passedAt?: string;
  failedAt?: string;
  notes?: string;
  qcNotes?: string;
  qcPhotos?: string[];
  checklist?: ChecklistResult[];
  reworkCount?: number;
  estCompletion?: string;
}

export interface ChecklistItem {
  id: string;
  category: string;
  label: string;
  required: boolean;
}

export interface ChecklistResult {
  id: string;
  label: string;
  passed: boolean;
  remark?: string;
}

export interface QCStats {
  waitingQC: number;
  passedToday: number;
  failedToday: number;
  reworkPending: number;
}

export interface QCRemarksPayload {
  jobId: string;
  notes: string;
}

export interface ReworkPayload {
  jobId: string;
  reason: string;
  notes?: string;
}
