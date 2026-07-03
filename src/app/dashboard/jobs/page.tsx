"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Edit } from "lucide-react";
import NewJobCardDialog from "@/components/jobs/NewJobCardDialog";
import { getJobs, createJob, updateJob, deleteJob } from "@/lib/api";

export default function JobCardsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); 
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [priorityFilter, setPriorityFilter] = useState<string>("All");

  const fetchJobs = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getJobs();
      setJobs(data || []);
      setError(null);
    } catch (err: any) {
      setError("Failed to load jobs: " + err.message);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleSave = async (data: any) => {
    try {
      if (data.id) {
        await updateJob(data.id, data);
      } else {
        await createJob(data);
      }
      await fetchJobs();
    } catch (err) {
      console.error("Failed to save job:", err);
    }
  };

  const handleEdit = (job: any) => {
    setSelectedJob(job);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this job?")) return;
    try {
      await deleteJob(id);
      setJobs(jobs.filter(j => j.id !== id));
    } catch (err) {
      console.error("Failed to delete job:", err);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedJob(null);
  };

  const stats = {
    pending: jobs.filter(j => j.status === "Pending").length,
    inProgress: jobs.filter(j => j.status === "In Progress").length,
    completed: jobs.filter(j => j.status === "Completed").length,
    cancelled: jobs.filter(j => j.status === "Cancelled").length,
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading jobs...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-gray-900">Job Cards</h1>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl border border-gray-100 border-l-4 border-l-yellow-500 p-4 shadow-sm flex flex-col justify-between h-24">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pending</span>
          <span className="text-2xl font-bold text-gray-900">{stats.pending}</span>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 border-l-4 border-l-blue-500 p-4 shadow-sm flex flex-col justify-between h-24">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">In Progress</span>
          <span className="text-2xl font-bold text-gray-900">{stats.inProgress}</span>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 border-l-4 border-l-green-500 p-4 shadow-sm flex flex-col justify-between h-24">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Completed</span>
          <span className="text-2xl font-bold text-green-500">{stats.completed}</span>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 border-l-4 border-l-red-500 p-4 shadow-sm flex flex-col justify-between h-24">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Cancelled</span>
          <span className="text-2xl font-bold text-red-500">{stats.cancelled}</span>
        </div>
      </div>

      {/* Priority Filter Buttons - outside the card section, below Cancelled */}
      <div className="rounded-lg px-2 py-1.5 flex items-center gap-1 w-fit" style={{ backgroundColor: "#ebebebff" }}>
        {["All", "Normal", "High", "Low"].map(level => (
          <button
            key={level}
            onClick={() => setPriorityFilter(level)}
            className={`text-sm px-3 py-1 rounded-md transition-colors ${priorityFilter === level
              ? 'bg-white text-gray-900 font-bold shadow-sm'
              : 'text-gray-600 hover:text-gray-900 font-medium'
              }`}
          >
            {level}
          </button>
        ))}
      </div>

      {jobs.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No jobs found</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[900px]">
              <thead className="bg-gray-50/50 border-b border-gray-100 text-xs text-gray-400 uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-4 py-4 whitespace-nowrap">Job ID</th>
                  <th className="px-4 py-4 whitespace-nowrap">Vehicle</th>
                  <th className="px-4 py-4 whitespace-nowrap">Customer</th>
                  <th className="px-4 py-4 whitespace-nowrap">Service</th>
                  <th className="px-4 py-4 whitespace-nowrap">Technician</th>
                  <th className="px-4 py-4 whitespace-nowrap">Priority</th>
                  <th className="px-4 py-4 whitespace-nowrap">Start</th>
                  <th className="px-4 py-4 whitespace-nowrap">Est. Completion</th>
                  <th className="px-4 py-4 whitespace-nowrap">Actual</th>
                  <th className="px-4 py-4 whitespace-nowrap">Status</th>
                  <th className="px-4 py-4 whitespace-nowrap">Notes</th>
                  <th className="px-4 py-4 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {jobs.filter(j => priorityFilter === "All" || j.priority === priorityFilter).map(j => (
                  <tr key={j.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-mono text-xs font-bold whitespace-nowrap" style={{ color: "#F0B100" }}>{j.id}</td>
                    <td className="px-4 py-4 font-bold text-gray-900 whitespace-nowrap">{j.vehicle}</td>
                    <td className="px-4 py-4 text-gray-600 whitespace-nowrap">{j.customer}</td>
                    <td className="px-4 py-4 text-gray-600">{j.service}</td>
                    <td className="px-4 py-4 text-gray-600 whitespace-nowrap">{j.technician}</td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${j.priority === 'High' ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                        {j.priority}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-gray-600 whitespace-nowrap">{j.startDate}</td>
                    <td className="px-4 py-4 text-gray-600 whitespace-nowrap">{j.estCompletion}</td>
                    <td className="px-4 py-4 text-gray-600 whitespace-nowrap">{j.actualCompletion}</td>
                    <td className="px-4 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap ${j.status === 'Completed' ? 'bg-green-50 text-green-600' : j.status === 'Pending' ? 'bg-gray-100 text-gray-600' : 'bg-blue-50 text-blue-600'}`}>
                        {j.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-gray-500 text-xs max-w-[120px] truncate">{j.notes}</td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(j)}
                          className="p-1.5 hover:bg-blue-50 rounded-md text-blue-500 transition-colors"
                          title="Edit job"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(j.id)}
                          className="p-1.5 hover:bg-red-50 rounded-md text-red-400 transition-colors"
                          title="Delete job"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <NewJobCardDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        onSave={handleSave}
        initialData={selectedJob}
      />
    </div>
  );
}
