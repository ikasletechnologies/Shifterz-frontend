"use client";

import { Search, X } from "lucide-react";
import { JOB_PRIORITIES } from "../constants/job-card.constants";

interface JobCardFiltersProps {
  priorityFilter: string;
  searchQuery: string;
  onPriorityChange: (priority: string) => void;
  onSearchChange: (query: string) => void;
}

export function JobCardFilters({ priorityFilter, searchQuery, onPriorityChange, onSearchChange }: JobCardFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
      <div className="rounded-lg px-2 py-1.5 flex items-center gap-1 w-fit" style={{ backgroundColor: "#ebebebff" }}>
        {["All", ...JOB_PRIORITIES].map((level) => (
          <button
            key={level}
            onClick={() => onPriorityChange(level)}
            className={`text-sm px-3 py-1 rounded-md transition-colors ${priorityFilter === level
              ? "bg-white text-gray-900 font-bold shadow-sm"
              : "text-gray-600 hover:text-gray-900 font-medium"
              }`}
          >
            {level}
          </button>
        ))}
      </div>
      <div className="relative w-full max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by ID, vehicle, customer, or technician..."
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
    </div>
  );
}
