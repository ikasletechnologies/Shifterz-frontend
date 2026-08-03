"use client";

import { useState, useEffect } from "react";
import { Search, X, Calendar } from "lucide-react";
import { toast } from "react-hot-toast";
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
  const [userRole, setUserRole] = useState<string>("");

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserRole(user.role || "");
      } catch {
        // Ignore parse error
      }
    }
  }, []);

  const getTodayISO = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleFromDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.value;
    const today = getTodayISO();
    if (selected && selected > today) {
      toast.error("Future dates are not allowed. Please select today or a past date.");
      if (onFromDateChange) onFromDateChange(today);
      return;
    }
    if (onFromDateChange) onFromDateChange(selected);
  };

  const handleToDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.value;
    const today = getTodayISO();
    if (selected && selected > today) {
      toast.error("Future dates are not allowed. Please select today or a past date.");
      if (onToDateChange) onToDateChange(today);
      return;
    }
    if (onToDateChange) onToDateChange(selected);
  };

  const roleUpper = (userRole || "").toUpperCase().replace(/[\s_]+/g, "_");
  const isServiceAdvisor = roleUpper.includes("SERVICE_ADVISOR");
  const isBillingExecutive = roleUpper.includes("BILLING") || roleUpper.includes("ACCOUNTANT");

  const isCardSelected = (name: string) => {
    return (selectedStatus || "All").toLowerCase() === name.toLowerCase();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-end gap-3 w-full">
        {/* Search Bar */}
        {onSearchChange && (
          <div className="relative flex-1 min-w-[200px] sm:min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by ID, vehicle, customer..."
              value={searchQuery || ""}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* From Date Filter */}
        {onFromDateChange && (
          <div className="flex items-center gap-1.5 bg-white border border-gray-300 rounded-lg px-2.5 py-2 shrink-0">
            <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">From:</span>
            <input
              type="date"
              value={fromDate || ""}
              max={getTodayISO()}
              onChange={handleFromDateChange}
              className="bg-transparent border-none text-xs text-gray-800 focus:outline-none cursor-pointer p-0 font-medium"
            />
            <button
              type="button"
              disabled={!fromDate}
              onClick={() => fromDate && onFromDateChange("")}
              className={`p-0.5 rounded transition-colors flex items-center justify-center shrink-0 ${
                fromDate
                  ? "text-gray-600 hover:text-gray-900 hover:bg-gray-100 cursor-pointer"
                  : "text-gray-300 cursor-not-allowed opacity-50"
              }`}
              title={fromDate ? "Clear From Date" : ""}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* To Date Filter */}
        {onToDateChange && (
          <div className="flex items-center gap-1.5 bg-white border border-gray-300 rounded-lg px-2.5 py-2 shrink-0">
            <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">To:</span>
            <input
              type="date"
              value={toDate || ""}
              max={getTodayISO()}
              onChange={handleToDateChange}
              className="bg-transparent border-none text-xs text-gray-800 focus:outline-none cursor-pointer p-0 font-medium"
            />
            <button
              type="button"
              disabled={!toDate}
              onClick={() => toDate && onToDateChange("")}
              className={`p-0.5 rounded transition-colors flex items-center justify-center shrink-0 ${
                toDate
                  ? "text-gray-600 hover:text-gray-900 hover:bg-gray-100 cursor-pointer"
                  : "text-gray-300 cursor-not-allowed opacity-50"
              }`}
              title={toDate ? "Clear To Date" : ""}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* New Job Card Button */}
        {!isServiceAdvisor && !isBillingExecutive && (
          <button
            onClick={onNewJobCard}
            className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-xs text-sm shrink-0 cursor-pointer"
          >
            + New Job Card
          </button>
        )}
      </div>

      {/* Status KPI Cards - 2 Rows of 5 Cards Each */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Row 1 */}
        {/* 1. All */}
        <button
          type="button"
          onClick={() => onStatusSelect?.("All")}
          className={`rounded-xl border p-4 shadow-xs flex flex-col justify-between h-24 text-left transition-all cursor-pointer ${
            isCardSelected("All")
              ? "bg-yellow-400 border-yellow-400 ring-2 ring-yellow-400 shadow-md"
              : "bg-white border-gray-100 hover:border-yellow-300 hover:shadow-xs"
          }`}
        >
          <span className={`text-[10px] font-bold uppercase tracking-wider ${isCardSelected("All") ? "text-gray-800" : "text-gray-400"}`}>All</span>
          <span className={`text-2xl font-bold ${isCardSelected("All") ? "text-gray-900" : "text-yellow-600"}`}>{stats.all}</span>
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
