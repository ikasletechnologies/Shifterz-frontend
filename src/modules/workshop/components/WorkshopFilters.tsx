"use client";

import { Search, X } from "lucide-react";
import { WORKSHOP_FILTERS } from "../constants/workshop.constants";

interface WorkshopFiltersProps {
  statusFilter: string;
  searchQuery: string;
  onStatusChange: (status: string) => void;
  onSearchChange: (query: string) => void;
}

export function WorkshopFilters({ statusFilter, searchQuery, onStatusChange, onSearchChange }: WorkshopFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
      <div className="rounded-lg px-2 py-1.5 flex items-center gap-1 flex-wrap" style={{ backgroundColor: "#ebebebff" }}>
        {WORKSHOP_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => onStatusChange(f)}
            className={`text-sm px-3 py-1 rounded-md transition-colors whitespace-nowrap ${
              statusFilter === f
                ? "bg-white text-gray-900 font-bold shadow-sm"
                : "text-gray-600 hover:text-gray-900 font-medium"
            }`}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="relative w-full max-w-sm">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by vehicle or customer..."
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
