"use client";

import { ArrowRight, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { JobCard } from "../types/job-card.types";
import { JobTracking, useJobTracking } from "../hooks/useJobTracking";
import { hasTechnician } from "../lib/jobStage";
import { StatusText } from "@/components/common/StatusText";

// Tracking board: the Status column is the job's current car-in → car-out
// stage, and the action links to the page where that step is done.
interface JobCardTableProps {
  jobCards: JobCard[];
  /** Pass from the page when it already tracks the jobs; otherwise resolved here. */
  trackingFor?: (job: JobCard) => JobTracking;
  onView?: (job: JobCard) => void;
  onEdit: (job: JobCard) => void;
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

// The stage action as a small outlined button; turns brand yellow on hover.
// `keep-color` stops the shared data-table style flattening it to a text link.
const actionButton =
  "keep-color inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-800 shadow-xs hover:bg-yellow-400 hover:border-yellow-400 hover:text-gray-900 transition-colors cursor-pointer";

const noInspectionCheck = () => false;

export function JobCardTable({ jobCards, trackingFor, onView, onEdit }: JobCardTableProps) {
  const router = useRouter();
  const own = useJobTracking(jobCards, noInspectionCheck, !trackingFor);
  const resolve = trackingFor ?? own.trackingFor;

  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    toast.success(`Copied Job ID: ${id}`);
  };

  const renderRow = (j: JobCard) => {
    const { stage } = resolve(j);
    const action = stage.action;
    const phone = j.phone || j.customerPhone;
    const empty = <span className="text-slate-400">—</span>;

    return (
      <tr key={j.id}>
        <td className="whitespace-nowrap">
          <button type="button" onClick={(e) => handleCopyId(j.id, e)} title="Click to copy Job ID">
            {j.id}
          </button>
        </td>
        <td className="whitespace-nowrap uppercase">{j.vehicle || empty}</td>
        <td className="max-w-[180px] truncate" title={j.customer}>
          {j.customer || empty}
        </td>
        <td className="whitespace-nowrap">{phone || empty}</td>
        <td className="max-w-[180px] truncate" title={j.service}>
          {j.service || empty}
        </td>
        <td className="max-w-[160px] truncate">
          {hasTechnician(j) ? j.technician : <span className="text-slate-400">Unassigned</span>}
        </td>
        <td className="whitespace-nowrap">
          <StatusText status={stage.label} tone={stage.tone} />
        </td>
        <td className="whitespace-nowrap">{j.priority && j.priority.trim() !== "" ? j.priority : empty}</td>
        <td className="whitespace-nowrap">{formatDateStr(j.startDate)}</td>
        <td className="whitespace-nowrap">{formatDateStr(j.estCompletion || j.actualCompletion)}</td>
        <td className="max-w-[200px] truncate" title={j.notes}>
          {j.notes && j.notes.trim() !== "" ? j.notes : empty}
        </td>
        <td className="whitespace-nowrap text-right">
          <div className="flex items-center justify-end gap-3">
            {action && (
              <button
                type="button"
                className={actionButton}
                onClick={() => (action.edit ? onEdit(j) : action.href && router.push(action.href))}
              >
                {action.label}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            {onView && (
              <button type="button" onClick={() => onView(j)} title="View Details">
                <Eye className="w-4 h-4" />
              </button>
            )}
          </div>
        </td>
      </tr>
    );
  };

  if (jobCards.length === 0) {
    return <div className="text-center py-16 text-slate-500 bg-white border border-slate-200 rounded-lg">No job cards found</div>;
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
      <table className="data-table w-full min-w-[1300px] text-left">
        <thead>
          <tr>
            <th>Job ID</th>
            <th>Vehicle Number</th>
            <th>Customer</th>
            <th>Mobile</th>
            <th>Service / Fault</th>
            <th>Technician</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Started</th>
            <th>Est. Completion</th>
            <th>Notes</th>
            <th className="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>{jobCards.map(renderRow)}</tbody>
      </table>
    </div>
  );
}
