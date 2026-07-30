"use client";

import { Eye, Edit, Trash2, Calendar, Clock, User, FileText } from "lucide-react";
import { JobCard } from "../types/job-card.types";
import { PriorityBadge } from "./PriorityBadge";
import { JobStatusBadge } from "./JobStatusBadge";

interface JobCardTableProps {
  jobCards: JobCard[];
  onView?: (job: JobCard) => void;
  onEdit: (job: JobCard) => void;
  onDelete: (id: string) => void;
}

function formatDateOnly(dateStr?: string) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
  });
}

function formatTimeOnly(dateStr?: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function JobCardTable({ jobCards, onView, onEdit, onDelete }: JobCardTableProps) {
  if (jobCards.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500 bg-white rounded-2xl border border-gray-100 shadow-sm">
        No job cards found
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {jobCards.map((j) => {
        const isDelivered =
          j.status === "Completed" ||
          j.status === "QC Passed" ||
          j.status === "Delivered" ||
          j.status === "Ready For Billing" ||
          j.status === "Out";

        const isCompleted = j.status === "Completed" || j.status === "QC Passed";

        return (
          <div
            key={j.id}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-6 flex flex-col justify-between space-y-4 relative overflow-hidden"
          >
            {isCompleted ? (
              <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg z-10">
                Completed
              </div>
            ) : (
              j.priority === "High" && (
                <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg z-10">
                  URGENT
                </div>
              )
            )}

            {/* Header: Vehicle, Service, Status Badge & Action Icons */}
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 tracking-tight">{j.vehicle}</h3>
                  <p className="text-sm text-gray-500 mt-0.5 font-medium">{j.service || "Standard Service"}</p>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  {/* Action Icons Right-Aligned */}
                  <div className="flex items-center gap-1 bg-gray-50/80 p-1 rounded-lg border border-gray-100 z-20">
                    {onView && (
                      <button
                        onClick={() => onView(j)}
                        className="p-1 hover:bg-gray-200/60 rounded text-gray-600 transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => onEdit(j)}
                      className="p-1 hover:bg-blue-100/60 rounded text-blue-600 transition-colors"
                      title="Edit Job Card"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(j.id)}
                      className="p-1 hover:bg-red-100/60 rounded text-red-500 transition-colors"
                      title="Delete Job Card"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {!isCompleted && <JobStatusBadge status={j.status} />}
                </div>
              </div>

              {/* Sub-info: Job ID, Customer, Tech & Priority */}
              <div className="mt-3.5 pt-2.5 border-t border-gray-50 flex items-center justify-between text-xs text-gray-600">
                <span className="font-mono font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/50">
                  {j.id}
                </span>
                <span className="flex items-center gap-1 font-medium text-gray-700">
                  <User className="w-3.5 h-3.5 text-gray-400" /> {j.customer || "Walk-in"}
                </span>
                {j.priority && <PriorityBadge priority={j.priority} />}
              </div>
            </div>

            {/* Dates Footer Section matching Reference Image */}
            <div className="border-t border-gray-100/80 pt-3.5 space-y-2 text-xs font-medium text-gray-600">
              {/* Started */}
              <div className="flex items-start gap-2.5">
                <Calendar className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-gray-600">
                    Started: <span className="font-semibold text-gray-800">{formatDateOnly(j.startDate)}</span>
                  </div>
                  {formatTimeOnly(j.startDate) && (
                    <div className="text-[11px] text-gray-400 font-mono">{formatTimeOnly(j.startDate)}</div>
                  )}
                </div>
              </div>

              {/* Est. Completion */}
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-gray-600">
                    Est. Completion:{" "}
                    {isDelivered ? (
                      <span className="font-semibold text-gray-800">
                        {formatDateOnly(j.estCompletion || j.actualCompletion)}
                      </span>
                    ) : (
                      <span className="text-gray-400 font-normal">—</span>
                    )}
                  </div>
                  {isDelivered && formatTimeOnly(j.estCompletion || j.actualCompletion) && (
                    <div className="text-[11px] text-gray-400 font-mono">
                      {formatTimeOnly(j.estCompletion || j.actualCompletion)}
                    </div>
                  )}
                </div>
              </div>

              {/* Notes if any */}
              {j.notes && j.notes.trim() !== "" && (
                <div className="pt-2 border-t border-gray-50 flex items-start gap-2 text-[11px] text-gray-500">
                  <FileText className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                  <span className="truncate" title={j.notes}>{j.notes}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
