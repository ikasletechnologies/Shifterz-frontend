"use client";

import { Eye, Pencil, Phone, Printer } from "lucide-react";
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
    return <div className="p-10 text-center text-gray-400 bg-white rounded-xl border border-gray-100">No active vehicles match these filters.</div>;
  }

  return (
    <div className="overflow-x-auto bg-white rounded-xl border border-gray-100 shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            <th className="px-4 py-3">Vehicle</th>
            <th className="px-4 py-3">Customer</th>
            <th className="px-4 py-3">Job Card #</th>
            <th className="px-4 py-3">Assigned To</th>
            <th className="px-4 py-3">Stage</th>
            <th className="px-4 py-3">Priority</th>
            <th className="px-4 py-3">Check-In</th>
            <th className="px-4 py-3">ETA</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r) => (
            <tr key={r.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60">
              <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">{r.vehicle || "—"}</td>
              <td className="px-4 py-3 text-gray-700">{r.customer || "—"}</td>
              <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{r.jobCardId || "—"}</td>
              <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{r.technician || "Unassigned"}</td>
              <td className="px-4 py-3">
                <StageBadge stage={r.stage} />
              </td>
              <td className="px-4 py-3">
                <LivePriorityBadge priority={r.priority} />
              </td>
              <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatTime(r.checkInTime)}</td>
              <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatTime(r.eta)}</td>
              <td className="px-4 py-3">
                <DelayBadge isDelayed={r.isDelayed} delayMinutes={r.delayMinutes} />
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  {r.phone && (
                    <a
                      href={`tel:${r.phone}`}
                      className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
                      title="Contact Customer"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  )}
                  <button
                    onClick={() => onOpenJobCard(r)}
                    disabled={!r.jobCard}
                    className="p-1.5 rounded hover:bg-gray-100 text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed"
                    title={r.jobCard ? "Open Job Card" : "No job card yet"}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onEditJobCard(r)}
                    disabled={!r.jobCard}
                    className="p-1.5 rounded hover:bg-gray-100 text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed"
                    title={r.jobCard ? "Assign Employee / Update Status" : "No job card yet"}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onPrintJobCard(r)}
                    disabled={!r.jobCard}
                    className="p-1.5 rounded hover:bg-gray-100 text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed"
                    title={r.jobCard ? "Print Job Card" : "No job card yet"}
                  >
                    <Printer className="w-4 h-4" />
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
