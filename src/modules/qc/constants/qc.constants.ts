import type { ChecklistItem, QCStatus } from "../types/qc.types";

// ─── QC Status Flow ──────────────────────────────────────────────────────────
// QC can only move jobs through this defined path. It cannot skip stages.
//
//   Waiting QC → Inspecting → QC Passed → Ready For Billing
//                           ↘ QC Failed → Rework → (back to Workshop → Waiting QC)

export const QC_STATUS_FLOW: Record<QCStatus, QCStatus[]> = {
  "Waiting QC": ["Inspecting"],
  Inspecting: ["QC Passed", "QC Failed"],
  "QC Passed": ["Ready For Billing"],
  "QC Failed": ["Rework"],
  Rework: [],          // Rework is handled by Workshop; QC reads-only
  "Ready For Billing": [], // Terminal state for QC
};

export const QC_STATUS_COLORS: Record<string, string> = {
  "Waiting QC": "bg-yellow-100 text-yellow-700",
  Inspecting: "bg-blue-100 text-blue-700",
  "QC Passed": "bg-green-100 text-green-700",
  "QC Failed": "bg-red-100 text-red-700",
  Rework: "bg-orange-100 text-orange-700",
  "Ready For Billing": "bg-teal-100 text-teal-700",
};

export const QC_FILTER_OPTIONS = [
  "All",
  "Waiting QC",
  "Inspecting",
  "QC Passed",
  "QC Failed",
  "Rework",
  "Ready For Billing",
] as const;

// ─── QC Checklist ────────────────────────────────────────────────────────────
// Source of truth for all inspection checklist items.
// Components must NEVER hardcode checklist items — always import from here.
export const QC_CHECKLIST: ChecklistItem[] = [
  // Exterior
  { id: "ext-1", category: "Exterior", label: "No visible scratches or swirls on paint", required: true },
  { id: "ext-2", category: "Exterior", label: "PPF/coating edges are sealed and aligned", required: true },
  { id: "ext-3", category: "Exterior", label: "No bubbles or lifting on film", required: true },
  { id: "ext-4", category: "Exterior", label: "Door panels and sills correctly treated", required: true },
  // Paint
  { id: "paint-1", category: "Paint", label: "Paint surface is clean and uniform", required: true },
  { id: "paint-2", category: "Paint", label: "No orange peel, hazing, or water spots", required: true },
  { id: "paint-3", category: "Paint", label: "Ceramic/coating layer properly cured", required: false },
  // Glass
  { id: "glass-1", category: "Glass", label: "Windshield is clear — no haze or smear", required: true },
  { id: "glass-2", category: "Glass", label: "Window tint (if applicable) is uniform", required: false },
  // Interior
  { id: "int-1", category: "Interior", label: "Dashboard and surfaces are dust-free", required: true },
  { id: "int-2", category: "Interior", label: "Seats and carpets vacuumed and clean", required: true },
  { id: "int-3", category: "Interior", label: "No product residue on interior panels", required: true },
  // Tyres
  { id: "tyre-1", category: "Tyres", label: "Tyre dressing applied uniformly", required: false },
  { id: "tyre-2", category: "Tyres", label: "Alloy wheels are clean and unmarked", required: true },
  // Accessories
  { id: "acc-1", category: "Accessories", label: "All accessories removed and returned", required: true },
  { id: "acc-2", category: "Accessories", label: "No workshop tools left in vehicle", required: true },
  // Cleaning
  { id: "clean-1", category: "Cleaning", label: "Final exterior rinse completed", required: true },
  { id: "clean-2", category: "Cleaning", label: "Vehicle is dry — no water marks", required: true },
  // Final Finish
  { id: "final-1", category: "Final Finish", label: "Overall finish matches customer specification", required: true },
  { id: "final-2", category: "Final Finish", label: "Quality inspector final walk-around completed", required: true },
];

// Group checklist by category for dialog rendering
export const QC_CHECKLIST_CATEGORIES = [
  ...new Set(QC_CHECKLIST.map((item) => item.category)),
];

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
