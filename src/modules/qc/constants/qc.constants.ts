// ─── QC Status Display ───────────────────────────────────────────────────────
// Phase 4B-1: the backend's real QC decision path only ever writes
// "Waiting for Quality Check", "Ready For Billing", and "Rework Required" —
// there is no persisted "Inspecting"/"QC Passed"/"QC Failed" Job status (an
// open attempt is tracked via QCInspection, not a Job.status value). The
// entries below for those legacy strings are kept only so older/manually
// seeded data still renders a sensible badge instead of a blank one; no
// current code path writes them.
export const QC_STATUS_COLORS: Record<string, string> = {
  Completed: "bg-green-100 text-green-700",
  "Work Completed": "bg-green-100 text-green-700",
  "QC Pending": "bg-yellow-100 text-yellow-700",
  "Waiting QC": "bg-yellow-100 text-yellow-700",
  "Waiting for Quality Check": "bg-yellow-100 text-yellow-700",
  Inspecting: "bg-blue-100 text-blue-700",
  "QC Passed": "bg-green-100 text-green-700",
  "QC Failed": "bg-red-100 text-red-700",
  "Rework Required": "bg-red-100 text-red-700",
  "Ready For Billing": "bg-teal-100 text-teal-700",
};

export const QC_FILTER_OPTIONS = [
  "Waiting QC",
  "Inspecting",
  "Ready for Billing",
  "Rework",
] as const;

// ─── QC Photos ────────────────────────────────────────────────────────────────
// Mirrors QC_PHOTO_CATEGORIES in the backend's qc.validation.ts — must match
// exactly, since the upload endpoint rejects any other value.
export const QC_PHOTO_CATEGORIES = [
  "FRONT_VIEW",
  "REAR_VIEW",
  "LEFT_SIDE",
  "RIGHT_SIDE",
  "INTERIOR",
  "COMPLETED_SERVICE",
  "SPECIAL_WORK",
] as const;

export const QC_PHOTO_CATEGORY_LABELS: Record<string, string> = {
  FRONT_VIEW: "Front View",
  REAR_VIEW: "Rear View",
  LEFT_SIDE: "Left Side",
  RIGHT_SIDE: "Right Side",
  INTERIOR: "Interior",
  COMPLETED_SERVICE: "Completed Service",
  SPECIAL_WORK: "Special Work",
};

// Kept only because the standalone ReworkDialog component still references
// it. That dialog is no longer wired into the active QC page (Phase 4B-1 —
// "Send for Rework" duplicated the Fail decision and is now removed from the
// live flow), but the component file itself was left in place rather than
// deleted, so this export must stay to keep it compiling.
export const REWORK_REASONS = [
  "Paint defect — requires correction",
  "PPF/film lifting or bubbling",
  "Coating not properly cured",
  "Interior not sufficiently cleaned",
  "Missed area — requires treatment",
  "Customer specification not met",
  "Accessory not installed correctly",
  "Other",
] as const;
