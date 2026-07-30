"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { useJobCards } from "../hooks/useJobCards";
import { JobCard, JobCardFormData } from "../types/job-card.types";
import { JobCardHeader } from "../components/JobCardHeader";
import { JobCardTable } from "../components/JobCardTable";
import { CreateJobCardDialog } from "../components/CreateJobCardDialog";
import { ViewJobCardDialog } from "../components/ViewJobCardDialog";

import { JobCardNavTabs } from "../components/JobCardNavTabs";

export function JobCardPage() {
  const router = useRouter();
  const { jobCards, isLoading, error, stats, handleSaveJobCard, handleDeleteJobCard } = useJobCards();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobCard | null>(null);
  const [viewingJob, setViewingJob] = useState<JobCard | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
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

  const filteredJobs = jobCards.filter((j) => {
    if (isQualityInspector) {
      const isCompletedStatus =
        j.status === "Completed" ||
        (j.status as string) === "QC Pending" ||
        j.status === "QC Passed" ||
        j.status === "Ready For Billing";
      if (!isCompletedStatus) return false;
    }

    const searchLower = searchQuery.toLowerCase();
    return (
      !searchQuery ||
      j.id.toLowerCase().includes(searchLower) ||
      j.vehicle.toLowerCase().includes(searchLower) ||
      j.customer.toLowerCase().includes(searchLower) ||
      (j.technician && j.technician.toLowerCase().includes(searchLower))
    );
  });

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading job cards...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;

  return (
    <div className="p-8 space-y-6">
      <JobCardHeader
        stats={stats}
        onNewJobCard={() => { setSelectedJob(null); setIsDialogOpen(true); }}
      />

      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between border-b border-gray-200 pb-3">
        <JobCardNavTabs activeTab="all" jobCards={jobCards} />

        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by ID, vehicle, customer, or technician..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-9 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

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
