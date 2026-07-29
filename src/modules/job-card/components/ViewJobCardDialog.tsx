"use client";

import { X, ClipboardList, Calendar, Clock, User, Wrench, AlertCircle, FileText } from "lucide-react";
import { JobCard } from "../types/job-card.types";
import { JobStatusBadge } from "./JobStatusBadge";
import { PriorityBadge } from "./PriorityBadge";

interface ViewJobCardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  job: JobCard | null;
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

export function ViewJobCardDialog({ isOpen, onClose, job }: ViewJobCardDialogProps) {
  if (!isOpen || !job) return null;

  const isDelivered =
    job.status === "Completed" ||
    job.status === "Delivered" ||
    job.status === "Out";

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
                {job.priority && <PriorityBadge priority={job.priority} />}
              </div>
              <h2 className="text-xl font-bold text-gray-900 mt-0.5">{job.vehicle}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
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
              <div className="pt-0.5">
                <PriorityBadge priority={job.priority || "Normal"} />
              </div>
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
              {isDelivered ? (
                <>
                  <p className="text-sm font-semibold text-gray-900">{formatDateOnly(job.estCompletion || job.actualCompletion)}</p>
                  {formatTimeOnly(job.estCompletion || job.actualCompletion) && (
                    <p className="text-xs text-gray-500 font-mono font-medium">{formatTimeOnly(job.estCompletion || job.actualCompletion)}</p>
                  )}
                </>
              ) : (
                <p className="text-sm font-semibold text-gray-400">—</p>
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

          {/* Photos (if any) */}
          {job.photos && job.photos.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Vehicle Photos</span>
              <div className="grid grid-cols-3 gap-2">
                {job.photos.map((url, idx) => (
                  <img key={idx} src={url} alt={`Job photo ${idx + 1}`} className="w-full h-24 object-cover rounded-lg border border-gray-200" />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center rounded-b-2xl">
          <span className="text-xs text-gray-500 font-medium">Read-Only View</span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-xl text-sm transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
