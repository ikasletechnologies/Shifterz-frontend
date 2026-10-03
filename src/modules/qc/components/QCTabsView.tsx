"use client";

import { useMemo } from "react";
import { Copy, User, Phone, CheckCircle2, XCircle, UserCheck, Play, Camera, ListChecks, MessageSquare, ClipboardList } from "lucide-react";
import { toast } from "react-hot-toast";
import { QCJob, QCInspection } from "../types/qc.types";
import { getCurrentUser, isHQRole } from "@/lib/franchise-scope";

interface QCTabsViewProps {
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
  canManage?: boolean;
  onAssign?: (job: QCJob) => void;
  activeTab?: string;
}

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

export function QCTabsView({
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
  activeTab = "All",
}: QCTabsViewProps) {
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

  const getQCStatusBadge = (status?: string) => {
    const s = (status || "").toLowerCase().trim();
    if (s.includes("rework") || s.includes("fail")) {
      return { label: "Rework Required", className: "bg-rose-100 text-rose-700 border border-rose-200/60" };
    }
    if (s.includes("inspect") || s === "in qc") {
      return { label: "Inspecting", className: "bg-blue-100 text-blue-700 border border-blue-200/60" };
    }
    if (s.includes("billing") || s.includes("pass")) {
      return {
        label: s.includes("billing") ? "Ready For Billing" : "QC Passed",
        className: s.includes("billing") ? "bg-teal-100 text-teal-800 border border-teal-200/60" : "bg-emerald-100 text-emerald-800 border border-emerald-200/60",
      };
    }
    return { label: "Waiting QC", className: "bg-yellow-100 text-yellow-800 border border-yellow-200/60" };
  };

  // Group jobs by canonical QC statuses:
  // 1. Awaiting Review
  // 2. Inspecting
  // 3. QC Passed
  // 4. Rework Required
  const statusGroups = useMemo(() => {
    const categories: {
      id: "Awaiting" | "Inspecting" | "Passed" | "Rework";
      label: string;
      dotColor: string;
      jobs: QCJob[];
    }[] = [
      { id: "Awaiting", label: "Awaiting Review", dotColor: "bg-amber-500", jobs: [] },
      { id: "Inspecting", label: "Inspecting", dotColor: "bg-blue-500", jobs: [] },
      { id: "Passed", label: "QC Passed", dotColor: "bg-emerald-500", jobs: [] },
      { id: "Rework", label: "Rework Required", dotColor: "bg-rose-500", jobs: [] },
    ];

    for (const job of jobs) {
      if (hasOpenInspection(job.id)) {
        categories.find((c) => c.id === "Inspecting")?.jobs.push(job);
      } else if (job.status === "Ready For Billing" || job.status === "QC Passed") {
        categories.find((c) => c.id === "Passed")?.jobs.push(job);
      } else if (job.status === "Rework Required" || job.status === "QC Failed" || job.status === "Rework") {
        categories.find((c) => c.id === "Rework")?.jobs.push(job);
      } else {
        categories.find((c) => c.id === "Awaiting")?.jobs.push(job);
      }
    }

    if (activeTab && activeTab !== "All") {
      return categories.filter((c) => c.id === activeTab);
    }

    return categories.filter((c) => c.jobs.length > 0);
  }, [jobs, hasOpenInspection, activeTab]);

  if (jobs.length === 0) {
    return (
      <div className="py-16 text-center text-slate-500 bg-white rounded-xl border border-slate-200 shadow-xs">
        <ClipboardList className="w-10 h-10 mx-auto text-slate-300 mb-3" />
        <p className="text-sm font-medium text-slate-700">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {statusGroups.map((group) => (
        <div key={group.id} className="space-y-3.5">
          {/* Status Section Header */}
          <div className="flex items-center justify-between gap-3 pb-2 border-b border-gray-200/80">
            <div className="flex items-center gap-2.5">
              <span className={`w-2.5 h-2.5 rounded-full ${group.dotColor}`} />
              <h3 className="text-sm sm:text-base font-bold text-gray-900">
                {group.label}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
                {group.jobs.length}
              </span>
            </div>
          </div>

          {/* Jobs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {group.jobs.map((job) => {
              const open = hasOpenInspection(job.id);
              const current = getCurrentInspection(job.id);
              const priorAttempts = current ? current.attemptNumber - 1 : 0;
              const isOwner =
                isManagementOverride ||
                !current?.inspectorId ||
                !currentUserId ||
                current.inspectorId === currentUserId;
              const notOwnerTitle = "Only the assigned inspector can edit this attempt";
              const phone = (job as any).phone;

              return (
                <div
                  key={job.id}
                  className="bg-white rounded-xl border border-gray-200/90 shadow-xs hover:shadow-md hover:border-yellow-400 transition-all p-4 flex flex-col justify-between gap-3 overflow-hidden"
                >
                  <div className="space-y-2">
                    {/* Header: ID + Priority */}
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <button
                        type="button"
                        onClick={(e) => handleCopyId(job.id, e)}
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-gray-100 hover:bg-yellow-100 text-gray-800 text-xs font-mono font-bold transition-colors cursor-pointer group shrink-0"
                        title="Click to copy Job ID"
                      >
                        <span>{job.id}</span>
                        <Copy className="w-3 h-3 text-gray-400 group-hover:text-gray-700 transition-colors" />
                      </button>

                      {job.priority && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${getPriorityBadgeClass(job.priority)}`}>
                          {job.priority}
                        </span>
                      )}
                    </div>

                    {/* Vehicle & Status */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between gap-2 min-w-0">
                        <span
                          className="font-bold text-xs uppercase tracking-wider text-gray-900 bg-slate-50 border border-slate-200/80 px-2 py-0.5 rounded truncate min-w-0"
                          title={job.vehicle}
                        >
                          {job.vehicle}
                        </span>
                        {(() => {
                          const statusInfo = getQCStatusBadge(job.status);
                          return (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap shrink-0 ${statusInfo.className}`}
                              title={job.status || statusInfo.label}
                            >
                              {statusInfo.label}
                            </span>
                          );
                        })()}
                      </div>

                      {job.service && (
                        <div className="text-xs font-semibold text-gray-800 line-clamp-1" title={job.service}>
                          {job.service}
                        </div>
                      )}
                    </div>

                    {/* Customer & Mobile */}
                    <div className="text-xs text-gray-600 space-y-1 pt-1 border-t border-gray-100">
                      <div className="flex items-center gap-1.5 truncate font-medium text-gray-800">
                        <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate" title={job.customer}>{job.customer || "—"}</span>
                      </div>
                      {phone && (
                        <div className="flex items-center gap-1.5 text-gray-500">
                          <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span>{phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Technician & Attempt */}
                    <div className="space-y-1 pt-1 border-t border-gray-100 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-gray-500 text-[11px] font-medium">Technician:</span>
                        {job.technician ? (
                          <span className="font-medium text-gray-800 bg-gray-50 px-2 py-0.5 rounded border border-gray-200/60 truncate max-w-[130px]" title={job.technician}>
                            {job.technician}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium text-[11px]">Unassigned</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-gray-500 text-[11px] font-medium">Attempt:</span>
                        {open && current ? (
                          <span className="font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-[11px]">
                            Attempt {current.attemptNumber}
                            {current.inspectorName ? ` (${current.inspectorName})` : ""}
                          </span>
                        ) : priorAttempts > 0 ? (
                          <span className="text-slate-600 font-medium text-[11px]">
                            {priorAttempts} prior attempt{priorAttempts !== 1 ? "s" : ""}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Attempt 1</span>
                        )}
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="text-[11px] text-gray-500 flex items-center justify-between gap-1 pt-1 border-t border-gray-100">
                      <span>Rec: <strong className="text-gray-700 font-medium">{formatDate(job.receivedAt)}</strong></span>
                      <span>Est: <strong className="text-gray-700 font-medium">{formatDate(job.estCompletion || job.receivedAt)}</strong></span>
                    </div>

                    {/* Notes */}
                    {(job.qcNotes || job.notes) && (
                      <div className="text-[11px] text-gray-500 bg-gray-50 px-2 py-1 rounded border border-gray-100 truncate italic" title={job.qcNotes || job.notes}>
                        {job.qcNotes || job.notes}
                      </div>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center gap-1.5 mt-auto">
                    {/* Management: assign an inspector, or pass/fail straight away */}
                    {!open && canManage && STARTABLE_STATUSES.includes(job.status as string) && (
                      <>
                        {onAssign && (
                          <button
                            type="button"
                            onClick={() => onAssign(job)}
                            className="px-2.5 py-1.5 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold text-xs shadow-xs transition-colors flex items-center gap-1 cursor-pointer flex-1 justify-center whitespace-nowrap"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Assign</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onPass(job)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Pass</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onFail(job)}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Fail</span>
                        </button>
                      </>
                    )}

                    {/* No open attempt yet: begin (or resume/re-start after rework) inspection */}
                    {!open && !canManage && STARTABLE_STATUSES.includes(job.status as string) && (
                      <button
                        type="button"
                        onClick={() => onInspect(job)}
                        className="w-full px-3 py-1.5 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
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
                          title={!isOwner ? notOwnerTitle : "Inspect Checklist"}
                          className="px-2 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          <ListChecks className="w-3.5 h-3.5" />
                          <span>Checklist</span>
                        </button>
                        <button
                          type="button"
                          disabled={!isOwner}
                          onClick={() => onOpenPhotos(job)}
                          title={!isOwner ? notOwnerTitle : "Upload QC Photos"}
                          className="px-2 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Photos</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenRemarks(job)}
                          title="Add Remarks"
                          className="px-2 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Remarks</span>
                        </button>
                        <div className="flex items-center gap-1 w-full pt-1">
                          <button
                            type="button"
                            disabled={!isOwner}
                            onClick={() => onPass(job)}
                            title={!isOwner ? "Only the assigned inspector can record a decision" : undefined}
                            className="flex-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Pass QC</span>
                          </button>
                          <button
                            type="button"
                            disabled={!isOwner}
                            onClick={() => onFail(job)}
                            title={!isOwner ? "Only the assigned inspector can record a decision" : undefined}
                            className="flex-1 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Fail QC</span>
                          </button>
                        </div>
                      </>
                    )}

                    {/* Terminal states: read-only */}
                    {!open && TERMINAL_STATUSES.includes(job.status as string) && (
                      <span className="text-slate-400 text-xs italic py-1">QC Completed</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
