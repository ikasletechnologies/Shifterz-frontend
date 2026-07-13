"use client";

import { useState } from "react";
import { useWorkshop } from "../hooks/useWorkshop";
import { WorkshopJob } from "../types/workshop.types";
import { MyJobsCard } from "../components/MyJobsCard";
import { WorkshopFilters } from "../components/WorkshopFilters";
import { WorkshopTable } from "../components/WorkshopTable";
import { UploadPhotosDialog } from "../components/UploadPhotosDialog";
import { MaterialUsageDialog } from "../components/MaterialUsageDialog";
import { TechnicianNotesDialog } from "../components/TechnicianNotesDialog";
import { CompleteWorkDialog } from "../components/CompleteWorkDialog";
import { SendToQCDialog } from "../components/SendToQCDialog";

export function WorkshopPage() {
  const {
    jobs,
    isLoading,
    error,
    stats,
    startWork,
    pauseWork,
    resumeWork,
    completeWork,
    uploadPhotos,
    recordMaterial,
    sendToQC,
    updateProgress,
  } = useWorkshop();

  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog state — one selected job for each dialog type
  const [activeJob, setActiveJob] = useState<WorkshopJob | null>(null);
  const [openDialog, setOpenDialog] = useState<
    "photos" | "material" | "notes" | "complete" | "qc" | null
  >(null);

  const openFor = (dialog: typeof openDialog, job: WorkshopJob) => {
    setActiveJob(job);
    setOpenDialog(dialog);
  };

  const closeDialog = () => {
    setOpenDialog(null);
    setActiveJob(null);
  };

  const filteredJobs = jobs.filter((j) => {
    const statusMatch = statusFilter === "All" || j.status === statusFilter;
    const searchLower = searchQuery.toLowerCase();
    const searchMatch =
      !searchQuery ||
      j.id.toLowerCase().includes(searchLower) ||
      j.vehicle.toLowerCase().includes(searchLower) ||
      j.customer.toLowerCase().includes(searchLower) ||
      j.service.toLowerCase().includes(searchLower);
    return statusMatch && searchMatch;
  });

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading workshop jobs...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Workshop</h1>
        <p className="text-sm text-gray-500">Technician Workspace</p>
      </div>

      {/* KPI Stats */}
      <MyJobsCard stats={stats} />

      {/* Filters */}
      <WorkshopFilters
        statusFilter={statusFilter}
        searchQuery={searchQuery}
        onStatusChange={setStatusFilter}
        onSearchChange={setSearchQuery}
      />

      {/* Jobs Table */}
      <WorkshopTable
        jobs={filteredJobs}
        onStartWork={(job) => startWork(job.id)}
        onPauseWork={(job) => openFor("notes", job)}  // pause with optional note
        onResumeWork={(job) => resumeWork(job.id)}
        onCompleteWork={(job) => openFor("complete", job)}
        onUploadPhotos={(job) => openFor("photos", job)}
        onAddMaterial={(job) => openFor("material", job)}
        onAddNotes={(job) => openFor("notes", job)}
        onSendToQC={(job) => openFor("qc", job)}
      />

      {/* Dialogs */}
      <UploadPhotosDialog
        job={activeJob}
        isOpen={openDialog === "photos"}
        onClose={closeDialog}
        onUpload={(files) => uploadPhotos(activeJob!.id, files)}
      />

      <MaterialUsageDialog
        job={activeJob}
        isOpen={openDialog === "material"}
        onClose={closeDialog}
        onRecord={(material) => recordMaterial(activeJob!.id, material)}
      />

      <TechnicianNotesDialog
        job={activeJob}
        isOpen={openDialog === "notes"}
        onClose={closeDialog}
        onSave={(notes) => updateProgress(activeJob!.id, notes)}
      />

      <CompleteWorkDialog
        job={activeJob}
        isOpen={openDialog === "complete"}
        onClose={closeDialog}
        onComplete={(data) => completeWork(activeJob!.id, data)}
      />

      <SendToQCDialog
        job={activeJob}
        isOpen={openDialog === "qc"}
        onClose={closeDialog}
        onSend={(notes) => sendToQC(activeJob!.id, notes)}
      />
    </div>
  );
}
