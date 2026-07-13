"use client";

import { WorkshopJob } from "../types/workshop.types";
import { WORKSHOP_STATUS_COLORS } from "../constants/workshop.constants";
import { Play, Pause, RotateCcw, CheckCircle2, Camera, Package, FileText, Send } from "lucide-react";

interface WorkshopTableProps {
  jobs: WorkshopJob[];
  onStartWork: (job: WorkshopJob) => void;
  onPauseWork: (job: WorkshopJob) => void;
  onResumeWork: (job: WorkshopJob) => void;
  onCompleteWork: (job: WorkshopJob) => void;
  onUploadPhotos: (job: WorkshopJob) => void;
  onAddMaterial: (job: WorkshopJob) => void;
  onAddNotes: (job: WorkshopJob) => void;
  onSendToQC: (job: WorkshopJob) => void;
}

function StatusBadge({ status }: { status: string }) {
  const color = WORKSHOP_STATUS_COLORS[status] || "bg-gray-100 text-gray-600";
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap ${color}`}>
      {status}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const colorMap: Record<string, string> = {
    High: "bg-red-100 text-red-700",
    Normal: "bg-blue-100 text-blue-700",
    Low: "bg-green-100 text-green-700",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${colorMap[priority] || "bg-gray-100 text-gray-600"}`}>
      {priority}
    </span>
  );
}

export function WorkshopTable({
  jobs,
  onStartWork,
  onPauseWork,
  onResumeWork,
  onCompleteWork,
  onUploadPhotos,
  onAddMaterial,
  onAddNotes,
  onSendToQC,
}: WorkshopTableProps) {
  if (jobs.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400 bg-white rounded-xl border border-gray-100">
        <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="font-semibold">No jobs found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left min-w-[900px]">
          <thead className="bg-gray-50/50 border-b border-gray-100 text-xs text-gray-800 uppercase font-bold tracking-wider">
            <tr>
              <th className="px-4 py-4 whitespace-nowrap">Job Card</th>
              <th className="px-4 py-4 whitespace-nowrap">Vehicle</th>
              <th className="px-4 py-4 whitespace-nowrap">Service</th>
              <th className="px-4 py-4 whitespace-nowrap">Priority</th>
              <th className="px-4 py-4 whitespace-nowrap">Status</th>
              <th className="px-4 py-4 whitespace-nowrap">Started At</th>
              <th className="px-4 py-4 whitespace-nowrap">Est. Finish</th>
              <th className="px-4 py-4 whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {jobs.map((job) => (
              <tr key={job.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-4 font-mono text-xs font-bold whitespace-nowrap" style={{ color: "#F0B100" }}>
                  {job.id}
                </td>
                <td className="px-4 py-4 font-bold text-gray-900 whitespace-nowrap">{job.vehicle}</td>
                <td className="px-4 py-4 text-gray-600">{job.service}</td>
                <td className="px-4 py-4">
                  <PriorityBadge priority={job.priority} />
                </td>
                <td className="px-4 py-4">
                  <StatusBadge status={job.status} />
                </td>
                <td className="px-4 py-4 text-gray-500 text-xs whitespace-nowrap">
                  {job.startedAt ? new Date(job.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                </td>
                <td className="px-4 py-4 text-gray-500 text-xs whitespace-nowrap">{job.estCompletion || "—"}</td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Status-driven primary action button */}
                    {job.status === "Assigned" && (
                      <button
                        onClick={() => onStartWork(job)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded transition-colors"
                        title="Start Work"
                      >
                        <Play className="w-3 h-3" /> Start
                      </button>
                    )}

                    {job.status === "In Progress" && (
                      <>
                        <button
                          onClick={() => onPauseWork(job)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded transition-colors"
                          title="Pause Work"
                        >
                          <Pause className="w-3 h-3" /> Pause
                        </button>
                        <button
                          onClick={() => onCompleteWork(job)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded transition-colors"
                          title="Complete Work"
                        >
                          <CheckCircle2 className="w-3 h-3" /> Complete
                        </button>
                      </>
                    )}

                    {job.status === "Paused" && (
                      <button
                        onClick={() => onResumeWork(job)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded transition-colors"
                        title="Resume Work"
                      >
                        <RotateCcw className="w-3 h-3" /> Resume
                      </button>
                    )}

                    {job.status === "Completed" && (
                      <button
                        onClick={() => onSendToQC(job)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded transition-colors"
                        title="Send to QC"
                      >
                        <Send className="w-3 h-3" /> Send to QC
                      </button>
                    )}

                    {/* Secondary actions available when In Progress */}
                    {(job.status === "In Progress" || job.status === "Paused") && (
                      <>
                        <button
                          onClick={() => onUploadPhotos(job)}
                          className="p-1.5 hover:bg-green-50 text-green-600 rounded border border-green-100 transition-colors"
                          title="Upload Photos"
                        >
                          <Camera className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onAddMaterial(job)}
                          className="p-1.5 hover:bg-yellow-50 text-yellow-600 rounded border border-yellow-100 transition-colors"
                          title="Record Material"
                        >
                          <Package className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onAddNotes(job)}
                          className="p-1.5 hover:bg-blue-50 text-blue-500 rounded border border-blue-100 transition-colors"
                          title="Technician Notes"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
