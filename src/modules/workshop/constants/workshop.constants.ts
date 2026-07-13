import type { WorkshopJobStatus } from "../types/workshop.types";

export const WORKSHOP_STATUSES: WorkshopJobStatus[] = [
  "Assigned",
  "In Progress",
  "Paused",
  "Completed",
  "Waiting QC",
];

export const WORKSHOP_STATUS_FLOW: Record<WorkshopJobStatus, WorkshopJobStatus | null> = {
  Assigned: "In Progress",
  "In Progress": "Completed",
  Paused: "In Progress",
  Completed: "Waiting QC",
  "Waiting QC": null,
  "QC Passed": null,
  "QC Failed": "In Progress",
  Rework: "In Progress",
};

export const WORKSHOP_STATUS_COLORS: Record<string, string> = {
  Assigned: "bg-yellow-100 text-yellow-700",
  "In Progress": "bg-blue-100 text-blue-700",
  Paused: "bg-orange-100 text-orange-700",
  Completed: "bg-green-100 text-green-700",
  "Waiting QC": "bg-purple-100 text-purple-700",
  "QC Passed": "bg-teal-100 text-teal-700",
  "QC Failed": "bg-red-100 text-red-700",
  Rework: "bg-rose-100 text-rose-700",
};

export const MATERIAL_UNITS = ["ml", "L", "g", "kg", "pcs", "roll", "sheet", "m"];

export const WORKSHOP_FILTERS = ["All", "Assigned", "In Progress", "Paused", "Completed", "Waiting QC"] as const;
