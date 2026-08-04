import { JobCard } from "@/modules/job-card/types/job-card.types";
import { CarEntry } from "@/modules/vehicle-checkin/types/vehicle-checkin.types";
import { BillingDocument } from "@/modules/billing/types/billing.types";
import {
  LiveOutPassInput,
  LiveStage,
  LiveVehicleRecord,
} from "../types/live-status.types";
import { STATUS_TO_STAGE_MAP, TERMINAL_STATUSES } from "../constants/live-status.constants";

function normalizeVehicle(v?: string | null): string {
  return (v || "").trim().toUpperCase();
}

// None of JobCard/CarEntry's TS types declare a franchise field, but the backend
// may attach one anyway (multi-tenant setups usually do). Read it defensively so
// the franchise filter can appear when the data actually supports it, without
// assuming a specific field name.
function extractFranchise(obj: object): { franchiseId?: string; franchiseName?: string } {
  const o = obj as Record<string, unknown>;
  const id = o.franchiseId ?? o.branchId;
  const name = o.franchiseName ?? o.franchise ?? o.branch;
  return {
    franchiseId: typeof id === "string" ? id : undefined,
    franchiseName: typeof name === "string" ? name : undefined,
  };
}

function vehicleOf(entry: CarEntry): string {
  return normalizeVehicle(entry.vehicleNo || entry.vehicle || entry.vehicleNumber);
}

// estCompletion / date fields in this codebase are sometimes date-only
// ("YYYY-MM-DD") and sometimes full ISO datetimes (see workshop.service.ts's
// completeWork fallback). A date-only ETA is treated as due at end-of-day so a
// job isn't flagged delayed the moment its due date begins.
function parseEtaEndOfDay(eta?: string | null): Date | null {
  if (!eta) return null;
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(eta.trim());
  const parsed = new Date(isDateOnly ? `${eta.trim()}T23:59:59` : eta);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function latestNonCancelledInvoice(
  invoices: BillingDocument[],
  vehicle: string,
  types: string[]
): BillingDocument | null {
  const matches = invoices
    .filter(
      (inv) =>
        normalizeVehicle(inv.vehicle) === vehicle &&
        inv.status !== "Cancelled" &&
        types.includes(inv.type)
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return matches[0] || null;
}

export function deriveLiveStatus(
  jobCards: JobCard[],
  checkIns: CarEntry[],
  outPasses: LiveOutPassInput[],
  invoices: BillingDocument[]
): LiveVehicleRecord[] {
  const now = new Date();
  const jobCardVehicles = new Set(jobCards.map((j) => normalizeVehicle(j.vehicle)));
  const outPassVehicles = new Set(outPasses.map((o) => normalizeVehicle(o.vehicle)));

  const records: LiveVehicleRecord[] = [];

  for (const job of jobCards) {
    if (TERMINAL_STATUSES.includes(job.status)) continue;
    const vehicle = normalizeVehicle(job.vehicle);

    let stage: LiveStage = STATUS_TO_STAGE_MAP[job.status] || "Unmapped";

    // Refine the generic "Billing" bucket using the latest invoice, mirroring the
    // status→billingStatus heuristic already used in BillingJobCards.tsx.
    if (stage === "Billing") {
      const invoice = latestNonCancelledInvoice(invoices, vehicle, ["Invoice"]);
      if (invoice) {
        if (invoice.status === "Paid") stage = "Ready for Delivery";
        else if (["Pending", "Overdue", "Partially Paid"].includes(invoice.status)) {
          stage = "Payment Pending";
        }
      }
    }

    // Outpass takes precedence over any billing state once it exists.
    if (outPassVehicles.has(vehicle)) stage = "Outpass Generated";

    const checkIn = checkIns.find((c) => vehicleOf(c) === vehicle);
    const eta = job.estCompletion;
    const etaDate = parseEtaEndOfDay(eta);
    const isDelayed = !!etaDate && now > etaDate;

    records.push({
      id: `job-${job.id}`,
      jobCardId: job.id,
      vehicle: job.vehicle,
      customer: job.customer,
      phone: job.phone || job.customerPhone,
      technician: job.technician,
      technicianId: job.technicianId,
      priority: job.priority || "Normal",
      stage,
      rawStatus: job.status,
      checkInTime: checkIn?.inTime || job.startDate,
      eta,
      isDelayed,
      delayMinutes: isDelayed && etaDate ? Math.floor((now.getTime() - etaDate.getTime()) / 60000) : undefined,
      jobCard: job,
      ...extractFranchise(job),
    });
  }

  // Vehicles checked in but with no job card yet — still "active" per spec 11.12.1
  // (workshop queue starts at check-in), refined with any standalone estimate.
  for (const entry of checkIns) {
    if (entry.outTime) continue;
    const vehicle = vehicleOf(entry);
    if (!vehicle || jobCardVehicles.has(vehicle)) continue;

    let stage: LiveStage = "Vehicle Check-In";
    const estimate = latestNonCancelledInvoice(invoices, vehicle, ["Estimate", "Quotation"]);
    if (estimate) {
      stage = ["Approved", "Converted"].includes(estimate.status)
        ? "Estimate Approved"
        : "Estimate Pending";
    }

    records.push({
      id: `checkin-${entry.id}`,
      vehicle: entry.vehicleNo || entry.vehicle || entry.vehicleNumber || "",
      customer: entry.customer,
      phone: entry.phone,
      technician: entry.technician,
      priority: "Normal",
      stage,
      rawStatus: entry.status,
      checkInTime: entry.inTime,
      isDelayed: false,
      ...extractFranchise(entry),
    });
  }

  return records;
}
