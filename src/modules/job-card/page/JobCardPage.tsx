"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "assign" | "unassign">("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");

  const handleStatusSelect = (status: string) => {
    setSelectedStatus(status);
    if (status.toLowerCase() === "assigned") {
      setActiveTab("assign");
    } else if (status.toLowerCase() === "unassigned") {
      setActiveTab("unassign");
    } else if (status.toLowerCase() === "all") {
      setActiveTab("all");
    }
  };

  const handleTabChange = (tab: "all" | "assign" | "unassign") => {
    setActiveTab(tab);
    if (tab === "assign") {
      setSelectedStatus("Assigned");
    } else if (tab === "unassign") {
      setSelectedStatus("Unassigned");
    } else {
      setSelectedStatus("All");
    }
  };

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

  const currentUser = (() => {
    try {
      if (typeof window !== "undefined") {
        const u = localStorage.getItem("user");
        if (u) return JSON.parse(u);
      }
    } catch {
      // Ignore
    }
    return null;
  })();

  const userRole = (currentUser?.role || "").toUpperCase().replace(/[\s_]+/g, "_");
  const isTechnician = userRole === "TECHNICIAN";

  const isQualityInspector =
    userRole === "QUALITY_INSPECTOR" ||
    userRole === "QUALITY_INSPECTION" ||
    userRole === "QC_INSPECTOR" ||
    userRole === "QC" ||
    userRole === "QUALITY_ASSURANCE";

  const isBillingExecutive =
    userRole.includes("BILLING") || userRole.includes("ACCOUNTANT");

  const filteredJobs = jobCards.filter((j) => {
    if (isTechnician && currentUser) {
      const isAssigned =
        (j.technicianId && currentUser.id && j.technicianId === currentUser.id) ||
        (j.technician && currentUser.name && j.technician.toLowerCase() === currentUser.name.toLowerCase()) ||
        (j.technician && currentUser.username && j.technician.toLowerCase() === currentUser.username.toLowerCase());
      if (!isAssigned) return false;
    }

    if (isBillingExecutive) {
      const isBillingStatus =
        j.status === "Ready For Billing" ||
        j.status === "QC Passed" ||
        j.status === "Delivered" ||
        j.status === "Out";
      if (!isBillingStatus) return false;
    }

    // Status KPI Card Filtering
    if (selectedStatus && selectedStatus.toLowerCase() !== "all") {
      const s = selectedStatus.toLowerCase();
      if (s === "assigned") {
        const isAssigned = Boolean(
          j.technician &&
            j.technician.trim() !== "" &&
            j.technician.toLowerCase() !== "unassigned" &&
            j.technician.toLowerCase() !== "none"
        );
        if (!isAssigned) return false;
      } else if (s === "unassigned") {
        const isUnassigned =
          !j.technician ||
          j.technician.trim() === "" ||
          j.technician.toLowerCase() === "unassigned" ||
          j.technician.toLowerCase() === "none";
        if (!isUnassigned) return false;
      } else if (s === "in progress") {
        const isMatch = j.status === "In Progress" || j.status === "Ongoing";
        if (!isMatch) return false;
      } else if (s === "completed") {
        const isMatch = j.status === "Completed" || j.status === "Complete";
        if (!isMatch) return false;
      } else if (s === "review for qc") {
        const isMatch =
          j.status === "Review for QC" ||
          j.status === "Waiting QC" ||
          j.status === "Inspecting" ||
          j.status === "In QC";
        if (!isMatch) return false;
      } else if (s === "rework") {
        const isMatch = j.status === "Rework" || j.status === "QC Failed";
        if (!isMatch) return false;
      } else if (s === "ready for billing") {
        const isMatch = j.status === "Ready For Billing" || j.status === "QC Passed";
        if (!isMatch) return false;
      } else if (s === "delivered") {
        const isMatch = j.status === "Delivered" || j.status === "Out" || j.status === "Delivery";
        if (!isMatch) return false;
      } else if (s === "cancelled") {
        const isMatch = j.status === "Cancelled" || j.status === "Canceled";
        if (!isMatch) return false;
      } else {
        if (j.status.toLowerCase() !== s) return false;
      }
    }

    // Nav Tab In-Place Filtering (All, Assigned, Unassigned)
    if (activeTab === "assign") {
      const isAssigned = Boolean(
        j.technician &&
          j.technician.trim() !== "" &&
          j.technician.toLowerCase() !== "unassigned" &&
          j.technician.toLowerCase() !== "none"
      );
      if (!isAssigned) return false;
    }

    if (activeTab === "unassign") {
      const isUnassigned =
        !j.technician ||
        j.technician.trim() === "" ||
        j.technician.toLowerCase() === "unassigned" ||
        j.technician.toLowerCase() === "none";
      if (!isUnassigned) return false;
    }

    // Date Filtering (From Date & To Date - exact match with Car In module)
    if (fromDate) {
      const start = new Date(fromDate + "T00:00:00");
      const jobDate = j.startDate ? new Date(j.startDate) : null;
      if (jobDate && !isNaN(jobDate.getTime()) && jobDate < start) return false;
    }

    if (toDate) {
      const end = new Date(toDate + "T23:59:59");
      const jobDate = j.startDate ? new Date(j.startDate) : null;
      if (jobDate && !isNaN(jobDate.getTime()) && jobDate > end) return false;
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
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        fromDate={fromDate}
        onFromDateChange={setFromDate}
        toDate={toDate}
        onToDateChange={setToDate}
        selectedStatus={selectedStatus}
        onStatusSelect={handleStatusSelect}
      />

      <div className="border-b border-gray-200 pb-3">
        <JobCardNavTabs activeTab={activeTab} onTabChange={handleTabChange} jobCards={jobCards} />
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
        onEdit={(job) => {
          setIsViewDialogOpen(false);
          setViewingJob(null);
          handleEdit(job);
        }}
        onDelete={(id) => {
          setIsViewDialogOpen(false);
          setViewingJob(null);
          handleDelete(id);
        }}
      />
    </div>
  );
}
