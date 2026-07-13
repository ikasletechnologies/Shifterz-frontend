"use client";

import { JobCardStats } from "../types/job-card.types";

interface JobCardHeaderProps {
  stats: JobCardStats;
  onNewJobCard: () => void;
}

export function JobCardHeader({ stats, onNewJobCard }: JobCardHeaderProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Job Cards</h1>
        <button
          onClick={onNewJobCard}
          className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
        >
          + New Job Card
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl border border-gray-100 border-l-4 border-l-yellow-500 p-4 shadow-sm flex flex-col justify-between h-24">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pending</span>
          <span className="text-2xl font-bold text-gray-900">{stats.pending}</span>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 border-l-4 border-l-blue-500 p-4 shadow-sm flex flex-col justify-between h-24">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">In Progress</span>
          <span className="text-2xl font-bold text-gray-900">{stats.inProgress}</span>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 border-l-4 border-l-green-500 p-4 shadow-sm flex flex-col justify-between h-24">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Completed</span>
          <span className="text-2xl font-bold text-green-500">{stats.completed}</span>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 border-l-4 border-l-red-500 p-4 shadow-sm flex flex-col justify-between h-24">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Cancelled</span>
          <span className="text-2xl font-bold text-red-500">{stats.cancelled}</span>
        </div>
      </div>
    </div>
  );
}
