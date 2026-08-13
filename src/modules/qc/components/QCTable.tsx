"use client";

import { QCJob } from "../types/qc.types";
import { QC_STATUS_COLORS } from "../constants/qc.constants";
import {
  ClipboardCheck,
  Camera,
  MessageSquare,
  CheckCircle2,
  XCircle,
  RefreshCw,
  PlayCircle,
  Car,
  Wrench,
  User,
  Phone,
  Calendar,
  FileText,
  Eye,
} from "lucide-react";

interface QCTableProps {
  jobs: QCJob[];
  onInspect: (job: QCJob) => void;
  onOpenChecklist: (job: QCJob) => void;
  onOpenPhotos: (job: QCJob) => void;
  onOpenRemarks: (job: QCJob) => void;
  onPass: (job: QCJob) => void;
  onFail: (job: QCJob) => void;
  onRework: (job: QCJob) => void;
}

function StatusBadge({ status }: { status: string }) {
  const color = QC_STATUS_COLORS[status] || "bg-gray-100 text-gray-600";
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap ${color}`}>
      {status}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, string> = {
    High: "bg-red-100 text-red-700",
    Normal: "bg-blue-100 text-blue-700",
    Low: "bg-green-100 text-green-700",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${map[priority] || "bg-gray-100 text-gray-600"}`}>
      {priority}
    </span>
  );
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "03 Aug 2026";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(dateStr?: string): string {
  if (!dateStr) return "03 Aug 2026, 02:38 PM";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function QCTable({
  jobs,
  onInspect,
  onOpenChecklist,
  onOpenPhotos,
  onOpenRemarks,
  onPass,
  onFail,
  onRework,
}: QCTableProps) {
  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-sm">
        <ClipboardCheck className="w-12 h-12 mb-3 opacity-30 text-yellow-500" />
        <p className="font-semibold text-gray-700">No jobs in QC queue</p>
        <p className="text-sm text-gray-400 mt-1">Jobs sent from Workshop will appear here</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {jobs.map((job) => (
        <div
          key={job.id}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold font-mono text-gray-900 tracking-tight">{job.id}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge status={job.status} />
                  <PriorityBadge priority={job.priority} />
                </div>
              </div>
            </div>

            {/* Vehicle Section */}
            <div className="flex items-center gap-3 pt-1">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                <Car className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Vehicle No</p>
                <p className="text-base font-bold font-mono text-slate-900 tracking-wider uppercase">
                  {job.vehicle || "TN 13 AR 1342"}
                </p>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Row 1: Fault + Assigned Technician */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-1.5 text-gray-400 text-xs font-medium mb-1">
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Fault</span>
                </div>
                <p className="text-sm font-bold text-gray-900 line-clamp-1">
                  {job.service || "PPF Full Body"}
                </p>
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-gray-400 text-xs font-medium mb-1">
                  <User className="w-3.5 h-3.5" />
                  <span>Assigned Technician</span>
                </div>
                <span className="inline-block px-3 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-100">
                  {job.technician || "Technician 1"}
                </span>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Row 2: Customer + Mobile */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-1.5 text-gray-400 text-xs font-medium mb-1">
                  <User className="w-3.5 h-3.5" />
                  <span>Customer</span>
                </div>
                <p className="text-sm font-bold text-gray-900 line-clamp-1">{job.customer || "askkkf"}</p>
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-gray-400 text-xs font-medium mb-1">
                  <Phone className="w-3.5 h-3.5" />
                  <span>Mobile</span>
                </div>
                <p className="text-sm font-bold text-blue-600">
                  {(job as any).phone || "4667577577"}
                </p>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Row 3: Started + Estimation */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-1.5 text-gray-400 text-xs font-medium mb-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Started</span>
                </div>
                <p className="text-sm font-bold text-gray-900">
                  {formatDate(job.receivedAt)}
                </p>
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-gray-400 text-xs font-medium mb-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Estimation</span>
                </div>
                <p className="text-sm font-bold text-gray-900">
                  {formatDate(job.estCompletion || job.receivedAt)}
                </p>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Row 4: Notes */}
            <div>
              <div className="flex items-center gap-1.5 text-gray-400 text-xs font-medium mb-1">
                <FileText className="w-3.5 h-3.5" />
                <span>Notes</span>
              </div>
              <p className="text-xs text-gray-600 font-medium">
                {job.qcNotes || job.notes || "Auto-created from check-in"}
              </p>
            </div>

            {/* Bottom Mint Banner: RECEIVED ON */}
            <div className="bg-emerald-50/80 border border-emerald-200/60 rounded-xl p-3 flex items-center gap-3">
              <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                  RECEIVED ON
                </p>
                <p className="text-xs font-bold text-emerald-950">
                  {formatDateTime(job.receivedAt)}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons Section */}
          <div className="pt-4 border-t border-gray-100 mt-4 flex items-center gap-2 flex-wrap">
            {/* WAITING QC / COMPLETED / WORK COMPLETED / QC PENDING: action is to begin inspection */}
            {((job.status as string) === "Waiting QC" ||
              (job.status as string) === "Completed" ||
              (job.status as string) === "Work Completed" ||
              (job.status as string) === "QC Pending") && (
              <button
                type="button"
                onClick={() => onInspect(job)}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm cursor-pointer"
              >
                <PlayCircle className="w-4 h-4" /> Start Inspection
              </button>
            )}

            {/* INSPECTING: checklist + photos + remarks + pass/fail */}
            {job.status === "Inspecting" && (
              <div className="w-full space-y-2">
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => onOpenChecklist(job)}
                    className="flex items-center justify-center gap-1 px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    <ClipboardCheck className="w-3.5 h-3.5" /> Checklist
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenPhotos(job)}
                    className="flex items-center justify-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                    title="Upload QC Photos"
                  >
                    <Camera className="w-3.5 h-3.5" /> Photos
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenRemarks(job)}
                    className="flex items-center justify-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                    title="Add Remarks"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Remarks
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onPass(job)}
                    className="flex items-center justify-center gap-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Pass QC
                  </button>
                  <button
                    type="button"
                    onClick={() => onFail(job)}
                    className="flex items-center justify-center gap-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" /> Fail QC
                  </button>
                </div>
              </div>
            )}

            {/* QC FAILED: only action is to send for rework */}
            {job.status === "QC Failed" && (
              <button
                type="button"
                onClick={() => onRework(job)}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition-colors shadow-sm cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" /> Send for Rework
              </button>
            )}

            {/* Terminal states: read-only */}
            {(job.status === "QC Passed" || job.status === "Ready For Billing" || job.status === "Rework") && (
              <div className="w-full py-1.5 text-center text-xs text-gray-500 font-semibold bg-gray-50 rounded-lg border border-gray-100">
                {job.status === "Rework" ? "Awaiting Workshop Rework" : "QC Completed"}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
