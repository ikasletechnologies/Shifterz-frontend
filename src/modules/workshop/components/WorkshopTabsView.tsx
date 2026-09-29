"use client";

import { WorkshopJob } from "../types/workshop.types";
import { StatusText } from "@/components/common/StatusText";
import {
  Car,
  User,
  Wrench,
  Clock,
  Calendar,
  Camera,
  Package,
  FileText,
  Play,
  Pause,
  CheckCircle2,
  RotateCcw,
  ShieldAlert,
} from "lucide-react";

interface WorkshopTabsViewProps {
  jobs: WorkshopJob[];
  activeStage?: string;
  onStartWork: (job: WorkshopJob) => void;
  onPauseWork: (job: WorkshopJob) => void;
  onResumeWork: (job: WorkshopJob) => void;
  onCompleteWork: (job: WorkshopJob) => void;
  onUploadPhotos: (job: WorkshopJob) => void;
  onAddMaterial: (job: WorkshopJob) => void;
  onAddNotes: (job: WorkshopJob) => void;
}

const REWORK_STATUSES = ["QC Failed", "Rework", "Rework Required"];

export interface WorkshopStatusGroup {
  id: string;
  label: string;
  match: (j: WorkshopJob) => boolean;
  empty: string;
  badgeClass: string;
  dotClass: string;
}

export const WORKSHOP_STATUS_GROUPS: WorkshopStatusGroup[] = [
  {
    id: "ToStart",
    label: "To Start",
    match: (j) => j.status === "Assigned",
    empty: "No jobs waiting to be started.",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
    dotClass: "bg-blue-500",
  },
  {
    id: "InProgress",
    label: "In Progress",
    match: (j) => j.status === "In Progress" || j.status === "Paused",
    empty: "No work in progress right now.",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    dotClass: "bg-amber-500",
  },
  {
    id: "Completed",
    label: "Ready for QC",
    match: (j) => j.status === "Completed",
    empty: "No finished work waiting to be sent to QC.",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
    dotClass: "bg-purple-500",
  },
  {
    id: "SentToQC",
    label: "Sent to QC",
    match: (j) => j.status === "Waiting QC",
    empty: "Nothing is waiting in QC.",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dotClass: "bg-emerald-500",
  },
  {
    id: "Rework",
    label: "Rework",
    match: (j) => REWORK_STATUSES.includes(j.status as string),
    empty: "No jobs have been sent back from QC.",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
    dotClass: "bg-rose-500",
  },
];

function formatDate(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateTime(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function getPriorityBadge(priority?: string) {
  const p = (priority || "").toLowerCase();
  if (p === "high" || p === "urgent") {
    return "bg-rose-50 text-rose-700 border-rose-200";
  }
  if (p === "medium") {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }
  return "bg-slate-50 text-slate-600 border-slate-200";
}

export function WorkshopTabsView({
  jobs,
  activeStage = "All",
  onStartWork,
  onPauseWork,
  onResumeWork,
  onCompleteWork,
  onUploadPhotos,
  onAddMaterial,
  onAddNotes,
}: WorkshopTabsViewProps) {
  // If activeStage is not 'All', only show that group; otherwise show all 5 groups
  const groupsToDisplay =
    activeStage === "All"
      ? WORKSHOP_STATUS_GROUPS
      : WORKSHOP_STATUS_GROUPS.filter((g) => g.id === activeStage);

  return (
    <div className="space-y-8">
      {groupsToDisplay.map((group) => {
        const groupJobs = jobs.filter(group.match);

        return (
          <div key={group.id} className="space-y-3.5">
            {/* Status Group Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
              <div className="flex items-center gap-2.5">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${group.badgeClass}`}>
                  <span className={`w-2 h-2 rounded-full ${group.dotClass}`} />
                  {group.label}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  {groupJobs.length} {groupJobs.length === 1 ? "job" : "jobs"}
                </span>
              </div>
            </div>

            {/* Jobs in this status */}
            {groupJobs.length === 0 ? (
              <div className="bg-slate-50/70 border border-dashed border-slate-200 rounded-xl p-6 text-center text-xs text-slate-500">
                {group.empty}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {groupJobs.map((job) => {
                  const isRework = REWORK_STATUSES.includes(job.status as string);
                  const isWorking = job.status === "In Progress" || job.status === "Paused";

                  return (
                    <div
                      key={job.id}
                      className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      {/* Top Header */}
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="space-y-1">
                            <span className="inline-block font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                              {job.id}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <Car className="w-4 h-4 text-slate-400 shrink-0" />
                              <span className="font-mono font-extrabold text-sm sm:text-base text-slate-900 tracking-wide uppercase">
                                {job.vehicle || "—"}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1.5">
                            <StatusText status={job.status} />
                            {job.priority && (
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getPriorityBadge(
                                  job.priority
                                )}`}
                              >
                                {job.priority}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Customer */}
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-3">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate font-medium">{job.customer || "—"}</span>
                        </div>

                        {/* Service & Details Box */}
                        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 space-y-1.5 text-xs mb-3">
                          <div className="flex items-center gap-1.5 text-slate-900 font-semibold truncate pb-1 border-b border-slate-200/50">
                            <Wrench className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span className="truncate" title={job.service}>
                              {job.service || "—"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                            <span>Technician:</span>
                            <span className="font-medium text-slate-800 truncate max-w-[150px]">
                              {job.technician || <span className="text-slate-400">Unassigned</span>}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" /> Started:
                            </span>
                            <span className="font-medium text-slate-700">
                              {formatDateTime(job.startedAt)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" /> Est. Finish:
                            </span>
                            <span className="font-medium text-slate-700">
                              {formatDate(job.estCompletion)}
                            </span>
                          </div>
                        </div>

                        {/* Notes preview if present */}
                        {job.notes && (
                          <div
                            className="text-[11px] text-slate-500 italic truncate mb-3 bg-amber-50/60 border border-amber-100/80 rounded px-2 py-1"
                            title={job.notes}
                          >
                            <span className="font-semibold text-amber-700 not-italic">Note: </span>
                            {job.notes}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="border-t border-slate-100 pt-3 mt-1 space-y-2">
                        {/* Secondary toolbar buttons while working */}
                        {isWorking && (
                          <div className="grid grid-cols-3 gap-1.5">
                            <button
                              type="button"
                              onClick={() => onUploadPhotos(job)}
                              className="py-1.5 px-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                              title="Upload work photos"
                            >
                              <Camera className="w-3.5 h-3.5 text-slate-500" />
                              <span>Photos</span>
                              {job.photos && job.photos.length > 0 && (
                                <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-1.5 py-0.2 rounded-full">
                                  {job.photos.length}
                                </span>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => onAddMaterial(job)}
                              className="py-1.5 px-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                              title="Record parts / materials used"
                            >
                              <Package className="w-3.5 h-3.5 text-slate-500" />
                              <span>Parts</span>
                              {job.materials && job.materials.length > 0 && (
                                <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-1.5 py-0.2 rounded-full">
                                  {job.materials.length}
                                </span>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => onAddNotes(job)}
                              className="py-1.5 px-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                              title="Technician notes"
                            >
                              <FileText className="w-3.5 h-3.5 text-slate-500" />
                              <span>Notes</span>
                            </button>
                          </div>
                        )}

                        {/* Primary Workflow Next Action */}
                        <div className="flex items-center gap-2">
                          {job.status === "In Progress" && (
                            <>
                              <button
                                type="button"
                                onClick={() => onPauseWork(job)}
                                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1"
                                title="Pause work"
                              >
                                <Pause className="w-3.5 h-3.5" />
                                <span>Pause</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => onCompleteWork(job)}
                                className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-gray-950 font-bold text-xs py-2 px-3 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Complete</span>
                              </button>
                            </>
                          )}

                          {job.status === "Paused" && (
                            <button
                              type="button"
                              onClick={() => onResumeWork(job)}
                              className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-950 font-bold text-xs py-2 px-3 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>Resume Work</span>
                            </button>
                          )}

                          {job.status === "Assigned" && (
                            <button
                              type="button"
                              onClick={() => onStartWork(job)}
                              className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-950 font-bold text-xs py-2.5 px-3 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>Start Work</span>
                            </button>
                          )}

                          {isRework && (
                            <button
                              type="button"
                              onClick={() => onStartWork(job)}
                              className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-950 font-bold text-xs py-2.5 px-3 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                              title="QC sent this job back — fix the issues and complete it again"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Start Rework</span>
                            </button>
                          )}

                          {(job.status === "Completed" || job.status === "Waiting QC") && (
                            <div className="w-full py-2 bg-slate-50 text-slate-500 border border-slate-200/70 rounded-lg text-xs font-semibold text-center flex items-center justify-center gap-1.5">
                              <ShieldAlert className="w-3.5 h-3.5 text-purple-500" />
                              <span>With QC</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
