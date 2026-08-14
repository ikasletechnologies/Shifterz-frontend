"use client";

import { useState, useEffect } from "react";
import { X, ClipboardList, Calendar, Clock, User, Wrench, AlertCircle, FileText, Edit, Trash2 } from "lucide-react";
import { JobCard } from "../types/job-card.types";
import { JobStatusBadge } from "./JobStatusBadge";
import { PriorityBadge } from "./PriorityBadge";

interface ViewJobCardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  job: JobCard | null;
  onEdit?: (job: JobCard) => void;
  onDelete?: (id: string) => void;
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

export function ViewJobCardDialog({ isOpen, onClose, job, onEdit, onDelete }: ViewJobCardDialogProps) {
  const [history, setHistory] = useState<any[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'details' | 'timeline'>('details');

  // Load chronological timeline history from backend
  useEffect(() => {
    if (isOpen && job?.id) {
      const token = localStorage.getItem("token");
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      fetch(`${apiBase}/jobs/${job.id}/history`, {
        headers: {
          "Authorization": `Bearer ${token || ""}`
        }
      })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setHistory(data);
      })
      .catch(console.error);
    }
  }, [isOpen, job?.id]);

  if (!isOpen || !job) return null;

  const isDelivered =
    job.status === "Completed" ||
    job.status === "Delivered" ||
    job.status === "Out";

  const handlePrint = (copy: 'workshop' | 'customer') => {
    if (!job) return;
    const token = localStorage.getItem("token");
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    window.open(`${apiBase}/jobs/${job.id}/print?copy=${copy}&token=${token || ""}`, "_blank");
  };

  const currentUser = (() => {
    try {
      if (typeof window !== "undefined") {
        const u = localStorage.getItem("user");
        if (u) return JSON.parse(u);
      }
    } catch {
      // Ignore
    }
    return null;
  })();

  const userRole = (currentUser?.role || "").toUpperCase().replace(/[\s_]+/g, "_");
  const isManagement = ['SUPER_ADMIN', 'HQ_USER', 'FRANCHISE_ADMIN', 'BRANCH_MANAGER'].includes(userRole);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-yellow-50 text-yellow-600 rounded-xl">
               <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-yellow-600">{job.id}</span>
                <JobStatusBadge status={job.status} />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mt-0.5">{job.vehicle}</h2>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-2">


            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(job);
                }}
                className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors border border-blue-100 cursor-pointer"
                title="Edit Job Card"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}

            {onDelete && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDelete(job.id);
                }}
                className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors border border-red-100 cursor-pointer"
                title="Delete Job Card"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 text-gray-500 cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-gray-100 px-6">
          <button
            onClick={() => setActiveSubTab('details')}
            className={`py-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
              activeSubTab === 'details' ? 'border-yellow-500 text-yellow-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Details & Materials
          </button>
          <button
            onClick={() => setActiveSubTab('timeline')}
            className={`py-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
              activeSubTab === 'timeline' ? 'border-yellow-500 text-yellow-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Activity Timeline ({history.length})
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {activeSubTab === 'details' ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Customer Details */}
                <div className="bg-gray-50/75 p-4 rounded-xl border border-gray-100 space-y-1">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-gray-500" /> Customer Name
                  </span>
                  <p className="text-sm font-bold text-gray-900">{job.customer || "Walk-in Customer"}</p>
                </div>

                {/* Service Requested */}
                <div className="bg-gray-50/75 p-4 rounded-xl border border-gray-100 space-y-1">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-gray-500" /> Service Requested
                  </span>
                  <p className="text-sm font-bold text-gray-900">{job.service || "—"}</p>
                </div>

                {/* Technician */}
                <div className="bg-gray-50/75 p-4 rounded-xl border border-gray-100 space-y-1">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-gray-500" /> Assigned Technician
                  </span>
                  <p className="text-sm font-bold text-gray-900">{job.technician || "Unassigned"}</p>
                </div>

                {/* Priority */}
                <div className="bg-gray-50/75 p-4 rounded-xl border border-gray-100 space-y-1">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-gray-500" /> Priority Level
                  </span>
                  {job.priority ? (
                    <PriorityBadge priority={job.priority} />
                  ) : (
                    <span className="text-xs text-gray-400 font-medium">None</span>
                  )}
                </div>

                {/* Start Date & Time */}
                <div className="bg-gray-50/75 p-4 rounded-xl border border-gray-100 space-y-1">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-500" /> Started Date & Time
                  </span>
                  <p className="text-sm font-semibold text-gray-900">{formatDateOnly(job.startDate)}</p>
                  {formatTimeOnly(job.startDate) && (
                    <p className="text-xs text-gray-500 font-mono font-medium">{formatTimeOnly(job.startDate)}</p>
                  )}
                </div>

                {/* Est Completion */}
                <div className="bg-gray-50/75 p-4 rounded-xl border border-gray-100 space-y-1">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-gray-500" /> Est. Completion
                  </span>
                  <p className="text-sm font-semibold text-gray-900">{formatDateOnly(job.estCompletion || job.actualCompletion)}</p>
                  {formatTimeOnly(job.estCompletion || job.actualCompletion) && (
                    <p className="text-xs text-gray-500 font-mono font-medium">{formatTimeOnly(job.estCompletion || job.actualCompletion)}</p>
                  )}
                </div>
              </div>

              {/* Notes / Instructions */}
              <div className="bg-gray-50/75 p-4 rounded-xl border border-gray-100 space-y-1.5">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-gray-500" /> Notes & Instructions
                </span>
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {job.notes && job.notes.trim() ? job.notes : "No notes provided for this job card."}
                </p>
              </div>

              {/* Technician Instructions */}
              {job.technicianInstructions && (
                <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 space-y-1.5">
                  <span className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5" /> Technician Instructions
                  </span>
                  <p className="text-sm text-amber-900 whitespace-pre-wrap leading-relaxed">{job.technicianInstructions}</p>
                </div>
              )}

              {/* Internal Remarks */}
              {isManagement && job.internalRemarks && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Internal Remarks (Staff Only)
                  </span>
                  <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{job.internalRemarks}</p>
                </div>
              )}

              {/* Segmented Photo Galleries */}
              <div className="space-y-4">
                {job.checkInPhotos && job.checkInPhotos.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Check-in Photographs</span>
                    <div className="grid grid-cols-4 gap-2">
                      {job.checkInPhotos.map((url, idx) => (
                        <img key={idx} src={url} alt={`Check-in ${idx + 1}`} className="w-full h-20 object-cover rounded-lg border border-gray-200" />
                      ))}
                    </div>
                  </div>
                )}

                {job.workProgressPhotos && job.workProgressPhotos.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Work Progress Photographs</span>
                    <div className="grid grid-cols-4 gap-2">
                      {job.workProgressPhotos.map((url, idx) => (
                        <img key={idx} src={url} alt={`Progress ${idx + 1}`} className="w-full h-20 object-cover rounded-lg border border-gray-200" />
                      ))}
                    </div>
                  </div>
                )}

                {job.completionPhotos && job.completionPhotos.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Completion / Final Photographs</span>
                    <div className="grid grid-cols-4 gap-2">
                      {job.completionPhotos.map((url, idx) => (
                        <img key={idx} src={url} alt={`Completion ${idx + 1}`} className="w-full h-20 object-cover rounded-lg border border-gray-200" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Chronological Timeline */
            <div className="space-y-6 max-h-[55vh] overflow-y-auto pr-2">
              {history.length === 0 ? (
                <p className="text-center text-gray-500 py-8 text-sm">No activity logged yet.</p>
              ) : (
                <div className="relative border-l-2 border-slate-100 ml-4 space-y-6 py-2">
                  {history.map((item, idx) => {
                    const timeStr = new Date(item.createdAt).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true
                    });
                    const dateStr = new Date(item.createdAt).toLocaleDateString("en-IN", {
                      month: "short",
                      day: "numeric"
                    });
                    return (
                      <div key={item.id || idx} className="relative pl-6">
                        {/* Timeline node dot */}
                        <div className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-yellow-500 border-2 border-white ring-4 ring-yellow-50" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-400">{dateStr} at {timeStr}</span>
                            <span className="text-xs bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded uppercase">{item.event}</span>
                          </div>
                          <p className="text-sm font-semibold text-gray-900 mt-1">
                            {item.payload?.newValue?.status || item.event.replace(/_/g, " ")}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Performed By: <span className="font-semibold">{item.performedBy || 'System'}</span>
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
