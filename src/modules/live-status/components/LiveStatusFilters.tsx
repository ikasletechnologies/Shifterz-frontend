"use client";

import { Search, X } from "lucide-react";
import { LiveStage } from "../types/live-status.types";
import { LIVE_PRIORITIES, LIVE_STAGES } from "../constants/live-status.constants";

interface FranchiseOption {
  id: string;
  name: string;
}

interface LiveStatusFiltersProps {
  searchQuery: string;
  onSearchChange: (v: string) => void;
  stageFilter: LiveStage | "All";
  onStageChange: (v: LiveStage | "All") => void;
  priorityFilter: string;
  onPriorityChange: (v: string) => void;
  technicianFilter: string;
  onTechnicianChange: (v: string) => void;
  technicians: string[];
  fromDate: string;
  toDate: string;
  onFromDateChange: (v: string) => void;
  onToDateChange: (v: string) => void;
  franchises: FranchiseOption[];
  franchiseFilter: string;
  onFranchiseChange: (v: string) => void;
  showFranchiseFilter: boolean;
}

const selectClass =
  "px-2.5 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 text-xs font-semibold text-slate-700 shadow-2xs transition-all hover:border-slate-300 cursor-pointer shrink-0";

const dateInputClass =
  "px-2 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 text-xs font-semibold text-slate-700 shadow-2xs transition-all hover:border-slate-300 min-w-[125px] max-w-[135px] shrink-0";

export function LiveStatusFilters({
  searchQuery,
  onSearchChange,
  stageFilter,
  onStageChange,
  priorityFilter,
  onPriorityChange,
  technicianFilter,
  onTechnicianChange,
  technicians,
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  franchises,
  franchiseFilter,
  onFranchiseChange,
  showFranchiseFilter,
}: LiveStatusFiltersProps) {
  return (
    <div className="flex flex-wrap 2xl:flex-nowrap items-center justify-between gap-3 w-full bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
      {/* Left: Search Bar */}
      <div className="relative min-w-[200px] max-w-sm flex-1">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by vehicle, customer, or job card #..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-9 py-2 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 text-xs text-slate-800 placeholder-slate-400 transition-all font-medium"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Right: Filters Row */}
      <div className="flex flex-wrap items-center gap-2">
        <select value={stageFilter} onChange={(e) => onStageChange(e.target.value as LiveStage | "All")} className={selectClass}>
          <option value="All">All Stages</option>
          {LIVE_STAGES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select value={priorityFilter} onChange={(e) => onPriorityChange(e.target.value)} className={selectClass}>
          <option value="All">All Priorities</option>
          {LIVE_PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        <select value={technicianFilter} onChange={(e) => onTechnicianChange(e.target.value)} className={selectClass}>
          <option value="All">All Employees</option>
          {technicians.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        {showFranchiseFilter && (
          <select value={franchiseFilter} onChange={(e) => onFranchiseChange(e.target.value)} className={selectClass}>
            <option value="All">All Franchises</option>
            {franchises.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        )}

        {/* Date Filter: From Date & To Date always together side-by-side */}
        <div className="flex items-center gap-1.5 shrink-0">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => onFromDateChange(e.target.value)}
            className={dateInputClass}
            aria-label="From date"
          />
          <span className="text-slate-400 text-xs font-medium px-0.5">to</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => onToDateChange(e.target.value)}
            className={dateInputClass}
            aria-label="To date"
          />
        </div>
      </div>
    </div>
  );
}
