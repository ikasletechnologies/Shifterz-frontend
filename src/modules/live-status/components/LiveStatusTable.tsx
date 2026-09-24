"use client";

import { Download, Eye, Pencil } from "lucide-react";
import { LiveVehicleRecord } from "../types/live-status.types";
import { StageBadge } from "./StageBadge";
import { LivePriorityBadge } from "./LivePriorityBadge";
import { DelayBadge } from "./DelayBadge";

function formatTime(value?: string): string {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface LiveStatusTableProps {
  records: LiveVehicleRecord[];
  onOpenJobCard: (record: LiveVehicleRecord) => void;
  onEditJobCard: (record: LiveVehicleRecord) => void;
  onPrintJobCard: (record: LiveVehicleRecord) => void;
}

export function LiveStatusTable({ records, onOpenJobCard, onEditJobCard, onPrintJobCard }: LiveStatusTableProps) {
  if (records.length === 0) {
    return <div className="p-10 text-center text-slate-500 bg-white rounded-lg border border-slate-200">No active vehicles match these filters.</div>;
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
      <table className="data-table w-full min-w-[1100px] text-left">
        <thead>
          <tr>
            <th>Vehicle Number</th>
            <th>Customer</th>
            <th>Job Card #</th>
            <th>Assigned To</th>
            <th>Stage</th>
            <th>Priority</th>
            <th>Delay</th>
            <th>Check-In</th>
            <th>ETA</th>
            <th className="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r) => (
            <tr key={r.id}>
              <td className="whitespace-nowrap uppercase">{r.vehicle || "—"}</td>
              <td className="max-w-[180px] truncate">{r.customer || "Walk-in"}</td>
              <td className="whitespace-nowrap">{r.jobCardId || "—"}</td>
              <td className="max-w-[160px] truncate">
                {r.technician || <span className="text-slate-400">Unassigned</span>}
              </td>
              <td className="whitespace-nowrap">
                <StageBadge stage={r.stage} />
              </td>
              <td className="whitespace-nowrap">
                <LivePriorityBadge priority={r.priority} />
              </td>
              <td className="whitespace-nowrap">
                <DelayBadge isDelayed={r.isDelayed} delayMinutes={r.delayMinutes} />
              </td>
              <td className="whitespace-nowrap">{formatTime(r.checkInTime)}</td>
              <td className="whitespace-nowrap">{formatTime(r.eta)}</td>
              <td className="whitespace-nowrap">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => onOpenJobCard(r)}
                    disabled={!r.jobCard}
                    className="p-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
                    title={r.jobCard ? "Open Job Card" : "No job card yet"}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onEditJobCard(r)}
                    disabled={!r.jobCard}
                    className="p-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
                    title={r.jobCard ? "Assign Employee / Update Status" : "No job card yet"}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onPrintJobCard(r)}
                    disabled={!r.jobCard}
                    className="p-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
                    title={r.jobCard ? "Download Job Card" : "No job card yet"}
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
