"use client";

import { useState, useEffect } from "react";
import { apiCall } from "@/lib/api";
import { Loader2, Car, Calendar, CheckCircle2, Clock, MapPin, Search, X, User, Phone, Wrench } from "lucide-react";
import { PriorityBadge } from "@/modules/job-card/components/PriorityBadge";
import JobActionDialog from "./JobActionDialog";

export default function EmployeeDashboard() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [search, setSearch] = useState("");

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

  const filteredJobs = jobs.filter((j) => {
    if (isQualityInspector) {
      const isCompletedStatus =
        j.status === "Completed" ||
        j.status === "QC Pending" ||
        j.status === "QC Passed" ||
        j.status === "Ready For Billing";
      if (!isCompletedStatus) return false;
    }
    return (
      j.vehicle.toLowerCase().includes(search.toLowerCase()) ||
      j.service.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Assigned Jobs</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your current tasks and update progress</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search vehicle or service..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-10 py-2 border rounded-xl w-full md:w-64 focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none"
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
