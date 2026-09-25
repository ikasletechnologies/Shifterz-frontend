"use client";

import { WorkshopJob } from "../types/workshop.types";
import { StatusText } from "@/components/common/StatusText";

interface WorkshopTableProps {
  jobs: WorkshopJob[];
  onStartWork: (job: WorkshopJob) => void;
  onPauseWork: (job: WorkshopJob) => void;
  onResumeWork: (job: WorkshopJob) => void;
  onCompleteWork: (job: WorkshopJob) => void;
  onUploadPhotos: (job: WorkshopJob) => void;
  onAddMaterial: (job: WorkshopJob) => void;
  onAddNotes: (job: WorkshopJob) => void;
}

const REWORK_STATUSES = ["QC Failed", "Rework", "Rework Required"];

// The single next step for a job, shown as the one highlighted button in its row.
const PRIMARY_BTN =
  "keep-color bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold text-xs px-3 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap";

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

export function WorkshopTable({
  jobs,
  onStartWork,
  onPauseWork,
  onResumeWork,
  onCompleteWork,
  onUploadPhotos,
  onAddMaterial,
  onAddNotes,
}: WorkshopTableProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
      <table className="data-table w-full min-w-[1200px] text-left">
        <thead>
          <tr>
            <th>Job Card</th>
            <th>Vehicle</th>
            <th>Customer</th>
            <th>Service</th>
            <th>Technician</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Started</th>
            <th>Est. Finish</th>
            <th className="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => {
            const isRework = REWORK_STATUSES.includes(job.status as string);
            const isWorking = job.status === "In Progress" || job.status === "Paused";

            return (
              <tr key={job.id}>
                <td className="whitespace-nowrap">{job.id}</td>
                <td className="whitespace-nowrap uppercase">{job.vehicle || "—"}</td>
                <td className="max-w-[160px] truncate">{job.customer || "—"}</td>
                <td className="max-w-[180px] truncate" title={job.service}>{job.service || "—"}</td>
                <td className="max-w-[160px] truncate">{job.technician || <span className="text-slate-400">Unassigned</span>}</td>
                <td className="whitespace-nowrap">{job.priority || "—"}</td>
                <td className="whitespace-nowrap">
                  <StatusText status={job.status} />
                </td>
                <td className="whitespace-nowrap">{formatDateTime(job.startedAt)}</td>
                <td className="whitespace-nowrap">{formatDate(job.estCompletion)}</td>
                <td className="whitespace-nowrap">
                  <div className="flex items-center justify-end gap-2">
                    {/* Secondary actions while the job is being worked on */}
                    {isWorking && (
                      <>
                        <button onClick={() => onUploadPhotos(job)} className="px-1" title="Upload work photos">
                          Photos
                        </button>
                        <button onClick={() => onAddMaterial(job)} className="px-1" title="Record parts / materials used">
                          Parts
                        </button>
                        <button onClick={() => onAddNotes(job)} className="px-1" title="Technician notes">
                          Notes
                        </button>
                      </>
                    )}
                    {job.status === "In Progress" && (
                      <button onClick={() => onPauseWork(job)} className="px-1" title="Pause work">
                        Pause
                      </button>
                    )}

                    {/* The next step */}
                    {job.status === "Assigned" && (
                      <button onClick={() => onStartWork(job)} className={PRIMARY_BTN}>
                        Start Work
                      </button>
                    )}
                    {isRework && (
                      <button onClick={() => onStartWork(job)} className={PRIMARY_BTN} title="QC sent this job back — fix the issues and complete it again">
                        Start Rework
                      </button>
                    )}
                    {job.status === "In Progress" && (
                      <button onClick={() => onCompleteWork(job)} className={PRIMARY_BTN}>
                        Complete
                      </button>
                    )}
                    {job.status === "Paused" && (
                      <button onClick={() => onResumeWork(job)} className={PRIMARY_BTN}>
                        Resume
                      </button>
                    )}
                    {/* A completed job goes straight into the QC queue. */}
                    {(job.status === "Completed" || job.status === "Waiting QC") && <span className="text-slate-400 text-sm">With QC</span>}
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
