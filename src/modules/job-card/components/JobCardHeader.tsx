"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { toast } from "react-hot-toast";
import { SummaryCard } from "@/components/common/SummaryCard";
import { StatusTone } from "@/lib/statusTone";

export interface JobCardFilterCard {
  id: string;
  label: string;
  count: number;
  tone?: StatusTone;
}

interface JobCardHeaderProps {
  /** Clickable summary cards; each filters the list by its id. */
  cards?: JobCardFilterCard[];
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
  cards = [],
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

  const { from, to } = getDateRange();
  const fromISO = from ? `${from.getFullYear()}-${(from.getMonth()+1).toString().padStart(2,"0")}-${from.getDate().toString().padStart(2,"0")}` : "";
  const toISO = to ? `${to.getFullYear()}-${(to.getMonth()+1).toString().padStart(2,"0")}-${to.getDate().toString().padStart(2,"0")}` : "";

  // Expose date range to parent whenever it changes (must run after render, not during it)
  useEffect(() => {
    if (onFromDateChange && fromISO !== (fromDate || "")) onFromDateChange(fromISO);
    if (onToDateChange && toISO !== (toDate || "")) onToDateChange(toISO);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromISO, toISO]);

  const handleCustomFromDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.value;
    const today = getTodayISO();
    if (selected && selected > today) {
      toast.error("Future dates are not allowed. Please select today or a past date.");
      setCustomFromDate(today);
      return;
    }
    setCustomFromDate(selected);
  };

  const handleCustomToDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.value;
    const today = getTodayISO();
    if (selected && selected > today) {
      toast.error("Future dates are not allowed. Please select today or a past date.");
      setCustomToDate(today);
      return;
    }
    setCustomToDate(selected);
  };

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
                          <input type="date" value={customFromDate} max={getTodayISO()} onChange={handleCustomFromDateChange} className="bg-transparent border-none text-xs text-gray-800 outline-none w-full" />
                          {customFromDate && <button type="button" onClick={() => setCustomFromDate("")} className="text-gray-400 hover:text-gray-600 shrink-0"><X className="w-3 h-3" /></button>}
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">To</label>
                        <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5">
                          <input type="date" value={customToDate} max={getTodayISO()} onChange={handleCustomToDateChange} className="bg-transparent border-none text-xs text-gray-800 outline-none w-full" />
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

      {cards.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {cards.map((c) => (
            <SummaryCard
              key={c.id}
              label={c.label}
              value={c.count}
              tone={c.tone}
              active={isCardSelected(c.id)}
              onClick={onStatusSelect ? () => onStatusSelect(c.id) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
