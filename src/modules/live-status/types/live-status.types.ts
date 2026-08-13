import { JobCard } from "@/modules/job-card/types/job-card.types";

export type LiveStage =
  | "Vehicle Check-In"
  | "Job Card Created"
  | "Work Assigned"
  | "Work In Progress"
  | "Waiting for Materials"
  | "Quality Check"
  | "Estimate Pending"
  | "Estimate Approved"
  | "Billing"
  | "Payment Pending"
  | "Ready for Delivery"
  | "Outpass Generated"
  | "Unmapped";

export type LivePriority = "Normal" | "High" | "Low" | "Urgent" | "VIP Customer" | string;

// The /outpass endpoint has no exported type elsewhere in the codebase (it's
// declared inline in dashboard/outpass/page.tsx) — this is the minimal shape
// deriveLiveStatus relies on.
export interface LiveOutPassInput {
  id: string;
  vehicle: string;
  outTime?: string;
}

export interface LiveVehicleRecord {
  id: string;
  jobCardId?: string;
  vehicle: string;
  customer: string;
  phone?: string;
  technician?: string;
  technicianId?: string;
  priority: LivePriority;
  stage: LiveStage;
  rawStatus: string;
  checkInTime?: string;
  eta?: string;
  isDelayed: boolean;
  delayMinutes?: number;
  franchiseId?: string;
  franchiseName?: string;
  jobCard?: JobCard;
}
