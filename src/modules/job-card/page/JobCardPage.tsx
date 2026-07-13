"use client";

import { useState } from "react";
import { useJobCards } from "../hooks/useJobCards";
import { JobCard, JobCardFormData } from "../types/job-card.types";
import { JobCardHeader } from "../components/JobCardHeader";
import { JobCardFilters } from "../components/JobCardFilters";
import { JobCardTable } from "../components/JobCardTable";
import { CreateJobCardDialog } from "../components/CreateJobCardDialog";

export function JobCardPage() {
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

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading job cards...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;

  return (
    <div className="p-8 space-y-6">
      <JobCardHeader
        stats={stats}
        onNewJobCard={() => { setSelectedJob(null); setIsDialogOpen(true); }}
      />

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
