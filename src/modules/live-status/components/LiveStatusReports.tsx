"use client";

import { Download } from "lucide-react";
import { LiveVehicleRecord } from "../types/live-status.types";
import { JobCard } from "@/modules/job-card/types/job-card.types";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
  const doc = new jsPDF();
  const rows = records.map((r) => [
    r.vehicle || "",
    r.customer || "",
    r.jobCardId || "",
    r.technician || "Unassigned",
    r.stage || "",
    r.priority || "",
    formatTime(r.checkInTime),
    formatTime(r.eta),
    statusOf(r),
  ]);
  
  doc.setFontSize(16);
  doc.text("Live Workshop Status", 14, 15);
  doc.setFontSize(10);
  doc.text(`Generated: ${formatTime(new Date().toISOString())}`, 14, 22);

  autoTable(doc, {
    startY: 25,
    head: [["Vehicle", "Customer", "Job Card #", "Assigned To", "Stage", "Priority", "Check-In", "ETA", "Status"]],
    body: rows,
    styles: { fontSize: 8 },
  });

  doc.save(`Live_Workshop_Status_${todayStamp()}.pdf`);
}

function exportDelayedVehicles(records: LiveVehicleRecord[]) {
  const doc = new jsPDF();
  const rows = records
    .filter((r) => r.isDelayed)
    .map((r) => [
      r.vehicle || "", 
      r.customer || "", 
      r.jobCardId || "", 
      r.technician || "Unassigned", 
      r.stage || "", 
      `${r.delayMinutes ?? 0}m`
    ]);
    
  doc.setFontSize(16);
  doc.text("Delayed Vehicle Report", 14, 15);
  doc.setFontSize(10);
  doc.text(`Generated: ${formatTime(new Date().toISOString())}`, 14, 22);

  autoTable(doc, {
    startY: 25,
    head: [["Vehicle", "Customer", "Job Card #", "Assigned To", "Stage", "Delay"]],
    body: rows,
    styles: { fontSize: 9 },
  });

  doc.save(`Delayed_Vehicle_Report_${todayStamp()}.pdf`);
}

function exportReadyForDelivery(records: LiveVehicleRecord[]) {
  const doc = new jsPDF();
  const rows = records
    .filter((r) => r.stage === "Ready for Delivery" || r.stage === "Outpass Generated")
    .map((r) => [r.vehicle || "", r.customer || "", r.jobCardId || "", r.technician || "Unassigned", r.stage || ""]);
    
  doc.setFontSize(16);
  doc.text("Ready for Delivery Report", 14, 15);
  doc.setFontSize(10);
  doc.text(`Generated: ${formatTime(new Date().toISOString())}`, 14, 22);

  autoTable(doc, {
    startY: 25,
    head: [["Vehicle", "Customer", "Job Card #", "Assigned To", "Stage"]],
    body: rows,
    styles: { fontSize: 9 },
  });

  doc.save(`Ready_For_Delivery_${todayStamp()}.pdf`);
}

function exportEmployeeWorkload(records: LiveVehicleRecord[]) {
  const counts = new Map<string, number>();
  records.forEach((r) => {
    const name = r.technician || "Unassigned";
    counts.set(name, (counts.get(name) || 0) + 1);
  });
  const rows = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => [name, count.toString()]);
    
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("Employee Workload Report", 14, 15);
  doc.setFontSize(10);
  doc.text(`Generated: ${formatTime(new Date().toISOString())}`, 14, 22);

  autoTable(doc, {
    startY: 25,
    head: [["Employee", "Active Vehicles"]],
    body: rows,
    styles: { fontSize: 10 },
  });

  doc.save(`Employee_Workload_${todayStamp()}.pdf`);
}

function exportAvgTurnaround(jobCards: JobCard[]) {
  const completed = jobCards.filter(
    (j) => ["Delivered", "Out", "Delivery"].includes(j.status) && j.startDate && j.actualCompletion
  );
  const durationsHrs = completed
    .map((j) => (new Date(j.actualCompletion as string).getTime() - new Date(j.startDate as string).getTime()) / 3_600_000)
    .filter((h) => isFinite(h) && h >= 0);
  const avg = durationsHrs.length ? durationsHrs.reduce((a, b) => a + b, 0) / durationsHrs.length : 0;

  const rows = completed.map((j) => [
    j.vehicle || "",
    j.customer || "",
    formatTime(j.startDate),
    formatTime(j.actualCompletion),
    (((new Date(j.actualCompletion as string).getTime() - new Date(j.startDate as string).getTime()) / 3_600_000) || 0).toFixed(1),
  ]);
  rows.push(["", "", "", "Average Turnaround (hrs)", avg.toFixed(1)]);

  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("Average Turnaround Report", 14, 15);
  doc.setFontSize(10);
  doc.text(`Generated: ${formatTime(new Date().toISOString())}`, 14, 22);

  autoTable(doc, {
    startY: 25,
    head: [["Vehicle", "Customer", "Start Date", "Delivered Date", "Turnaround (hrs)"]],
    body: rows,
    styles: { fontSize: 9 },
  });

  doc.save(`Avg_Turnaround_Report_${todayStamp()}.pdf`);
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
