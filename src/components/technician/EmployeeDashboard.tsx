"use client";

import { useState, useEffect } from "react";
import { apiCall } from "@/lib/api";
import { Loader2, Car, Calendar, CheckCircle2, Clock, MapPin, Search, X } from "lucide-react";
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

  const filteredJobs = jobs.filter(j => 
    j.vehicle.toLowerCase().includes(search.toLowerCase()) || 
    j.service.toLowerCase().includes(search.toLowerCase())
  );

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
          {filteredJobs.map((job) => (
            <div 
              key={job.id}
              onClick={() => setSelectedJob(job)}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow cursor-pointer group relative overflow-hidden"
            >
              {job.priority === "High" && (
                <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">
                  URGENT
                </div>
              )}
              
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-yellow-600 transition-colors">
                    {job.vehicle}
                  </h3>
                  <p className="text-sm text-gray-500 font-medium">{job.service}</p>
                </div>
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getStatusColor(job.status)}`}>
                  {job.status}
                </span>
              </div>

              <div className="space-y-2 mt-4 pt-4 border-t border-gray-50">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                  Started: {new Date(job.startDate).toLocaleDateString()}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="w-4 h-4 mr-2 text-gray-400" />
                  Est. Completion: {new Date(job.estCompletion).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
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
