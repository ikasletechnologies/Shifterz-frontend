import { LiveStage } from "../types/live-status.types";

// Maps every known JobCard/Workshop status string (see job-card.types.ts JobStatus,
// plus workshop-only "Paused") onto one of the board's stages. Anything not listed
// here falls back to "Unmapped" in deriveLiveStatus rather than being dropped.
export const STATUS_TO_STAGE_MAP: Record<string, LiveStage> = {
  Pending: "Job Card Created",
  Unassigned: "Job Card Created",
  Assigned: "Work Assigned",
  "In Progress": "Work In Progress",
  Ongoing: "Work In Progress",
  Paused: "Work In Progress",
  Rework: "Work In Progress",
  "Waiting for Parts": "Waiting for Materials",
  "Waiting Material": "Waiting for Materials",
  "Waiting Parts": "Waiting for Materials",
  "Review for QC": "Quality Check",
  "Waiting QC": "Quality Check",
  "QC Pending": "Quality Check",
  Inspecting: "Quality Check",
  "In QC": "Quality Check",
  "QC Failed": "Quality Check",
  Completed: "Quality Check",
  Complete: "Quality Check",
  "Work Completed": "Quality Check",
  "QC Passed": "Billing",
  "Ready For Billing": "Billing",
};

// Statuses that mean the vehicle has left the workshop — excluded from the live
// board entirely per spec 11.12.5 ("delivered vehicles ... moved to history").
export const TERMINAL_STATUSES = ["Delivered", "Out", "Delivery", "Cancelled", "Canceled"];

// Per spec 11.5 there are only 6 official colours for 17 stages; stages not
// explicitly named in the spec are mapped to the closest matching colour.
export const STAGE_COLORS: Record<LiveStage, string> = {
  "Vehicle Check-In": "bg-blue-100 text-blue-700",
  "Job Card Created": "bg-blue-100 text-blue-700",
  "Work Assigned": "bg-orange-100 text-orange-700",
  "Work In Progress": "bg-orange-100 text-orange-700",
  "Waiting for Materials": "bg-yellow-100 text-yellow-700",
  "Estimate Pending": "bg-yellow-100 text-yellow-700",
  "Estimate Approved": "bg-orange-100 text-orange-700",
  "Quality Check": "bg-purple-100 text-purple-700",
  Billing: "bg-yellow-100 text-yellow-700",
  "Payment Pending": "bg-yellow-100 text-yellow-700",
  "Ready for Delivery": "bg-green-100 text-green-700",
  "Outpass Generated": "bg-green-100 text-green-700",
  Unmapped: "bg-gray-100 text-gray-600",
};

export const DELAY_COLOR = "bg-red-100 text-red-700";

// Superset of job-card's JOB_PRIORITIES (Normal/High/Low) with Urgent/VIP Customer
// added per spec 11.6. Kept local to this module so the existing job-card create/edit
// forms (which still only offer Normal/High/Low) are untouched.
export const LIVE_PRIORITIES = ["Normal", "High", "Urgent", "VIP Customer"] as const;

export const LIVE_PRIORITY_COLORS: Record<string, string> = {
  Normal: "bg-blue-100 text-blue-700",
  High: "bg-orange-100 text-orange-700",
  Low: "bg-green-100 text-green-700",
  Urgent: "bg-red-100 text-red-700",
  "VIP Customer": "bg-purple-100 text-purple-700",
};

export const LIVE_STAGES: LiveStage[] = [
  "Vehicle Check-In",
  "Job Card Created",
  "Work Assigned",
  "Work In Progress",
  "Waiting for Materials",
  "Estimate Pending",
  "Estimate Approved",
  "Quality Check",
  "Billing",
  "Payment Pending",
  "Ready for Delivery",
  "Outpass Generated",
  "Unmapped",
];

export const POLL_INTERVAL_MS = 20_000;
