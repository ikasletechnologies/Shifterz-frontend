"use client";

import { ArrowRight, Eye, Copy, ClipboardList } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { JobCard } from "../types/job-card.types";
import { JobTracking, useJobTracking } from "../hooks/useJobTracking";
import { hasTechnician } from "../lib/jobStage";
import { StatusText } from "@/components/common/StatusText";
import { PriorityBadge } from "./PriorityBadge";

interface JobCardTableProps {
  jobCards: JobCard[];
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

const actionButton =
  "keep-color inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-800 shadow-xs hover:bg-yellow-400 hover:border-yellow-400 hover:text-gray-900 transition-colors cursor-pointer whitespace-nowrap";

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
      <tr key={j.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100 last:border-b-0">
        <td className="whitespace-nowrap px-4 py-3.5">
          <button
            type="button"
            onClick={(e) => handleCopyId(j.id, e)}
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 hover:bg-yellow-100 text-slate-800 text-xs font-mono font-bold transition-colors cursor-pointer group"
            title="Click to copy Job ID"
          >
            <span>{j.id}</span>
            <Copy className="w-3 h-3 text-slate-400 group-hover:text-slate-700 transition-colors" />
          </button>
        </td>
        <td className="whitespace-nowrap px-4 py-3.5">
          <span className="font-bold text-xs uppercase tracking-wider text-slate-900 bg-slate-50 border border-slate-200/80 px-2 py-0.5 rounded">
            {j.vehicle || empty}
          </span>
        </td>
        <td className="max-w-[180px] truncate px-4 py-3.5 font-medium text-slate-800" title={j.customer}>
          {j.customer || empty}
        </td>
        <td className="whitespace-nowrap px-4 py-3.5 text-slate-600 text-xs">{phone || empty}</td>
        <td className="max-w-[180px] truncate px-4 py-3.5 font-medium text-slate-800 text-xs" title={j.service}>
          {j.service || empty}
        </td>
        <td className="max-w-[160px] truncate px-4 py-3.5 text-xs">
          {hasTechnician(j) ? (
            <span className="font-medium text-slate-800 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60" title={j.technician}>
              {j.technician}
            </span>
          ) : (
            <span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60 text-[11px]">
              Unassigned
            </span>
          )}
        </td>
        <td className="whitespace-nowrap px-4 py-3.5">
          <StatusText status={stage.label} tone={stage.tone} />
        </td>
        <td className="whitespace-nowrap px-4 py-3.5">
          {j.priority && j.priority.trim() !== "" ? <PriorityBadge priority={j.priority} /> : empty}
        </td>
        <td className="whitespace-nowrap px-4 py-3.5 text-xs text-slate-600">{formatDateStr(j.startDate)}</td>
        <td className="whitespace-nowrap px-4 py-3.5 text-xs text-slate-600">{formatDateStr(j.estCompletion || j.actualCompletion)}</td>
        <td className="max-w-[200px] truncate px-4 py-3.5 text-xs text-slate-500 italic" title={j.notes}>
          {j.notes && j.notes.trim() !== "" ? j.notes : empty}
        </td>
        <td className="whitespace-nowrap px-4 py-3.5 text-right">
          <div className="flex items-center justify-end gap-2.5">
            {action && (
              <button
                type="button"
                className={actionButton}
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
                className="inline-flex items-center justify-center p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 shadow-xs transition-colors cursor-pointer"
                title="View Details"
              >
                <Eye className="w-4 h-4" />
              </button>
            )}
          </div>
        </td>
      </tr>
    );
  };

  if (jobCards.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500 bg-white border border-slate-200 rounded-xl shadow-xs">
        <ClipboardList className="w-10 h-10 mx-auto text-slate-300 mb-3" />
        <p className="text-sm font-medium text-slate-700">No job cards found</p>
        <p className="text-xs text-slate-400 mt-1">Try adjusting your search or filter criteria</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl shadow-xs overflow-x-auto">
      <table className="data-table w-full min-w-[1300px] text-left text-xs">
        <thead>
          <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
            <th className="px-4 py-3">Job ID</th>
            <th className="px-4 py-3">Vehicle Number</th>
            <th className="px-4 py-3">Customer</th>
            <th className="px-4 py-3">Mobile</th>
            <th className="px-4 py-3">Service / Fault</th>
            <th className="px-4 py-3">Technician</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Priority</th>
            <th className="px-4 py-3">Started</th>
            <th className="px-4 py-3">Est. Completion</th>
            <th className="px-4 py-3">Notes</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>{jobCards.map(renderRow)}</tbody>
      </table>
    </div>
  );
}
