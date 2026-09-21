export const JOB_PRIORITIES = ["Normal", "High", "Low"] as const;

export const JOB_STATUSES = [
  "Pending",
  "Assigned",
  "In Progress",
  "Completed",
  "QC Passed",
  "Ready For Billing",
  "Cancelled",
] as const;

export const JOB_SERVICES = [
  "PPF Full Body",
  "PPF Partial",
  "C3 Coating",
  "Ceramic Coating",
  "Interior Detailing",
  "Exterior Detailing",
  "Window Tint",
  "Paint Protection",
  "Maintenance Wash",
] as const;

export const PRIORITY_COLORS: Record<string, string> = {
  High: "bg-red-100 text-red-700",
  Normal: "bg-blue-100 text-blue-700",
  Low: "bg-green-100 text-green-700",
};

// Statuses reached once QC has passed the job — it's sitting in the Billing
// module's queue (src/modules/billing/components/BillingJobCards.tsx) waiting
// for an invoice, whether or not one has been generated yet.
export const READY_FOR_BILLING_STATUSES = new Set(["Ready For Billing", "QC Passed"]);

export const STATUS_COLORS: Record<string, string> = {
  Pending: "bg-gray-100 text-gray-600",
  Assigned: "bg-indigo-100 text-indigo-600",
  "In Progress": "bg-blue-50 text-blue-600",
  "Waiting for Parts": "bg-amber-100 text-amber-700",
  "Waiting Material": "bg-amber-100 text-amber-700",
  "Waiting Parts": "bg-amber-100 text-amber-700",
  Completed: "bg-green-50 text-green-600",
  "QC Passed": "bg-teal-100 text-teal-700",
  "Ready For Billing": "bg-purple-100 text-purple-700",
  Cancelled: "bg-red-50 text-red-500",
};
