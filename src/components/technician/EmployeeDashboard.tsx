"use client";

import { useState, useEffect } from "react";
import { apiCall } from "@/lib/api";
import { Loader2, Car, Search, X } from "lucide-react";
import JobActionDialog from "./JobActionDialog";
import { SummaryCard } from "@/components/common/SummaryCard";
import { toast } from "react-hot-toast";
import { StatusText } from "@/components/common/StatusText";

export default function EmployeeDashboard() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

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
      setFromDate(today);
      return;
    }
    setFromDate(selected);
  };

  const handleToDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.value;
    const today = getTodayISO();
    if (selected && selected > today) {
      toast.error("Future dates are not allowed. Please select today or a past date.");
      setToDate(today);
      return;
    }
    setToDate(selected);
  };

  const fetchJobs = async () => {
    try {
      const data = await apiCall("/jobs");
      // Sort jobs: Latest priority/date first
      const sorted = data.sort((a: any, b: any) => {
        if (a.priority === "High" && b.priority !== "High") return -1;
        if (a.priority !== "High" && b.priority === "High") return 1;
        return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
      });
      setJobs(sorted);
    } catch (error) {
      console.error("Failed to fetch jobs", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const userRole = (() => {
    try {
      if (typeof window !== "undefined") {
        const u = localStorage.getItem("user");
        if (u) return (JSON.parse(u).role || "").toUpperCase().replace(/[\s_]+/g, "_");
      }
    } catch {
      // Ignore
    }
    return "";
  })();

  const isQualityInspector =
    userRole === "QUALITY_INSPECTOR" ||
    userRole === "QUALITY_INSPECTION" ||
    userRole === "QC_INSPECTOR" ||
    userRole === "QC" ||
    userRole === "QUALITY_ASSURANCE";

  const [activeFilter, setActiveFilter] = useState<string>("All");

  const isWaitingParts = (s?: string) => {
    if (!s) return false;
    const norm = s.trim().toLowerCase();
    return norm === "waiting for parts" || norm === "waiting material" || norm === "waiting parts" || (norm.includes("waiting") && norm.includes("part"));
  };

  const isCompletedJob = (s?: string) => {
    if (!s) return false;
    const norm = s.trim().toLowerCase();
    return norm === "completed" || norm === "qc passed" || norm === "delivered" || norm === "ready for billing" || norm === "out";
  };

  const myAssignedCount = jobs.length;
  const assignedCount = jobs.filter((j) => j.status === "Assigned" || j.status === "Pending").length;
  const inProgressCount = jobs.filter((j) => j.status === "In Progress").length;
  const waitingPartsCount = jobs.filter((j) => isWaitingParts(j.status)).length;
  const completedCount = jobs.filter((j) => isCompletedJob(j.status)).length;

  const filteredJobs = jobs.filter((j) => {
    if (isQualityInspector) {
      const isCompletedStatus =
        j.status === "Completed" ||
        j.status === "QC Pending" ||
        j.status === "QC Passed" ||
        j.status === "Ready For Billing";
      if (!isCompletedStatus) return false;
    }

    if (activeFilter === "Assigned") {
      if (j.status !== "Assigned" && j.status !== "Pending") return false;
    } else if (activeFilter === "In Progress") {
      if (j.status !== "In Progress") return false;
    } else if (activeFilter === "Waiting for Parts") {
      if (!isWaitingParts(j.status)) return false;
    } else if (activeFilter === "Completed") {
      if (!isCompletedJob(j.status)) return false;
    }

    // Date range filter (reused from Car In module)
    const jobDateRaw = j.startDate || j.createdAt || j.inTime;
    if (jobDateRaw) {
      const jobDate = new Date(jobDateRaw);
      if (!isNaN(jobDate.getTime())) {
        if (fromDate) {
          const start = new Date(fromDate + "T00:00:00");
          if (jobDate < start) return false;
        }
        if (toDate) {
          const end = new Date(toDate + "T23:59:59.999");
          if (jobDate > end) return false;
        }
      }
    }

    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (j.id && j.id.toLowerCase().includes(q)) ||
      (j.vehicle && j.vehicle.toLowerCase().includes(q)) ||
      (j.service && j.service.toLowerCase().includes(q)) ||
      (j.customer && j.customer.toLowerCase().includes(q)) ||
      (j.technician && j.technician.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Status Filter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {([
          { key: "Assigned", value: assignedCount },
          { key: "In Progress", value: inProgressCount },
          { key: "Waiting for Parts", value: waitingPartsCount },
          { key: "Completed", value: completedCount },
        ] as const).map((card) => (
          <SummaryCard
            key={card.key}
            label={card.key}
            value={card.value}
            active={activeFilter === card.key}
            tone={card.key === "Completed" ? "good" : "neutral"}
            onClick={() => setActiveFilter((prev) => (prev === card.key ? "All" : card.key))}
          />
        ))}
      </div>

      {/* Filter Row: Left-Aligned Search Bar & Right-Aligned Car In Date Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Left-aligned Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search vehicle or service..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-10 py-2 border border-gray-300 rounded-xl w-full focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none bg-white text-sm"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Right-aligned Date Filter (Reused from Car In module) */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* From Date Filter */}
          <div className="flex items-center gap-1.5 bg-white border border-gray-300 rounded-lg px-2.5 py-2 shrink-0 shadow-2xs">
            <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">From:</span>
            <input
              type="date"
              value={fromDate}
              max={getTodayISO()}
              onChange={handleFromDateChange}
              className="bg-transparent border-none text-xs text-gray-800 focus:outline-none cursor-pointer p-0"
            />
            <button
              type="button"
              disabled={!fromDate}
              onClick={() => fromDate && setFromDate("")}
              className={`p-0.5 rounded transition-colors flex items-center justify-center shrink-0 ${fromDate
                  ? "text-gray-600 hover:text-gray-900 hover:bg-gray-100 cursor-pointer"
                  : "text-gray-300 cursor-not-allowed opacity-50"
                }`}
              title={fromDate ? "Clear From Date" : ""}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* To Date Filter */}
          <div className="flex items-center gap-1.5 bg-white border border-gray-300 rounded-lg px-2.5 py-2 shrink-0 shadow-2xs">
            <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">To:</span>
            <input
              type="date"
              value={toDate}
              max={getTodayISO()}
              onChange={handleToDateChange}
              className="bg-transparent border-none text-xs text-gray-800 focus:outline-none cursor-pointer p-0"
            />
            <button
              type="button"
              disabled={!toDate}
              onClick={() => toDate && setToDate("")}
              className={`p-0.5 rounded transition-colors flex items-center justify-center shrink-0 ${toDate
                  ? "text-gray-600 hover:text-gray-900 hover:bg-gray-100 cursor-pointer"
                  : "text-gray-300 cursor-not-allowed opacity-50"
                }`}
              title={toDate ? "Clear To Date" : ""}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center text-slate-500">No jobs assigned</div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
          <table className="data-table w-full min-w-[1100px] text-left">
            <thead>
              <tr>
                <th>Job ID</th>
                <th>Vehicle No</th>
                <th>Service</th>
                <th>Priority</th>
                <th>Technician</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>Started</th>
                <th>Est. Completion</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.map((job) => (
                <tr key={job.id} onClick={() => setSelectedJob(job)} className="cursor-pointer">
                  <td className="whitespace-nowrap">{job.id}</td>
                  <td className="whitespace-nowrap uppercase">{job.vehicle}</td>
                  <td className="max-w-[180px] truncate">{job.service}</td>
                  <td className="whitespace-nowrap">{job.priority || "—"}</td>
                  <td className="max-w-[160px] truncate">{job.technician || "Unassigned"}</td>
                  <td className="max-w-[180px] truncate">{job.customer || "Walk-in"}</td>
                  <td className="whitespace-nowrap">{job.phone || job.customerPhone || "—"}</td>
                  <td className="whitespace-nowrap">
                    {new Date(job.startDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                  <td className="whitespace-nowrap">
                    {new Date(job.estCompletion).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                  <td className="whitespace-nowrap"><StatusText status={job.status} /></td>
                  <td className="whitespace-nowrap text-right">
                    <button type="button" onClick={(e) => { e.stopPropagation(); setSelectedJob(job); }}>
                      Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedJob && (
        <JobActionDialog
          job={selectedJob}
          isOpen={true}
          onClose={() => {
            setSelectedJob(null);
            fetchJobs();
          }}
        />
      )}
    </div>
  );
}
