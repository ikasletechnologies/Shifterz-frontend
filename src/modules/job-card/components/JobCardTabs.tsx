"use client";

import { useMemo } from "react";
import { ArrowRight, Eye, Copy, Phone, User, ClipboardList } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { JobCard } from "../types/job-card.types";
import { JobTracking, useJobTracking } from "../hooks/useJobTracking";
import { STAGE_FILTERS, hasTechnician } from "../lib/jobStage";
import { JobStatusBadge } from "./JobStatusBadge";
import { PriorityBadge } from "./PriorityBadge";

interface JobCardTabsProps {
  jobCards: JobCard[];
  trackingFor?: (job: JobCard) => JobTracking;
  onView?: (job: JobCard) => void;
  onEdit: (job: JobCard) => void;
  selectedStatus?: string;
  onStatusSelect?: (status: string) => void;
}

function formatDateStr(input?: string): string {
  if (!input) return "—";
  const d = new Date(input);
  if (isNaN(d.getTime())) return input;
  const day = d.getDate().toString().padStart(2, "0");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

const noInspectionCheck = () => false;

export function JobCardTabs({
  jobCards,
  trackingFor,
  onView,
  onEdit,
  selectedStatus = "All",
}: JobCardTabsProps) {
  const router = useRouter();
  const own = useJobTracking(jobCards, noInspectionCheck, !trackingFor);
  const resolve = trackingFor ?? own.trackingFor;

  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    toast.success(`Copied Job ID: ${id}`);
  };

  // Group job cards by existing status/stages
  const groupedJobs = useMemo(() => {
    const activeFilters =
      selectedStatus && selectedStatus !== "All"
        ? STAGE_FILTERS.filter((f) => f.id === selectedStatus)
        : STAGE_FILTERS;

    const groups: {
      filter: (typeof STAGE_FILTERS)[number];
      jobs: JobCard[];
    }[] = [];

    for (const filter of activeFilters) {
      const matchingJobs = jobCards.filter((j) =>
        filter.stages.includes(resolve(j).stage.key)
      );
      if (matchingJobs.length > 0 || (selectedStatus && selectedStatus === filter.id)) {
        groups.push({ filter, jobs: matchingJobs });
      }
    }

    // Capture any uncategorized or cancelled cards
    const allFilteredStages = new Set(STAGE_FILTERS.flatMap((f) => f.stages));
    const otherJobs = jobCards.filter(
      (j) => !allFilteredStages.has(resolve(j).stage.key)
    );
    if (otherJobs.length > 0 && (selectedStatus === "All" || !selectedStatus)) {
      groups.push({
        filter: { id: "other", label: "Other / Cancelled", stages: [] },
        jobs: otherJobs,
      });
    }

    return groups;
  }, [jobCards, resolve, selectedStatus]);

  if (jobCards.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500 bg-white border border-slate-200 rounded-xl shadow-xs">
        <ClipboardList className="w-10 h-10 mx-auto text-slate-300 mb-3" />
        <p className="text-sm font-medium text-slate-700">No job cards found</p>
        <p className="text-xs text-slate-400 mt-1">Try adjusting your search or date filter</p>
      </div>
    );
  }

  const getToneDot = (tone?: string) => {
    if (tone === "good") return "bg-emerald-500";
    if (tone === "bad") return "bg-rose-500";
    return "bg-amber-500";
  };

  return (
    <div className="space-y-8">
      {groupedJobs.map((group) => {
        return (
          <div key={group.filter.id} className="space-y-3.5">
            {/* Group Header */}
            <div className="flex items-center justify-between gap-3 pb-2 border-b border-gray-200/80">
              <div className="flex items-center gap-2.5">
                <span className={`w-2.5 h-2.5 rounded-full ${getToneDot(group.filter.tone)}`} />
                <h3 className="text-sm sm:text-base font-bold text-gray-900">
                  {group.filter.label}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
                  {group.jobs.length}
                </span>
              </div>
            </div>

            {/* Group Cards Grid */}
            {group.jobs.length === 0 ? (
              <div className="p-8 text-center bg-gray-50/70 border border-dashed border-gray-200 rounded-xl text-gray-500 text-xs">
                No job cards in this stage
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {group.jobs.map((j) => {
                  const { stage } = resolve(j);
                  const action = stage.action;
                  const phone = j.phone || j.customerPhone;

                  return (
                    <div
                      key={j.id}
                      className="bg-white rounded-xl border border-gray-200/90 shadow-xs hover:shadow-md hover:border-yellow-400 transition-all p-4 flex flex-col justify-between gap-3"
                    >
                      {/* Top Header: ID + Priority + Status */}
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <button
                            type="button"
                            onClick={(e) => handleCopyId(j.id, e)}
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-gray-100 hover:bg-yellow-100 text-gray-800 text-xs font-mono font-bold transition-colors cursor-pointer group shrink-0"
                            title="Click to copy Job ID"
                          >
                            <span>{j.id}</span>
                            <Copy className="w-3 h-3 text-gray-400 group-hover:text-gray-700 transition-colors" />
                          </button>

                          <div className="flex items-center gap-1.5 flex-wrap justify-end">
                            {j.status && <JobStatusBadge status={j.status} />}
                            {j.priority && <PriorityBadge priority={j.priority} />}
                          </div>
                        </div>

                        {/* Vehicle & Service */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-xs uppercase tracking-wider text-gray-900 bg-slate-50 border border-slate-200/80 px-2 py-0.5 rounded">
                              {j.vehicle || "—"}
                            </span>
                          </div>

                          {j.service && (
                            <div className="text-xs font-semibold text-gray-800 line-clamp-1" title={j.service}>
                              {j.service}
                            </div>
                          )}
                        </div>

                        {/* Customer & Phone */}
                        <div className="text-xs text-gray-600 space-y-1 pt-1 border-t border-gray-100">
                          <div className="flex items-center gap-1.5 truncate font-medium text-gray-800">
                            <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span className="truncate" title={j.customer}>{j.customer || "—"}</span>
                          </div>
                          {phone && (
                            <div className="flex items-center gap-1.5 text-gray-500">
                              <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                              <span>{phone}</span>
                            </div>
                          )}
                        </div>

                        {/* Technician */}
                        <div className="flex items-center justify-between text-xs gap-2 pt-1 border-t border-gray-100">
                          <span className="text-gray-500 text-[11px] font-medium">Technician:</span>
                          {hasTechnician(j) ? (
                            <span className="font-medium text-gray-800 bg-gray-50 px-2 py-0.5 rounded border border-gray-200/60 truncate max-w-[130px]" title={j.technician}>
                              {j.technician}
                            </span>
                          ) : (
                            <span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60 text-[11px]">
                              Unassigned
                            </span>
                          )}
                        </div>

                        {/* Timeline */}
                        <div className="text-[11px] text-gray-500 flex items-center justify-between gap-1 pt-0.5">
                          <span>Started: <strong className="text-gray-700 font-medium">{formatDateStr(j.startDate)}</strong></span>
                          <span>Est: <strong className="text-gray-700 font-medium">{formatDateStr(j.estCompletion || j.actualCompletion)}</strong></span>
                        </div>

                        {/* Notes */}
                        {j.notes && j.notes.trim() !== "" && (
                          <div className="text-[11px] text-gray-500 bg-gray-50 px-2 py-1 rounded border border-gray-100 truncate italic" title={j.notes}>
                            {j.notes}
                          </div>
                        )}
                      </div>

                      {/* Card Actions Footer */}
                      <div className="pt-2 border-t border-gray-100 flex items-center gap-2 mt-auto">
                        {action && (
                          <button
                            type="button"
                            className="keep-color inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-800 shadow-xs hover:bg-yellow-400 hover:border-yellow-400 hover:text-gray-900 transition-colors cursor-pointer flex-1"
                            onClick={() => (action.edit ? onEdit(j) : action.href && router.push(action.href))}
                          >
                            <span>{action.label}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {onView && (
                          <button
                            type="button"
                            onClick={() => onView(j)}
                            className="inline-flex items-center justify-center p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 shadow-xs transition-colors cursor-pointer"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
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
