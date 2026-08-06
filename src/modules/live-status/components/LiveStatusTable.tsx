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
    return <div className="p-10 text-center text-gray-400 bg-white rounded-xl border border-gray-100">No active vehicles match these filters.</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {records.map((r) => (
        <div
          key={r.id}
          className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4 relative group"
        >
          <div>
            {/* Card Header: Vehicle No & Actions */}
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase font-mono">
                  {r.vehicle || "—"}
                </h3>
                <p className="text-xs text-slate-500 font-medium">{r.customer || "Walk-in"}</p>
              </div>
              <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
                <button
                  onClick={() => onOpenJobCard(r)}
                  disabled={!r.jobCard}
                  className="p-1.5 rounded-lg hover:bg-slate-200/60 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title={r.jobCard ? "Open Job Card" : "No job card yet"}
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onEditJobCard(r)}
                  disabled={!r.jobCard}
                  className="p-1.5 rounded-lg hover:bg-slate-200/60 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title={r.jobCard ? "Assign Employee / Update Status" : "No job card yet"}
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onPrintJobCard(r)}
                  disabled={!r.jobCard}
                  className="p-1.5 rounded-lg hover:bg-slate-200/60 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title={r.jobCard ? "Download Job Card" : "No job card yet"}
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Badges Row: Stage & Priority & Delay */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <StageBadge stage={r.stage} />
              <LivePriorityBadge priority={r.priority} />
              <DelayBadge isDelayed={r.isDelayed} delayMinutes={r.delayMinutes} />
            </div>

            <div className="border-b border-slate-100 my-3" />

            {/* Sub-info grid: Job Card # & Assigned To */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 font-medium block text-[11px]">Job Card #</span>
                <span className="font-mono font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/50 inline-block mt-0.5">
                  {r.jobCardId || "—"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block text-[11px]">Assigned To</span>
                <span className="font-bold text-slate-800 mt-0.5 block truncate">
                  {r.technician || "Unassigned"}
                </span>
              </div>
            </div>

            <div className="border-b border-slate-100 my-3" />

            {/* Check-In & ETA */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 font-medium block text-[11px]">Check-In</span>
                <span className="font-semibold text-slate-700 mt-0.5 block">
                  {formatTime(r.checkInTime)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block text-[11px]">ETA</span>
                <span className="font-semibold text-slate-700 mt-0.5 block">
                  {formatTime(r.eta)}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
