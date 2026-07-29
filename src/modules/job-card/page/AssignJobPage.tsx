"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useJobCards } from "../hooks/useJobCards";
import { JobCard, JobCardFormData } from "../types/job-card.types";
import { JobCardHeader } from "../components/JobCardHeader";
import { JobCardFilters } from "../components/JobCardFilters";
import { JobCardTable } from "../components/JobCardTable";
import { JobCardNavTabs } from "../components/JobCardNavTabs";
import { CreateJobCardDialog } from "../components/CreateJobCardDialog";
import { ViewJobCardDialog } from "../components/ViewJobCardDialog";

export function AssignJobPage() {
  const router = useRouter();
  const { jobCards, isLoading, error, stats, handleSaveJobCard, handleDeleteJobCard } = useJobCards();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobCard | null>(null);
  const [viewingJob, setViewingJob] = useState<JobCard | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const handleView = (job: JobCard) => {
    setViewingJob(job);
    setIsViewDialogOpen(true);
  };

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
    const hasTechnician = Boolean(
      j.technician &&
        j.technician.trim() !== "" &&
        j.technician.toLowerCase() !== "unassigned"
    );
    const priorityMatch = priorityFilter === "All" || j.priority === priorityFilter;
    const searchLower = searchQuery.toLowerCase();
    const searchMatch =
      !searchQuery ||
      j.id.toLowerCase().includes(searchLower) ||
      j.vehicle.toLowerCase().includes(searchLower) ||
      j.customer.toLowerCase().includes(searchLower) ||
      (j.technician && j.technician.toLowerCase().includes(searchLower));
    return hasTechnician && priorityMatch && searchMatch;
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

      <div className="border-b border-gray-200 pb-3">
        <JobCardNavTabs activeTab="assign" jobCards={jobCards} />
      </div>

      <JobCardFilters
        priorityFilter={priorityFilter}
        searchQuery={searchQuery}
        onPriorityChange={setPriorityFilter}
        onSearchChange={setSearchQuery}
      />

      <JobCardTable
        jobCards={filteredJobs}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <CreateJobCardDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        onSave={handleSave}
        initialData={selectedJob}
      />

      <ViewJobCardDialog
        isOpen={isViewDialogOpen}
        onClose={() => { setIsViewDialogOpen(false); setViewingJob(null); }}
        job={viewingJob}
      />
    </div>
  );
}
