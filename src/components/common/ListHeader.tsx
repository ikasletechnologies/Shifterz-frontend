"use client";

import { ReactNode } from "react";
import { Search, X } from "lucide-react";

interface ListHeaderProps {
  title: string;
  /** Name of the filter currently applied (usually the selected summary card). */
  filterLabel?: string;
  count: number;
  /** One line telling the user what this list is for / what to do next. */
  hint?: ReactNode;
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  /** Extra controls shown to the right of the search (date range, download...). */
  children?: ReactNode;
}

// Header bar above a list: what you're looking at, how many, and the search.
export function ListHeader({
  title,
  filterLabel,
  count,
  hint,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  children,
}: ListHeaderProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-4 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-sm font-bold text-slate-900">
          {title}{" "}
          <span className="font-normal text-slate-500">
            · {filterLabel ? `${filterLabel} ` : ""}({count})
          </span>
        </h2>
        {hint && <p className="text-xs text-slate-500 mt-0.5">{hint}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
          {searchValue && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
