import { JobCard } from "../types/job-card.types";
import { StatusTone } from "@/lib/statusTone";

/**
 * Car-in → car-out tracking for a job card. Each job sits at exactly one
 * stage — the step it is waiting on — derived from the job status plus the
 * related check-in inspection, invoice and out pass. The Job Cards page only
 * tracks; each stage links to the page where that step is actually done.
 */

export type JobStageKey =
  | "inspection"
  | "technician"
  | "startWork"
  | "inWork"
  | "rework"
  | "qc"
  | "billing"
  | "payment"
  | "outPass"
  | "outPassApproval"
  | "delivered"
  | "cancelled";

export interface JobStageDef {
  key: JobStageKey;
  label: string;
  tone: StatusTone;
  /** Index into LIFECYCLE_STEPS of the step this stage is waiting on. */
  step: number;
  /** Where the step is done. `edit` = the job card's own edit dialog. */
  action?: { label: string; href?: string; edit?: true };
}

export const LIFECYCLE_STEPS = [
  "Car In",
  "Vehicle Inspection",
  "Technician",
  "Work",
  "QC",
  "Billing",
  "Payment",
  "Out Pass",
  "Car Out",
] as const;

export const JOB_STAGES: Record<JobStageKey, JobStageDef> = {
  inspection: { key: "inspection", label: "Waiting for Vehicle Inspection", tone: "neutral", step: 1, action: { label: "Inspect Vehicle", href: "/dashboard/vehicle-inspection" } },
  technician: { key: "technician", label: "Waiting for Technician", tone: "neutral", step: 2, action: { label: "Assign Technician", edit: true } },
  startWork: { key: "startWork", label: "Waiting to Start Work", tone: "neutral", step: 3, action: { label: "Go to Workshop", href: "/dashboard/workshop" } },
  inWork: { key: "inWork", label: "Work In Progress", tone: "neutral", step: 3, action: { label: "Go to Workshop", href: "/dashboard/workshop" } },
  rework: { key: "rework", label: "Rework Required", tone: "bad", step: 3, action: { label: "Go to Workshop", href: "/dashboard/workshop" } },
  qc: { key: "qc", label: "Waiting for QC", tone: "neutral", step: 4, action: { label: "Go to QC", href: "/dashboard/qc" } },
  billing: { key: "billing", label: "Waiting for Billing", tone: "neutral", step: 5, action: { label: "Go to Billing", href: "/dashboard/billing" } },
  payment: { key: "payment", label: "Waiting for Payment", tone: "neutral", step: 6, action: { label: "Record Payment", href: "/dashboard/billing" } },
  outPass: { key: "outPass", label: "Waiting for Out Pass", tone: "neutral", step: 7, action: { label: "Generate Out Pass", href: "/dashboard/billing" } },
  outPassApproval: { key: "outPassApproval", label: "Out Pass Pending Approval", tone: "neutral", step: 7, action: { label: "Approve Out Pass", href: "/dashboard/outpass" } },
  delivered: { key: "delivered", label: "Delivered", tone: "good", step: LIFECYCLE_STEPS.length },
  cancelled: { key: "cancelled", label: "Cancelled", tone: "bad", step: -1 },
};

/** Summary-card filters, in lifecycle order. Each covers one or more stages. */
export const STAGE_FILTERS: { id: string; label: string; stages: JobStageKey[]; tone?: StatusTone }[] = [
  { id: "inspection", label: "Waiting for Inspection", stages: ["inspection"] },
  { id: "technician", label: "Waiting for Technician", stages: ["technician"] },
  { id: "workshop", label: "In Workshop", stages: ["startWork", "inWork"] },
  { id: "rework", label: "Rework", stages: ["rework"], tone: "bad" },
  { id: "qc", label: "Waiting for QC", stages: ["qc"] },
  { id: "billing", label: "Waiting for Billing", stages: ["billing"] },
  { id: "payment", label: "Waiting for Payment", stages: ["payment"] },
  { id: "outPass", label: "Out Pass", stages: ["outPass", "outPassApproval"] },
  { id: "delivered", label: "Delivered", stages: ["delivered"], tone: "good" },
];

const DELIVERED = new Set(["Delivered", "Out", "Delivery"]);
const CANCELLED = new Set(["Cancelled", "Canceled"]);
const BILLING = new Set(["Ready For Billing", "QC Passed"]);
const QC = new Set([
  "Completed", "Complete", "Work Completed",
  "Waiting for Quality Check", "Waiting QC", "QC Pending", "Review for QC", "Inspecting", "In QC",
]);
const REWORK = new Set(["Rework Required", "Rework", "QC Failed"]);
const IN_WORK = new Set(["In Progress", "Work In Progress", "Ongoing", "Paused", "Waiting for Parts"]);

const normVehicle = (v?: string | null) => (v || "").replace(/[^A-Z0-9]/gi, "").toUpperCase();

export function hasTechnician(job: JobCard): boolean {
  const t = (job.technician || "").trim().toLowerCase();
  return t !== "" && t !== "unassigned" && t !== "none";
}

/** Latest non-cancelled invoice for the job (by jobId, else vehicle number). */
export function matchInvoice(job: JobCard, invoices: any[]): any | null {
  const veh = normVehicle(job.vehicle);
  return (
    invoices
      .filter((i) => i.status !== "Cancelled" && ((i.jobId && i.jobId === job.id) || (veh && normVehicle(i.vehicle) === veh)))
      .sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime())[0] || null
  );
}

/** The job's non-rejected out pass (by invoice, jobId, else vehicle number). */
export function matchOutPass(job: JobCard, outPasses: any[], invoice: any | null): any | null {
  const veh = normVehicle(job.vehicle);
  return (
    outPasses.find((op) => {
      if ((op.status || "").toLowerCase() === "rejected") return false;
      if (invoice?.id && op.invoiceId === invoice.id) return true;
      if (op.jobCardId && op.jobCardId === job.id) return true;
      return Boolean(veh && normVehicle(op.vehicle) === veh);
    }) || null
  );
}

export function getJobStage(
  job: JobCard,
  ctx: { inspectionPending: boolean; invoice: any | null; outPass: any | null }
): JobStageDef {
  const s = job.status as string;
  if (CANCELLED.has(s)) return JOB_STAGES.cancelled;
  if (DELIVERED.has(s)) return JOB_STAGES.delivered;

  if (BILLING.has(s)) {
    const { invoice, outPass } = ctx;
    if (outPass) {
      const approved = outPass.issued || outPass.status === "Delivered" || outPass.status === "Approved";
      return approved ? JOB_STAGES.delivered : JOB_STAGES.outPassApproval;
    }
    if (!invoice) return JOB_STAGES.billing;
    if (invoice.status !== "Paid" && invoice.status !== "Completed") return JOB_STAGES.payment;
    return JOB_STAGES.outPass;
  }

  if (QC.has(s)) return JOB_STAGES.qc;
  if (REWORK.has(s)) return JOB_STAGES.rework;
  if (!hasTechnician(job)) return ctx.inspectionPending ? JOB_STAGES.inspection : JOB_STAGES.technician;
  if (IN_WORK.has(s)) return JOB_STAGES.inWork;
  return JOB_STAGES.startWork;
}
