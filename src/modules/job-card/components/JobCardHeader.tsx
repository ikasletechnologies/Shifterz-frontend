"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { JobCardStats } from "../types/job-card.types";

interface JobCardHeaderProps {
  stats: JobCardStats;
  onNewJobCard: () => void;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  fromDate?: string;
  onFromDateChange?: (val: string) => void;
  toDate?: string;
  onToDateChange?: (val: string) => void;
  selectedStatus?: string;
  onStatusSelect?: (status: string) => void;
}

export function JobCardHeader({
  stats,
  onNewJobCard,
  searchQuery,
  onSearchChange,
  fromDate,
  onFromDateChange,
  toDate,
  onToDateChange,
  selectedStatus = "All",
  onStatusSelect,
}: JobCardHeaderProps) {
  const [periodFilter, setPeriodFilter] = useState("All");
  const [customFromDate, setCustomFromDate] = useState("");
  const [customToDate, setCustomToDate] = useState("");

  const getTodayISO = () => {
    const d = new Date();
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
  };

  const getDateRange = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (periodFilter === "Today") {
      return { from: today, to: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999) };
    }
    if (periodFilter === "Yesterday") {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return { from: yesterday, to: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999) };
    }
    if (periodFilter === "Custom") {
      const from = customFromDate ? new Date(customFromDate + "T00:00:00") : null;
      const to = customToDate ? new Date(customToDate + "T23:59:59.999") : null;
      return { from, to };
    }
    return { from: null, to: null };
  };

  // Expose date range to parent whenever it changes
  const { from, to } = getDateRange();
  const fromISO = from ? `${from.getFullYear()}-${(from.getMonth()+1).toString().padStart(2,"0")}-${from.getDate().toString().padStart(2,"0")}` : "";
  const toISO = to ? `${to.getFullYear()}-${(to.getMonth()+1).toString().padStart(2,"0")}-${to.getDate().toString().padStart(2,"0")}` : "";
  if (onFromDateChange && fromISO !== (fromDate || "")) onFromDateChange(fromISO);
  if (onToDateChange && toISO !== (toDate || "")) onToDateChange(toISO);

  const storedUser = typeof window !== "undefined" ? (() => { try { const u = localStorage.getItem("user"); return u ? JSON.parse(u) : null; } catch { return null; } })() : null;
  const storedRole = ((storedUser?.role || "")).toUpperCase().replace(/[\s_]+/g, "_");
  const isServiceAdvisor = storedRole.includes("SERVICE_ADVISOR");
  const isBillingExecutive = storedRole.includes("BILLING") || storedRole.includes("ACCOUNTANT");
  const isCardSelected = (name: string) => (selectedStatus || "All").toLowerCase() === name.toLowerCase();

  return (
    <div className="space-y-6">
      <div className="bg-white px-4 py-3 rounded-xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        {/* Search */}
        {onSearchChange && (
          <div className="relative flex-1 min-w-[200px] w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by ID, vehicle, customer..."
              value={searchQuery || ""}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
            />
            {searchQuery && (
              <button onClick={() => onSearchChange("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 shrink-0">
          {/* Period pill tabs */}
          <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-1">
            {["All", "Today", "Yesterday", "Custom"].map((period) => (
              <div key={period} className="relative">
                <button
                  onClick={() => setPeriodFilter(period)}
                  className={`text-sm px-3 py-1 rounded-md font-medium transition-all whitespace-nowrap ${
                    periodFilter === period
                      ? "bg-white text-gray-900 font-semibold shadow-sm"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  {period}
                </button>

                {period === "Custom" && periodFilter === "Custom" && (
                  <div className="absolute top-full right-0 mt-2 z-50 bg-white border border-gray-200 p-4 rounded-xl shadow-xl animate-in fade-in slide-in-from-top-2 duration-150 min-w-[280px]">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-gray-800">Custom Date Range</span>
                      {(customFromDate || customToDate) && (
                        <button type="button" onClick={() => { setCustomFromDate(""); setCustomToDate(""); }} className="text-[11px] font-semibold text-yellow-600 hover:underline">Clear All</button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">From</label>
                        <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5">
                          <input type="date" value={customFromDate} max={getTodayISO()} onChange={(e) => setCustomFromDate(e.target.value)} className="bg-transparent border-none text-xs text-gray-800 outline-none w-full" />
                          {customFromDate && <button type="button" onClick={() => setCustomFromDate("")} className="text-gray-400 hover:text-gray-600 shrink-0"><X className="w-3 h-3" /></button>}
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">To</label>
                        <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5">
                          <input type="date" value={customToDate} max={getTodayISO()} onChange={(e) => setCustomToDate(e.target.value)} className="bg-transparent border-none text-xs text-gray-800 outline-none w-full" />
                          {customToDate && <button type="button" onClick={() => setCustomToDate("")} className="text-gray-400 hover:text-gray-600 shrink-0"><X className="w-3 h-3" /></button>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* New Job Card */}
          {!isServiceAdvisor && !isBillingExecutive && (
            <button
              onClick={onNewJobCard}
              className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-xs text-sm shrink-0 cursor-pointer"
            >
              + New Job Card
            </button>
          )}
        </div>
      </div>

      {/* Status KPI Cards - 2 Rows of 5 Cards Each */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* 1. All */}
        <button
          type="button"
          onClick={() => onStatusSelect?.("All")}
          className={`rounded-xl border p-4 shadow-xs flex flex-col justify-between h-24 text-left transition-all cursor-pointer ${
            isCardSelected("All")
              ? "bg-yellow-50 border-yellow-400 ring-2 ring-yellow-400 shadow-md"
              : "bg-white border-gray-100 hover:border-yellow-300 hover:shadow-xs"
          }`}
        >
          <span className={`text-[10px] font-bold uppercase tracking-wider ${isCardSelected("All") ? "text-yellow-800" : "text-gray-400"}`}>All</span>
          <span className="text-2xl font-bold text-yellow-600">{stats.all}</span>
        </button>

        {/* 2. Assigned */}
        <button
          type="button"
          onClick={() => onStatusSelect?.("Assigned")}
          className={`rounded-xl border p-4 shadow-xs flex flex-col justify-between h-24 text-left transition-all cursor-pointer ${
            isCardSelected("Assigned")
              ? "bg-blue-50 border-blue-500 ring-2 ring-blue-500 shadow-md"
              : "bg-white border-gray-100 hover:border-blue-200 hover:shadow-xs"
          }`}
        >
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Assigned</span>
          <span className="text-2xl font-bold text-blue-600">{stats.assigned}</span>
        </button>

        {/* 3. Unassigned */}
        <button
          type="button"
          onClick={() => onStatusSelect?.("Unassigned")}
          className={`rounded-xl border p-4 shadow-xs flex flex-col justify-between h-24 text-left transition-all cursor-pointer ${
            isCardSelected("Unassigned")
              ? "bg-amber-50 border-amber-500 ring-2 ring-amber-500 shadow-md"
              : "bg-white border-gray-100 hover:border-amber-200 hover:shadow-xs"
          }`}
        >
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Unassigned</span>
          <span className="text-2xl font-bold text-amber-500">{stats.unassigned}</span>
        </button>

        {/* 4. In Progress */}
        <button
          type="button"
          onClick={() => onStatusSelect?.("In Progress")}
          className={`rounded-xl border p-4 shadow-xs flex flex-col justify-between h-24 text-left transition-all cursor-pointer ${
            isCardSelected("In Progress")
              ? "bg-sky-50 border-sky-500 ring-2 ring-sky-500 shadow-md"
              : "bg-white border-gray-100 hover:border-sky-200 hover:shadow-xs"
          }`}
        >
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">In Progress</span>
          <span className="text-2xl font-bold text-sky-600">{stats.inProgress}</span>
        </button>

        {/* 5. Completed */}
        <button
          type="button"
          onClick={() => onStatusSelect?.("Completed")}
          className={`rounded-xl border p-4 shadow-xs flex flex-col justify-between h-24 text-left transition-all cursor-pointer ${
            isCardSelected("Completed")
              ? "bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500 shadow-md"
              : "bg-white border-gray-100 hover:border-emerald-200 hover:shadow-xs"
          }`}
        >
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Completed</span>
          <span className="text-2xl font-bold text-emerald-500">{stats.completed}</span>
        </button>

        {/* Row 2 */}
        {/* 6. Review for QC */}
        <button
          type="button"
          onClick={() => onStatusSelect?.("Review for QC")}
          className={`rounded-xl border p-4 shadow-xs flex flex-col justify-between h-24 text-left transition-all cursor-pointer ${
            isCardSelected("Review for QC")
              ? "bg-purple-50 border-purple-500 ring-2 ring-purple-500 shadow-md"
              : "bg-white border-gray-100 hover:border-purple-200 hover:shadow-xs"
          }`}
        >
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Review for QC</span>
          <span className="text-2xl font-bold text-purple-600">{stats.reviewForQC}</span>
        </button>

        {/* 7. Rework */}
        <button
          type="button"
          onClick={() => onStatusSelect?.("Rework")}
          className={`rounded-xl border p-4 shadow-xs flex flex-col justify-between h-24 text-left transition-all cursor-pointer ${
            isCardSelected("Rework")
              ? "bg-rose-50 border-rose-500 ring-2 ring-rose-500 shadow-md"
              : "bg-white border-gray-100 hover:border-rose-200 hover:shadow-xs"
          }`}
        >
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Rework</span>
          <span className="text-2xl font-bold text-rose-500">{stats.rework}</span>
        </button>

        {/* 8. Ready for Billing */}
        <button
          type="button"
          onClick={() => onStatusSelect?.("Ready for Billing")}
          className={`rounded-xl border p-4 shadow-xs flex flex-col justify-between h-24 text-left transition-all cursor-pointer ${
            isCardSelected("Ready for Billing")
              ? "bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500 shadow-md"
              : "bg-white border-gray-100 hover:border-indigo-200 hover:shadow-xs"
          }`}
        >
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Ready for Billing</span>
          <span className="text-2xl font-bold text-indigo-600">{stats.readyForBilling}</span>
        </button>

        {/* 9. Delivered */}
        <button
          type="button"
          onClick={() => onStatusSelect?.("Delivered")}
          className={`rounded-xl border p-4 shadow-xs flex flex-col justify-between h-24 text-left transition-all cursor-pointer ${
            isCardSelected("Delivered")
              ? "bg-teal-50 border-teal-500 ring-2 ring-teal-500 shadow-md"
              : "bg-white border-gray-100 hover:border-teal-200 hover:shadow-xs"
          }`}
        >
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Delivered</span>
          <span className="text-2xl font-bold text-teal-600">{stats.delivered}</span>
        </button>

        {/* 10. Cancelled */}
        <button
          type="button"
          onClick={() => onStatusSelect?.("Cancelled")}
          className={`rounded-xl border p-4 shadow-xs flex flex-col justify-between h-24 text-left transition-all cursor-pointer ${
            isCardSelected("Cancelled")
              ? "bg-red-50 border-red-500 ring-2 ring-red-500 shadow-md"
              : "bg-white border-gray-100 hover:border-red-200 hover:shadow-xs"
          }`}
        >
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Cancelled</span>
          <span className="text-2xl font-bold text-red-500">{stats.cancelled}</span>
        </button>
      </div>
    </div>
  );
}
