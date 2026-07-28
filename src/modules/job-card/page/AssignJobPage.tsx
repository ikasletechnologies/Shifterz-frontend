"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useJobCards } from "../hooks/useJobCards";
import { JobCard, JobCardFormData } from "../types/job-card.types";
import { JobCardHeader } from "../components/JobCardHeader";
import { JobCardFilters } from "../components/JobCardFilters";
import { JobCardTable } from "../components/JobCardTable";
import { CreateJobCardDialog } from "../components/CreateJobCardDialog";

export function AssignJobPage() {
  const router = useRouter();
  const { jobCards, isLoading, error, stats, handleSaveJobCard, handleDeleteJobCard } = useJobCards();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobCard | null>(null);
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const handleEdit = (job: JobCard) => {
    setSelectedJob(job);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedJob(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this job card?")) return;
    await handleDeleteJobCard(id);
  };

  const handleSave = async (data: JobCardFormData) => {
    await handleSaveJobCard(data);
    handleCloseDialog();
  };

  const filteredJobs = jobCards.filter((j) => {
    const priorityMatch = priorityFilter === "All" || j.priority === priorityFilter;
    const searchLower = searchQuery.toLowerCase();
    const searchMatch =
      !searchQuery ||
      j.id.toLowerCase().includes(searchLower) ||
      j.vehicle.toLowerCase().includes(searchLower) ||
      j.customer.toLowerCase().includes(searchLower) ||
      (j.technician && j.technician.toLowerCase().includes(searchLower));
    return priorityMatch && searchMatch;
  });

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading assign jobs...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/dashboard/jobs")}
          className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors border border-gray-200 flex items-center gap-2 font-medium text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Job Cards
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Assign Job</h1>
      </div>

      <JobCardHeader
        stats={stats}
        onNewJobCard={() => { setSelectedJob(null); setIsDialogOpen(true); }}
      />

      <div className="flex items-center gap-6 border-b border-gray-200 pb-3">
        <button
          onClick={() => router.push("/dashboard/jobs")}
          className="text-sm font-bold pb-1 transition-all text-gray-500 hover:text-blue-600 hover:border-b-2 hover:border-blue-600"
        >
          All
        </button>
        <button
          onClick={() => router.push("/dashboard/jobs/assign")}
          className="text-sm font-bold pb-1 transition-all text-emerald-600 border-b-2 border-emerald-600"
        >
          Assign Job
        </button>
        <button
          onClick={() => router.push("/dashboard/jobs/unassign")}
          className="text-sm font-bold pb-1 transition-all text-gray-500 hover:text-red-600 hover:border-b-2 hover:border-red-600"
        >
          Unassign Job
        </button>
      </div>

      <JobCardFilters
        priorityFilter={priorityFilter}
        searchQuery={searchQuery}
        onPriorityChange={setPriorityFilter}
        onSearchChange={setSearchQuery}
      />

      <JobCardTable
        jobCards={filteredJobs}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <CreateJobCardDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        onSave={handleSave}
        initialData={selectedJob}
      />
    </div>
  );
}
