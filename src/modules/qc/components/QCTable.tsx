"use client";

import { QCJob, QCInspection } from "../types/qc.types";
import { QC_STATUS_COLORS } from "../constants/qc.constants";
import { getCurrentUser } from "@/lib/franchise-scope";
import {
  ClipboardCheck,
  Camera,
  MessageSquare,
  CheckCircle2,
  XCircle,
  PlayCircle,
  Car,
  Wrench,
  User,
  Phone,
  Calendar,
  FileText,
  History,
  Lock,
} from "lucide-react";

interface QCTableProps {
  jobs: QCJob[];
  hasOpenInspection: (jobId: string) => boolean;
  getCurrentInspection: (jobId: string) => QCInspection | undefined;
  onInspect: (job: QCJob) => void;
  onOpenChecklist: (job: QCJob) => void;
  onOpenPhotos: (job: QCJob) => void;
  onOpenRemarks: (job: QCJob) => void;
  onPass: (job: QCJob) => void;
  onFail: (job: QCJob) => void;
}

// Statuses from which a job can be lazy-started/re-started into a QC attempt.
// Includes the legacy strings alongside the real ones the backend actually
// writes ("Waiting for Quality Check", "Rework Required") so older/manually
// seeded data still gets a working action button.
const STARTABLE_STATUSES = [
  "Waiting for Quality Check",
  "Rework Required",
  "Waiting QC",
  "Completed",
  "Work Completed",
  "QC Pending",
];

const TERMINAL_STATUSES = ["Ready For Billing", "QC Passed"];

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
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(dateStr?: string): string {
  if (!dateStr) return "—";
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
  hasOpenInspection,
  getCurrentInspection,
  onInspect,
  onOpenChecklist,
  onOpenPhotos,
  onOpenRemarks,
  onPass,
  onFail,
}: QCTableProps) {
  // Phase 4B-3-B — QC Inspector Ownership. UX-only: the backend is the
  // authoritative enforcement point (QcService.assertInspectionOwner), this
  // just avoids presenting edit controls the backend would reject anyway,
  // using ownership info (QCInspection.inspectorId/inspectorName) already
  // present in every inspection payload.
  const currentUserId = getCurrentUser()?.id;

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
      {jobs.map((job) => {
        const open = hasOpenInspection(job.id);
        const current = getCurrentInspection(job.id);
        const priorAttempts = current ? current.attemptNumber - 1 : 0;
        // A missing currentUserId (couldn't resolve the session) never locks
        // the UI — the backend remains the real gate either way.
        const isOwner = !current?.inspectorId || !currentUserId || current.inspectorId === currentUserId;

        return (
          <div
            key={job.id}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold font-mono text-gray-900 tracking-tight">{job.id}</h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <StatusBadge status={job.status} />
                    <PriorityBadge priority={job.priority} />
                    {open && current && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                        Attempt {current.attemptNumber}
                      </span>
                    )}
                    {open && current && !isOwner && (
                      <span
                        className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500"
                        title="Only the assigned inspector can edit this attempt"
                      >
                        <Lock className="w-2.5 h-2.5" />
                        Owned by {current.inspectorName || "another inspector"}
                      </span>
                    )}
                  </div>
                  {priorAttempts > 0 && (
                    <div className="flex items-center gap-1 mt-1.5 text-[10px] text-gray-400 font-medium">
                      <History className="w-3 h-3" />
                      <span>{priorAttempts} prior attempt{priorAttempts !== 1 ? "s" : ""} on record</span>
                    </div>
                  )}
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
                    {job.vehicle}
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
                    {job.service}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-1.5 text-gray-400 text-xs font-medium mb-1">
                    <User className="w-3.5 h-3.5" />
                    <span>Assigned Technician</span>
                  </div>
                  <span className="inline-block px-3 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-100">
                    {job.technician || "Unassigned"}
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
                  <p className="text-sm font-bold text-gray-900 line-clamp-1">{job.customer}</p>
                </div>

                <div>
                  <div className="flex items-center gap-1.5 text-gray-400 text-xs font-medium mb-1">
                    <Phone className="w-3.5 h-3.5" />
                    <span>Mobile</span>
                  </div>
                  <p className="text-sm font-bold text-blue-600">
                    {(job as any).phone || "—"}
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
                  {job.qcNotes || job.notes || "—"}
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
              {/* No open attempt yet: begin (or resume/re-start after rework) inspection */}
              {!open && STARTABLE_STATUSES.includes(job.status as string) && (
                <button
                  type="button"
                  onClick={() => onInspect(job)}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm cursor-pointer"
                >
                  <PlayCircle className="w-4 h-4" />
                  {priorAttempts > 0 || job.status === "Rework Required" ? "Start Next Attempt" : "Start Inspection"}
                </button>
              )}

              {/* Open attempt in progress: checklist + photos + remarks + pass/fail */}
              {open && (
                <div className="w-full space-y-2">
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      disabled={!isOwner}
                      onClick={() => onOpenChecklist(job)}
                      title={!isOwner ? "Only the assigned inspector can edit this attempt" : undefined}
                      className="flex items-center justify-center gap-1 px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 text-xs font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-gray-100"
                    >
                      <ClipboardCheck className="w-3.5 h-3.5" /> Checklist
                    </button>
                    <button
                      type="button"
                      disabled={!isOwner}
                      onClick={() => onOpenPhotos(job)}
                      title={!isOwner ? "Only the assigned inspector can edit this attempt" : "Upload QC Photos"}
                      className="flex items-center justify-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-emerald-50"
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
                      disabled={!isOwner}
                      onClick={() => onPass(job)}
                      title={!isOwner ? "Only the assigned inspector can record a decision" : undefined}
                      className="flex items-center justify-center gap-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-green-600"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Pass QC
                    </button>
                    <button
                      type="button"
                      disabled={!isOwner}
                      onClick={() => onFail(job)}
                      title={!isOwner ? "Only the assigned inspector can record a decision" : undefined}
                      className="flex items-center justify-center gap-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-red-600"
                    >
                      <XCircle className="w-4 h-4" /> Fail QC
                    </button>
                  </div>
                </div>
              )}

              {/* Terminal states: read-only */}
              {!open && TERMINAL_STATUSES.includes(job.status as string) && (
                <div className="w-full py-1.5 text-center text-xs text-gray-500 font-semibold bg-gray-50 rounded-lg border border-gray-100">
                  QC Completed
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
