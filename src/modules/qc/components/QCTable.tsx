"use client";

import { QCJob, QCInspection } from "../types/qc.types";
import { QC_STATUS_COLORS } from "../constants/qc.constants";
import { getCurrentUser, isHQRole } from "@/lib/franchise-scope";

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
  const currentUser = getCurrentUser();
  const currentUserId = currentUser?.id;
  const isManagementOverride = isHQRole(currentUser?.role);

  if (jobs.length === 0) {
    return (
      <div className="py-16 text-center text-slate-500 bg-white rounded-lg border border-slate-200">No jobs in QC queue</div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
      <table className="data-table w-full min-w-[1400px] text-left">
        <thead>
          <tr>
            <th>Job ID</th>
            <th>Vehicle Number</th>
            <th>Customer</th>
            <th>Mobile</th>
            <th>Fault</th>
            <th>Technician</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Attempt</th>
            <th>Received On</th>
            <th>Est. Completion</th>
            <th>Notes</th>
            <th className="text-right">Actions</th>
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
              <tr key={job.id}>
                <td className="whitespace-nowrap">{job.id}</td>
                <td className="whitespace-nowrap uppercase">{job.vehicle}</td>
                <td className="max-w-[180px] truncate">{job.customer}</td>
                <td className="whitespace-nowrap">{(job as any).phone || "—"}</td>
                <td className="max-w-[180px] truncate" title={job.service}>{job.service}</td>
                <td className="max-w-[160px] truncate">
                  {job.technician || <span className="text-slate-400">Unassigned</span>}
                </td>
                <td className="whitespace-nowrap">
                  <StatusBadge status={job.status} />
                </td>
                <td className="whitespace-nowrap">
                  <PriorityBadge priority={job.priority} />
                </td>
                <td className="whitespace-nowrap">
                  {open && current ? (
                    <>
                      <span>Attempt {current.attemptNumber}</span>
                      {!isOwner && (
                        <span className="block text-xs text-slate-400" title={notOwnerTitle}>
                          Owned by {current.inspectorName || "another inspector"}
                        </span>
                      )}
                    </>
                  ) : priorAttempts > 0 ? (
                    <span className="text-slate-500">
                      {priorAttempts} prior attempt{priorAttempts !== 1 ? "s" : ""}
                    </span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="whitespace-nowrap">{formatDateTime(job.receivedAt)}</td>
                <td className="whitespace-nowrap">{formatDate(job.estCompletion || job.receivedAt)}</td>
                <td className="max-w-[200px] truncate" title={job.qcNotes || job.notes}>
                  {job.qcNotes || job.notes || <span className="text-slate-400">—</span>}
                </td>
                <td className="whitespace-nowrap">
                  <div className="flex items-center justify-end gap-3">
                    {/* No open attempt yet: begin (or resume/re-start after rework) inspection */}
                    {!open && STARTABLE_STATUSES.includes(job.status as string) && (
                      <button type="button" onClick={() => onInspect(job)}>
                        {priorAttempts > 0 || job.status === "Rework Required" ? "Start Next Attempt" : "Start Inspection"}
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
                          className="disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Checklist
                        </button>
                        <button
                          type="button"
                          disabled={!isOwner}
                          onClick={() => onOpenPhotos(job)}
                          title={!isOwner ? notOwnerTitle : "Upload QC Photos"}
                          className="disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Photos
                        </button>
                        <button type="button" onClick={() => onOpenRemarks(job)} title="Add Remarks">
                          Remarks
                        </button>
                        <button
                          type="button"
                          disabled={!isOwner}
                          onClick={() => onPass(job)}
                          title={!isOwner ? "Only the assigned inspector can record a decision" : undefined}
                          className="disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Pass QC
                        </button>
                        <button
                          type="button"
                          disabled={!isOwner}
                          onClick={() => onFail(job)}
                          title={!isOwner ? "Only the assigned inspector can record a decision" : undefined}
                          className="disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Fail QC
                        </button>
                      </>
                    )}

                    {/* Terminal states: read-only */}
                    {!open && TERMINAL_STATUSES.includes(job.status as string) && (
                      <span className="text-slate-400">QC Completed</span>
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