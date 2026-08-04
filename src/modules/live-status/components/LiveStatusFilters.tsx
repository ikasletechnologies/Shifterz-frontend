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
  "px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm text-gray-700";

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
    <div className="flex flex-col gap-3">
      <div className="relative w-full max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by vehicle, customer, or job card #..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-9 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3 items-center">
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

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => onFromDateChange(e.target.value)}
            className={selectClass}
            aria-label="From date"
          />
          <span className="text-gray-400 text-sm">to</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => onToDateChange(e.target.value)}
            className={selectClass}
            aria-label="To date"
          />
        </div>
      </div>
    </div>
  );
}
