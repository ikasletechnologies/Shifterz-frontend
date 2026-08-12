"use client";

import { useState, useEffect } from "react";
import { apiCall } from "@/lib/api";
import { Loader2, Car, Calendar, CheckCircle2, Clock, MapPin, Search, X, User, Phone, Wrench } from "lucide-react";
import { PriorityBadge } from "@/modules/job-card/components/PriorityBadge";
import JobActionDialog from "./JobActionDialog";
import { toast } from "react-hot-toast";

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "In Progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Completed":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

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

        <button
          type="button"
          onClick={() => setActiveFilter((prev) => (prev === "Assigned" ? "All" : "Assigned"))}
          className={`p-4 rounded-2xl border text-center transition-all cursor-pointer ${
            activeFilter === "Assigned"
              ? "bg-purple-600 text-white border-purple-600 shadow-md ring-2 ring-purple-600"
              : "bg-purple-50 text-purple-900 border-purple-100 hover:border-purple-200 hover:bg-purple-100/70"
          }`}
        >
          <div className="text-2xl font-black mb-1">{assignedCount}</div>
          <div className={`text-xs font-bold uppercase tracking-wide ${activeFilter === "Assigned" ? "text-purple-100" : "text-purple-700"}`}>
            Assigned
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter((prev) => (prev === "In Progress" ? "All" : "In Progress"))}
          className={`p-4 rounded-2xl border text-center transition-all cursor-pointer ${
            activeFilter === "In Progress"
              ? "bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-600"
              : "bg-blue-50 text-blue-900 border-blue-100 hover:border-blue-200 hover:bg-blue-100/70"
          }`}
        >
          <div className="text-2xl font-black mb-1">{inProgressCount}</div>
          <div className={`text-xs font-bold uppercase tracking-wide ${activeFilter === "In Progress" ? "text-blue-100" : "text-blue-700"}`}>
            In Progress
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter((prev) => (prev === "Waiting for Parts" ? "All" : "Waiting for Parts"))}
          className={`p-4 rounded-2xl border text-center transition-all cursor-pointer ${
            activeFilter === "Waiting for Parts"
              ? "bg-amber-500 text-white border-amber-500 shadow-md ring-2 ring-amber-500"
              : "bg-amber-50 text-amber-900 border-amber-100 hover:border-amber-200 hover:bg-amber-100/70"
          }`}
        >
          <div className="text-2xl font-black mb-1">{waitingPartsCount}</div>
          <div className={`text-xs font-bold uppercase tracking-wide ${activeFilter === "Waiting for Parts" ? "text-amber-100" : "text-amber-700"}`}>
            Waiting for Parts
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter((prev) => (prev === "Completed" ? "All" : "Completed"))}
          className={`p-4 rounded-2xl border text-center transition-all cursor-pointer ${
            activeFilter === "Completed"
              ? "bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-600"
              : "bg-emerald-50 text-emerald-900 border-emerald-100 hover:border-emerald-200 hover:bg-emerald-100/70"
          }`}
        >
          <div className="text-2xl font-black mb-1">{completedCount}</div>
          <div className={`text-xs font-bold uppercase tracking-wide ${activeFilter === "Completed" ? "text-emerald-100" : "text-emerald-700"}`}>
            Completed
          </div>
        </button>
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
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border p-12 text-center">
          <Car className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">No jobs assigned</h3>
          <p className="text-gray-500">You don't have any pending jobs at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map((job) => {
            const isCompleted =
              job.status === "Completed" ||
              job.status === "QC Passed" ||
              job.status === "Delivered" ||
              job.status === "Ready For Billing" ||
              job.status === "Out";

            return (
              <div
                key={job.id}
                onClick={() => setSelectedJob(job)}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow cursor-pointer group relative overflow-hidden"
              >
                {isCompleted && (
                  <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg z-10">
                    Completed
                  </div>
                )}

                {/* Header Section */}
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono font-black text-amber-600 tracking-wider">
                    {job.id}
                  </span>
                  {!isCompleted && (
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getStatusColor(job.status)}`}>
                      {job.status}
                    </span>
                  )}
                </div>

                <div className="space-y-3 text-xs px-1">
                  {/* Vehicle */}
                  <div className="grid grid-cols-[120px_20px_1fr] items-center py-1">
                    <div className="flex items-center gap-2 text-gray-500 font-medium shrink-0">
                      <Car className="w-4 h-4 text-gray-400 shrink-0" />
                      <span>Vehicle No</span>
                    </div>
                    <span className="text-gray-300 font-bold text-center mt-0.5">:</span>
                    <p className="font-bold text-gray-900 uppercase tracking-wide text-left truncate">{job.vehicle}</p>
                  </div>

                  {/* Service */}
                  <div className="grid grid-cols-[120px_20px_1fr] items-center py-1">
                    <div className="flex items-center gap-2 text-gray-500 font-medium shrink-0">
                      <Wrench className="w-4 h-4 text-gray-400 shrink-0" />
                      <span>Service</span>
                    </div>
                    <span className="text-gray-300 font-bold text-center mt-0.5">:</span>
                    <p className="font-bold text-gray-900 text-left truncate">{job.service}</p>
                  </div>

                  {/* Priority */}
                  <div className="grid grid-cols-[120px_20px_1fr] items-center py-1">
                    <div className="flex items-center gap-2 text-gray-500 font-medium shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-gray-400 shrink-0" />
                      <span>Priority</span>
                    </div>
                    <span className="text-gray-300 font-bold text-center mt-0.5">:</span>
                    <div className="text-left">
                      {job.priority ? <PriorityBadge priority={job.priority} /> : <span className="font-bold text-gray-900">—</span>}
                    </div>
                  </div>

                  {/* Technician */}
                  <div className="grid grid-cols-[120px_20px_1fr] items-center py-1">
                    <div className="flex items-center gap-2 text-gray-500 font-medium shrink-0">
                      <User className="w-4 h-4 text-gray-400 shrink-0" />
                      <span>Technician</span>
                    </div>
                    <span className="text-gray-300 font-bold text-center mt-0.5">:</span>
                    <p className="font-bold text-gray-900 text-left truncate">{job.technician || "Unassigned"}</p>
                  </div>

                  {/* Customer */}
                  <div className="grid grid-cols-[120px_20px_1fr] items-center py-1">
                    <div className="flex items-center gap-2 text-gray-500 font-medium shrink-0">
                      <User className="w-4 h-4 text-gray-400 shrink-0" />
                      <span>Customer</span>
                    </div>
                    <span className="text-gray-300 font-bold text-center mt-0.5">:</span>
                    <p className="font-bold text-gray-900 text-left truncate">{job.customer || "Walk-in"}</p>
                  </div>

                  {/* Phone */}
                  <div className="grid grid-cols-[120px_20px_1fr] items-center py-1">
                    <div className="flex items-center gap-2 text-gray-500 font-medium shrink-0">
                      <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                      <span>Phone</span>
                    </div>
                    <span className="text-gray-300 font-bold text-center mt-0.5">:</span>
                    <p className="font-bold text-blue-600 font-mono tracking-wider text-left truncate">{job.phone || job.customerPhone || "—"}</p>
                  </div>

                  {/* Started Date */}
                  <div className="grid grid-cols-[120px_20px_1fr] items-center py-1">
                    <div className="flex items-center gap-2 text-gray-500 font-medium shrink-0">
                      <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                      <span>Started</span>
                    </div>
                    <span className="text-gray-300 font-bold text-center mt-0.5">:</span>
                    <p className="font-bold text-gray-900 text-left truncate">{new Date(job.startDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</p>
                  </div>

                  {/* Est. Completion */}
                  <div className="grid grid-cols-[120px_20px_1fr] items-center py-1">
                    <div className="flex items-center gap-2 text-gray-500 font-medium shrink-0">
                      <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                      <span>Est. Comp.</span>
                    </div>
                    <span className="text-gray-300 font-bold text-center mt-0.5">:</span>
                    <p className="font-bold text-gray-900 text-left truncate">{new Date(job.estCompletion).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</p>
                  </div>
                </div>
              </div>
            );
          })}
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
