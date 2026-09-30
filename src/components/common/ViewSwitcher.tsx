"use client";

import React from "react";
import { LayoutGrid, Table } from "lucide-react";

export interface ViewSwitcherProps {
  viewMode: "tabs" | "table";
  onViewModeChange: (mode: "tabs" | "table") => void;
  count?: number;
  label?: string;
  rightContent?: React.ReactNode;
  tabsLabel?: string;
  tableLabel?: string;
  className?: string;
}

export function ViewSwitcher({
  viewMode,
  onViewModeChange,
  count,
  label = "records",
  rightContent,
  tabsLabel = "Tabs View",
  tableLabel = "Table View",
  className = "",
}: ViewSwitcherProps) {
  return (
    <div
      className={`bg-white px-4 py-2.5 rounded-xl border border-gray-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 ${className}`}
    >
      <div className="flex items-center gap-2.5">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider hidden sm:inline-block">
          View:
        </span>
        <div
          className="inline-flex p-1 bg-gray-100 rounded-lg border border-gray-200/60"
          role="tablist"
          aria-label="View switcher"
        >
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === "tabs"}
            onClick={() => onViewModeChange("tabs")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              viewMode === "tabs"
                ? "bg-yellow-400 text-gray-900 shadow-xs font-bold"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/60"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>{tabsLabel}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={viewMode === "table"}
            onClick={() => onViewModeChange("table")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              viewMode === "table"
                ? "bg-yellow-400 text-gray-900 shadow-xs font-bold"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/60"
            }`}
          >
            <Table className="w-4 h-4" />
            <span>{tableLabel}</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
        {count !== undefined && (
          <span>
            Showing <strong className="text-gray-900">{count}</strong> {label}
          </span>
        )}
        {rightContent}
      </div>
    </div>
  );
}

export default ViewSwitcher;
