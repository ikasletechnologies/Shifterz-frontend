"use client";

import { QCJob } from "../types/qc.types";
import { QC_STATUS_COLORS } from "../constants/qc.constants";
import { ClipboardCheck, Camera, MessageSquare, CheckCircle2, XCircle, RefreshCw, PlayCircle } from "lucide-react";

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
      <div className="flex flex-col items-center justify-center py-16 text-gray-400 bg-white rounded-xl border border-gray-100">
        <ClipboardCheck className="w-12 h-12 mb-3 opacity-30" />
        <p className="font-semibold">No jobs in QC queue</p>
        <p className="text-sm mt-1">Jobs sent from Workshop will appear here</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left min-w-[960px]">
          <thead className="bg-gray-50/50 border-b border-gray-100 text-xs text-gray-800 uppercase font-bold tracking-wider">
            <tr>
              <th className="px-4 py-4 whitespace-nowrap">Job Card</th>
              <th className="px-4 py-4 whitespace-nowrap">Vehicle</th>
              <th className="px-4 py-4 whitespace-nowrap">Customer</th>
              <th className="px-4 py-4 whitespace-nowrap">Technician</th>
              <th className="px-4 py-4 whitespace-nowrap">Received</th>
              <th className="px-4 py-4 whitespace-nowrap">Priority</th>
              <th className="px-4 py-4 whitespace-nowrap">QC Status</th>
              <th className="px-4 py-4 whitespace-nowrap">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {jobs.map((job) => (
              <tr key={job.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-4 font-mono text-xs font-bold whitespace-nowrap" style={{ color: "#F0B100" }}>
                  {job.id}
                </td>
                <td className="px-4 py-4 font-bold text-gray-900 whitespace-nowrap">{job.vehicle}</td>
                <td className="px-4 py-4 text-gray-600 whitespace-nowrap">{job.customer}</td>
                <td className="px-4 py-4 text-gray-600 whitespace-nowrap">{job.technician}</td>
                <td className="px-4 py-4 text-gray-500 text-xs whitespace-nowrap">
                  {job.receivedAt
                    ? new Date(job.receivedAt).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </td>
                <td className="px-4 py-4">
                  <PriorityBadge priority={job.priority} />
                </td>
                <td className="px-4 py-4">
                  <StatusBadge status={job.status} />
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-1.5 flex-wrap">

                    {/* WAITING QC: only action is to begin inspection */}
                    {job.status === "Waiting QC" && (
                      <button
                        onClick={() => onInspect(job)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded transition-colors"
                      >
                        <PlayCircle className="w-3 h-3" /> Inspect
                      </button>
                    )}

                    {/* INSPECTING: checklist + photos + remarks + pass/fail */}
                    {job.status === "Inspecting" && (
                      <>
                        <button
                          onClick={() => onOpenChecklist(job)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 text-xs font-bold rounded transition-colors"
                        >
                          <ClipboardCheck className="w-3 h-3" /> Checklist
                        </button>
                        <button
                          onClick={() => onOpenPhotos(job)}
                          className="p-1.5 hover:bg-green-50 text-green-600 border border-green-100 rounded transition-colors"
                          title="Upload QC Photos"
                        >
                          <Camera className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onOpenRemarks(job)}
                          className="p-1.5 hover:bg-blue-50 text-blue-500 border border-blue-100 rounded transition-colors"
                          title="Add Remarks"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onPass(job)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded transition-colors"
                        >
                          <CheckCircle2 className="w-3 h-3" /> Pass
                        </button>
                        <button
                          onClick={() => onFail(job)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded transition-colors"
                        >
                          <XCircle className="w-3 h-3" /> Fail
                        </button>
                      </>
                    )}

                    {/* QC FAILED: only action is to send for rework */}
                    {job.status === "QC Failed" && (
                      <button
                        onClick={() => onRework(job)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded transition-colors"
                      >
                        <RefreshCw className="w-3 h-3" /> Send Rework
                      </button>
                    )}

                    {/* Terminal states: read-only */}
                    {(job.status === "QC Passed" || job.status === "Ready For Billing" || job.status === "Rework") && (
                      <span className="text-xs text-gray-400 italic">
                        {job.status === "Rework" ? "Awaiting workshop" : "Completed"}
                      </span>
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
