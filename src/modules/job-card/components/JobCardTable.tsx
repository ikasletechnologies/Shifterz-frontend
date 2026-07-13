"use client";

import { Edit, Trash2 } from "lucide-react";
import { JobCard } from "../types/job-card.types";
import { PriorityBadge } from "./PriorityBadge";
import { JobStatusBadge } from "./JobStatusBadge";

interface JobCardTableProps {
  jobCards: JobCard[];
  onEdit: (job: JobCard) => void;
  onDelete: (id: string) => void;
}

export function JobCardTable({ jobCards, onEdit, onDelete }: JobCardTableProps) {
  if (jobCards.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-100">
        No job cards found
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left min-w-[900px]">
          <thead className="bg-gray-50/50 border-b border-gray-100 text-xs text-gray-800 uppercase font-bold tracking-wider">
            <tr>
              <th className="px-4 py-4 whitespace-nowrap">Job ID</th>
              <th className="px-4 py-4 whitespace-nowrap">Vehicle</th>
              <th className="px-4 py-4 whitespace-nowrap">Customer</th>
              <th className="px-4 py-4 whitespace-nowrap">Service</th>
              <th className="px-4 py-4 whitespace-nowrap">Technician</th>
              <th className="px-4 py-4 whitespace-nowrap">Priority</th>
              <th className="px-4 py-4 whitespace-nowrap">Start</th>
              <th className="px-4 py-4 whitespace-nowrap">Est. Completion</th>
              <th className="px-4 py-4 whitespace-nowrap">Actual</th>
              <th className="px-4 py-4 whitespace-nowrap">Status</th>
              <th className="px-4 py-4 whitespace-nowrap">Notes</th>
              <th className="px-4 py-4 text-right whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {jobCards.map((j) => (
              <tr key={j.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-4 font-mono text-xs font-bold whitespace-nowrap" style={{ color: "#F0B100" }}>{j.id}</td>
                <td className="px-4 py-4 font-bold text-gray-900 whitespace-nowrap">{j.vehicle}</td>
                <td className="px-4 py-4 text-gray-600 whitespace-nowrap">{j.customer}</td>
                <td className="px-4 py-4 text-gray-600">{j.service}</td>
                <td className="px-4 py-4 text-gray-600 whitespace-nowrap">{j.technician}</td>
                <td className="px-4 py-4">
                  <PriorityBadge priority={j.priority} />
                </td>
                <td className="px-4 py-4 text-gray-600 whitespace-nowrap">{j.startDate}</td>
                <td className="px-4 py-4 text-gray-600 whitespace-nowrap">{j.estCompletion}</td>
                <td className="px-4 py-4 text-gray-600 whitespace-nowrap">{j.actualCompletion}</td>
                <td className="px-4 py-4">
                  <JobStatusBadge status={j.status} />
                </td>
                <td className="px-4 py-4 text-gray-500 text-xs max-w-[120px] truncate">{j.notes}</td>
                <td className="px-4 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEdit(j)}
                      className="p-1.5 hover:bg-blue-50 rounded-md text-blue-500 transition-colors"
                      title="Edit job card"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(j.id)}
                      className="p-1.5 hover:bg-red-50 rounded-md text-red-400 transition-colors"
                      title="Delete job card"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
