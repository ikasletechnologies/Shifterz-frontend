"use client";

import { Download } from "lucide-react";
import { LiveVehicleRecord } from "../types/live-status.types";
import { JobCard } from "@/modules/job-card/types/job-card.types";
import { downloadCSV, rowsToCSV } from "@/lib/csv";

function formatTime(value?: string): string {
  if (!value) return "";
  const d = new Date(value);
  return isNaN(d.getTime()) ? value : d.toLocaleString("en-US");
}

function statusOf(r: LiveVehicleRecord): string {
  return r.isDelayed ? `Delayed (${r.delayMinutes ?? 0}m)` : "On Track";
}

function todayStamp(): string {
  return new Date().toISOString().split("T")[0];
}

function exportLiveWorkshopStatus(records: LiveVehicleRecord[]) {
  const rows = records.map((r) => [
    r.vehicle,
    r.customer,
    r.jobCardId || "",
    r.technician || "Unassigned",
    r.stage,
    r.priority,
    formatTime(r.checkInTime),
    formatTime(r.eta),
    statusOf(r),
  ]);
  const csv = rowsToCSV(
    ["Vehicle", "Customer", "Job Card #", "Assigned To", "Stage", "Priority", "Check-In", "ETA", "Status"],
    rows
  );
  downloadCSV(csv, `Live_Workshop_Status_${todayStamp()}.csv`);
}

function exportDelayedVehicles(records: LiveVehicleRecord[]) {
  const rows = records
    .filter((r) => r.isDelayed)
    .map((r) => [r.vehicle, r.customer, r.jobCardId || "", r.technician || "Unassigned", r.stage, `${r.delayMinutes ?? 0}m`]);
  const csv = rowsToCSV(["Vehicle", "Customer", "Job Card #", "Assigned To", "Stage", "Delay"], rows);
  downloadCSV(csv, `Delayed_Vehicle_Report_${todayStamp()}.csv`);
}

function exportReadyForDelivery(records: LiveVehicleRecord[]) {
  const rows = records
    .filter((r) => r.stage === "Ready for Delivery" || r.stage === "Outpass Generated")
    .map((r) => [r.vehicle, r.customer, r.jobCardId || "", r.technician || "Unassigned", r.stage]);
  const csv = rowsToCSV(["Vehicle", "Customer", "Job Card #", "Assigned To", "Stage"], rows);
  downloadCSV(csv, `Ready_For_Delivery_${todayStamp()}.csv`);
}

function exportEmployeeWorkload(records: LiveVehicleRecord[]) {
  const counts = new Map<string, number>();
  records.forEach((r) => {
    const name = r.technician || "Unassigned";
    counts.set(name, (counts.get(name) || 0) + 1);
  });
  const rows = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  const csv = rowsToCSV(["Employee", "Active Vehicles"], rows);
  downloadCSV(csv, `Employee_Workload_${todayStamp()}.csv`);
}

function exportAvgTurnaround(jobCards: JobCard[]) {
  const completed = jobCards.filter(
    (j) => ["Delivered", "Out", "Delivery"].includes(j.status) && j.startDate && j.actualCompletion
  );
  const durationsHrs = completed
    .map((j) => (new Date(j.actualCompletion).getTime() - new Date(j.startDate).getTime()) / 3_600_000)
    .filter((h) => isFinite(h) && h >= 0);
  const avg = durationsHrs.length ? durationsHrs.reduce((a, b) => a + b, 0) / durationsHrs.length : 0;

  const rows = completed.map((j) => [
    j.vehicle,
    j.customer,
    j.startDate,
    j.actualCompletion,
    (((new Date(j.actualCompletion).getTime() - new Date(j.startDate).getTime()) / 3_600_000) || 0).toFixed(1),
  ]);
  rows.push(["", "", "", "Average Turnaround (hrs)", avg.toFixed(1)]);

  const csv = rowsToCSV(["Vehicle", "Customer", "Start Date", "Delivered Date", "Turnaround (hrs)"], rows);
  downloadCSV(csv, `Avg_Turnaround_Report_${todayStamp()}.csv`);
}

interface LiveStatusReportsProps {
  records: LiveVehicleRecord[];
  allJobCards: JobCard[];
}

export function LiveStatusReports({ records, allJobCards }: LiveStatusReportsProps) {
  const buttons: { label: string; onClick: () => void }[] = [
    { label: "Live Workshop Status", onClick: () => exportLiveWorkshopStatus(records) },
    { label: "Delayed Vehicle Report", onClick: () => exportDelayedVehicles(records) },
    { label: "Ready for Delivery", onClick: () => exportReadyForDelivery(records) },
    { label: "Employee Workload", onClick: () => exportEmployeeWorkload(records) },
    { label: "Avg Turnaround", onClick: () => exportAvgTurnaround(allJobCards) },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {buttons.map((b) => (
        <button
          key={b.label}
          onClick={b.onClick}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          {b.label}
        </button>
      ))}
    </div>
  );
}
