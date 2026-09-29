"use client";

import { Copy, ClipboardList, CheckCircle2, XCircle, UserCheck, Play, Camera, ListChecks, MessageSquare } from "lucide-react";
import { toast } from "react-hot-toast";
import { QCJob, QCInspection } from "../types/qc.types";
import { getCurrentUser, isHQRole } from "@/lib/franchise-scope";
import { StatusText } from "@/components/common/StatusText";

interface QCTableProps {
  jobs: QCJob[];
  emptyMessage?: string;
  hasOpenInspection: (jobId: string) => boolean;
  getCurrentInspection: (jobId: string) => QCInspection | undefined;
  onInspect: (job: QCJob) => void;
  onOpenChecklist: (job: QCJob) => void;
  onOpenPhotos: (job: QCJob) => void;
  onOpenRemarks: (job: QCJob) => void;
  onPass: (job: QCJob) => void;
  onFail: (job: QCJob) => void;
  // Management (Super Admin etc.) can assign an inspector or decide directly.
  canManage?: boolean;
  onAssign?: (job: QCJob) => void;
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
  emptyMessage = "No jobs in QC queue",
  hasOpenInspection,
  getCurrentInspection,
  onInspect,
  onOpenChecklist,
  onOpenPhotos,
  onOpenRemarks,
  onPass,
  onFail,
  canManage = false,
  onAssign,
}: QCTableProps) {
  // Phase 4B-3-B — QC Inspector Ownership. UX-only: the backend is the
  // authoritative enforcement point (QcService.assertInspectionOwner), this
  // just avoids presenting edit controls the backend would reject anyway,
  // using ownership info (QCInspection.inspectorId/inspectorName) already
  // present in every inspection payload.
  const currentUser = getCurrentUser();
  const currentUserId = currentUser?.id;
  const isManagementOverride = isHQRole(currentUser?.role);

  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    toast.success(`Copied Job ID: ${id}`);
  };

  const getPriorityBadgeClass = (priority?: string) => {
    const p = (priority || "").toLowerCase();
    if (p === "high") return "bg-red-100 text-red-700";
    if (p === "low") return "bg-green-100 text-green-700";
    return "bg-blue-100 text-blue-700";
  };

  if (jobs.length === 0) {
    return (
      <div className="py-16 text-center text-slate-500 bg-white rounded-xl border border-slate-200 shadow-xs">
        <ClipboardList className="w-10 h-10 mx-auto text-slate-300 mb-3" />
        <p className="text-sm font-medium text-slate-700">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl shadow-xs overflow-x-auto">
      <table className="data-table w-full min-w-[1400px] text-left text-xs">
        <thead>
          <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
            <th className="px-4 py-3">Job ID</th>
            <th className="px-4 py-3">Vehicle Number</th>
            <th className="px-4 py-3">Customer</th>
            <th className="px-4 py-3">Mobile</th>
            <th className="px-4 py-3">Fault</th>
            <th className="px-4 py-3">Technician</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Priority</th>
            <th className="px-4 py-3">Attempt</th>
            <th className="px-4 py-3">Received On</th>
            <th className="px-4 py-3">Est. Completion</th>
            <th className="px-4 py-3">Notes</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => {
            const open = hasOpenInspection(job.id);
            const current = getCurrentInspection(job.id);
            const priorAttempts = current ? current.attemptNumber - 1 : 0;
            // A missing currentUserId (couldn't resolve the session) never locks
            // the UI — the backend remains the real gate either way. Superadmin/HQ
            // can take over any inspector's attempt (management override).
            const isOwner = isManagementOverride || !current?.inspectorId || !currentUserId || current.inspectorId === currentUserId;
            const notOwnerTitle = "Only the assigned inspector can edit this attempt";

            return (
              <tr key={job.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100 last:border-b-0">
                <td className="whitespace-nowrap px-4 py-3.5">
                  <button
                    type="button"
                    onClick={(e) => handleCopyId(job.id, e)}
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 hover:bg-yellow-100 text-slate-800 text-xs font-mono font-bold transition-colors cursor-pointer group"
                    title="Click to copy Job ID"
                  >
                    <span>{job.id}</span>
                    <Copy className="w-3 h-3 text-slate-400 group-hover:text-slate-700 transition-colors" />
                  </button>
                </td>
                <td className="whitespace-nowrap px-4 py-3.5">
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-900 bg-slate-50 border border-slate-200/80 px-2 py-0.5 rounded">
                    {job.vehicle}
                  </span>
                </td>
                <td className="max-w-[180px] truncate px-4 py-3.5 font-medium text-slate-800">{job.customer}</td>
                <td className="whitespace-nowrap px-4 py-3.5 text-slate-600">{(job as any).phone || "—"}</td>
                <td className="max-w-[180px] truncate px-4 py-3.5 font-medium text-slate-800" title={job.service}>{job.service}</td>
                <td className="max-w-[160px] truncate px-4 py-3.5 text-slate-600">
                  {job.technician ? (
                    <span className="font-medium text-slate-800 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60" title={job.technician}>
                      {job.technician}
                    </span>
                  ) : (
                    <span className="text-slate-400">Unassigned</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3.5">
                  <StatusText status={job.status} />
                </td>
                <td className="whitespace-nowrap px-4 py-3.5">
                  {job.priority ? (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getPriorityBadgeClass(job.priority)}`}>
                      {job.priority}
                    </span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3.5">
                  {open && current ? (
                    <div>
                      <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-[11px]">
                        Attempt {current.attemptNumber}
                      </span>
                      {!isOwner ? (
                        <span className="block text-[11px] text-slate-400 mt-0.5" title={notOwnerTitle}>
                          Owned by {current.inspectorName || "another inspector"}
                        </span>
                      ) : canManage && current.inspectorName ? (
                        <span className="block text-[11px] text-slate-400 mt-0.5">{current.inspectorName}</span>
                      ) : null}
                    </div>
                  ) : priorAttempts > 0 ? (
                    <span className="text-slate-500 font-medium">
                      {priorAttempts} prior attempt{priorAttempts !== 1 ? "s" : ""}
                    </span>
                  ) : (
                    <span className="text-slate-400">Attempt 1</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 text-slate-600">{formatDateTime(job.receivedAt)}</td>
                <td className="whitespace-nowrap px-4 py-3.5 text-slate-600">{formatDate(job.estCompletion || job.receivedAt)}</td>
                <td className="max-w-[200px] truncate px-4 py-3.5 text-slate-500 italic" title={job.qcNotes || job.notes}>
                  {job.qcNotes || job.notes || <span className="text-slate-400">—</span>}
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-2 flex-wrap">
                    {/* Management: assign an inspector, or pass/fail straight away */}
                    {!open && canManage && STARTABLE_STATUSES.includes(job.status as string) && (
                      <>
                        {onAssign && (
                          <button
                            type="button"
                            onClick={() => onAssign(job)}
                            className="px-2.5 py-1.5 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Assign</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onPass(job)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Pass QC</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onFail(job)}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Fail QC</span>
                        </button>
                      </>
                    )}

                    {/* No open attempt yet: begin (or resume/re-start after rework) inspection */}
                    {!open && !canManage && STARTABLE_STATUSES.includes(job.status as string) && (
                      <button
                        type="button"
                        onClick={() => onInspect(job)}
                        className="px-3 py-1.5 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>{priorAttempts > 0 || job.status === "Rework Required" ? "Start Next Attempt" : "Start Inspection"}</span>
                      </button>
                    )}

                    {/* Open attempt in progress: checklist + photos + remarks + pass/fail */}
                    {open && (
                      <>
                        <button
                          type="button"
                          disabled={!isOwner}
                          onClick={() => onOpenChecklist(job)}
                          title={!isOwner ? notOwnerTitle : undefined}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          <ListChecks className="w-3.5 h-3.5" />
                          <span>Checklist</span>
                        </button>
                        <button
                          type="button"
                          disabled={!isOwner}
                          onClick={() => onOpenPhotos(job)}
                          title={!isOwner ? notOwnerTitle : "Upload QC Photos"}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Photos</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenRemarks(job)}
                          title="Add Remarks"
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Remarks</span>
                        </button>
                        <button
                          type="button"
                          disabled={!isOwner}
                          onClick={() => onPass(job)}
                          title={!isOwner ? "Only the assigned inspector can record a decision" : undefined}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Pass QC</span>
                        </button>
                        <button
                          type="button"
                          disabled={!isOwner}
                          onClick={() => onFail(job)}
                          title={!isOwner ? "Only the assigned inspector can record a decision" : undefined}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Fail QC</span>
                        </button>
                      </>
                    )}

                    {/* Terminal states: read-only */}
                    {!open && TERMINAL_STATUSES.includes(job.status as string) && (
                      <span className="text-slate-400 text-xs italic">QC Completed</span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
