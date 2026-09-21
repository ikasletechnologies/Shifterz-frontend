export type QCStatus =
  | "Completed"
  | "Work Completed"
  | "QC Pending"
  | "Waiting QC"
  | "Waiting for Quality Check"
  | "Inspecting"
  | "QC Passed"
  | "QC Failed"
  | "Rework"
  | "Ready For Billing"
  | "Rework Required";

export interface QCJob {
  id: string;
  vehicle: string;
  customer: string;
  service: string;
  technician: string;
  technicianId?: string;
  priority: string;
  status: QCStatus | string;
  receivedAt?: string;
  inspectedAt?: string;
  passedAt?: string;
  failedAt?: string;
  notes?: string;
  qcNotes?: string;
  reworkCount?: number;
  estCompletion?: string;
}

export interface ChecklistTemplateItem {
  id: string;
  category: string;
  label: string;
  order: number;
  isDefault?: boolean;
  franchiseId?: string | null;
  mandatory: boolean;
}

// Phase 4B-2C — explicit three-state result. "Unanswered" replaces the old
// implicit default (an item the inspector hasn't touched used to be silently
// submitted as `passed: true`, which is indistinguishable from a real Pass).
export type ChecklistItemResult = "Unanswered" | "Passed" | "Failed";

// Phase 4B-2D-A — `order`/`mandatory` are the checklist definition fields
// frozen onto QCInspection.checklist at Start (see the backend's
// QcRepository.buildFrozenChecklist); every item returned as part of an
// existing attempt carries them. They're optional here only because an
// outgoing submitChecklist() payload doesn't need to set them — the backend
// ignores anything but id/result/remark on submission and always keeps the
// frozen definition it already has.
export interface ChecklistResult {
  id: string;
  label?: string;
  category?: string;
  order?: number;
  mandatory?: boolean;
  result: ChecklistItemResult;
  remark?: string | null;
}

export interface QCPhoto {
  id: string;
  url: string;
  category: string;
  createdAt?: string;
}

// Phase 4B-3-C-A — the frozen definition's mandatory flag isn't enriched
// onto `checklist` items (only label/category are, see the backend's
// submitChecklist), so this is the only place a submitted item's `result`
// can be cross-referenced against whether it was actually mandatory. The
// backend already returns this field on every QCInspection row; only
// `id`/`mandatory` are typed here since that's all the frontend currently
// needs it for (the Pass-dialog warning below).
export interface FrozenChecklistDefinitionItem {
  id: string;
  mandatory: boolean;
}

// The canonical QC attempt record (Phase 4A/4B-1). One row per attempt on a
// Job; the frontend tracks the current attempt by id, not by Job.status.
export interface QCInspection {
  id: string;
  jobId: string;
  attemptNumber: number;
  inspectorId?: string | null;
  inspectorName?: string | null;
  result: "Pending" | "Passed" | "Failed";
  reason?: string | null;
  remarks?: string | null;
  reworkRequired?: boolean;
  checklist?: ChecklistResult[] | null;
  checklistDefinition?: FrozenChecklistDefinitionItem[] | null;
  photos?: QCPhoto[];
  decidedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface QCStats {
  waitingQC: number;
  inspecting: number;
  readyForBilling: number;
  rework: number;
  passedToday?: number;
  failedToday?: number;
  reworkPending?: number;
}

export interface QCRemarksPayload {
  jobId: string;
  notes: string;
}
