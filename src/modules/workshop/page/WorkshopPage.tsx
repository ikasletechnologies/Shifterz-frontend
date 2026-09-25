"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useWorkshop } from "../hooks/useWorkshop";
import { getCurrentUser } from "@/lib/franchise-scope";
import { WorkshopJob } from "../types/workshop.types";
import { WorkshopTable } from "../components/WorkshopTable";
import { UploadPhotosDialog } from "../components/UploadPhotosDialog";
import { MaterialUsageDialog } from "../components/MaterialUsageDialog";
import { TechnicianNotesDialog } from "../components/TechnicianNotesDialog";
import { CompleteWorkDialog } from "../components/CompleteWorkDialog";
import { SummaryCard } from "@/components/common/SummaryCard";
import { ListHeader } from "@/components/common/ListHeader";

const REWORK_STATUSES = ["QC Failed", "Rework", "Rework Required"];

// Work stages shown as the summary cards, which double as the list filter.
const STAGES: { id: string; label: string; match: (j: WorkshopJob) => boolean; tone?: "good" | "bad"; empty: string }[] = [
  { id: "All", label: "All Jobs", match: () => true, empty: "" },
  {
    id: "ToStart",
    label: "To Start",
    match: (j) => j.status === "Assigned",
    empty: "No jobs waiting to be started.",
  },
  {
    id: "InProgress",
    label: "In Progress",
    match: (j) => j.status === "In Progress" || j.status === "Paused",
    empty: "No work in progress right now.",
  },
  {
    id: "Completed",
    label: "Ready for QC",
    match: (j) => j.status === "Completed",
    empty: "No finished work waiting to be sent to QC.",
  },
  {
    id: "SentToQC",
    label: "Sent to QC",
    match: (j) => j.status === "Waiting QC",
    tone: "good",
    empty: "Nothing is waiting in QC.",
  },
  {
    id: "Rework",
    label: "Rework",
    match: (j) => REWORK_STATUSES.includes(j.status as string),
    tone: "bad",
    empty: "No jobs have been sent back from QC.",
  },
];

export function WorkshopPage() {
  const {
    jobs,
    isLoading,
    error,
    startWork,
    pauseWork,
    resumeWork,
    completeWork,
    uploadPhotos,
    recordMaterial,
    updateProgress,
  } = useWorkshop();

  const [stageFilter, setStageFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isTechnician, setIsTechnician] = useState(true);

  useEffect(() => {
    const role = (getCurrentUser()?.role || "").split("|")[0].toUpperCase().replace(/[\s_]+/g, "_");
    setIsTechnician(role === "TECHNICIAN" || role === "EMPLOYEE");
  }, []);

  // Dialog state — one selected job for each dialog type
  const [activeJob, setActiveJob] = useState<WorkshopJob | null>(null);
  const [openDialog, setOpenDialog] = useState<
    "photos" | "material" | "notes" | "complete" | null
  >(null);

  const openFor = (dialog: typeof openDialog, job: WorkshopJob) => {
    setActiveJob(job);
    setOpenDialog(dialog);
  };

  const closeDialog = () => {
    setOpenDialog(null);
    setActiveJob(null);
  };

  const stage = STAGES.find((s) => s.id === stageFilter) ?? STAGES[0];
  const searchLower = searchQuery.trim().toLowerCase();
  const filteredJobs = jobs.filter((j) => {
    if (!stage.match(j)) return false;
    if (!searchLower) return true;
    return [j.id, j.vehicle, j.customer, j.service, j.technician].some((v) => (v || "").toLowerCase().includes(searchLower));
  });

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading workshop jobs...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;

  const emptyMessage = searchLower ? (
    `No jobs match "${searchQuery}".`
  ) : stage.id === "All" ? (
    <>
      No jobs in the workshop right now. A job shows up here once a technician is assigned to it on{" "}
      <Link href="/dashboard/jobs" className="font-medium text-slate-900 underline underline-offset-2">
        Job Cards
      </Link>
      .
    </>
  ) : (
    stage.empty
  );

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      {/* Work stages — each card is also the list filter */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {STAGES.map((s) => (
          <SummaryCard
            key={s.id}
            label={s.label}
            value={jobs.filter(s.match).length}
            tone={s.tone}
            active={stageFilter === s.id}
            onClick={() => setStageFilter(s.id)}
          />
        ))}
      </div>

      <section className="space-y-3">
        <ListHeader
          title={isTechnician ? "My Workshop Jobs" : "Workshop"}
          filterLabel={stage.label}
          count={filteredJobs.length}
          hint="Track the repair work: start the job, pause or resume it, mark it complete, then send it to QC."
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search job, vehicle, customer, technician..."
        />

        {filteredJobs.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-lg p-10 text-center text-slate-500 text-sm">{emptyMessage}</div>
        ) : (
          <WorkshopTable
            jobs={filteredJobs}
            onStartWork={(job) => startWork(job.id)}
            onPauseWork={(job) => pauseWork(job.id)}
            onResumeWork={(job) => resumeWork(job.id)}
            onCompleteWork={(job) => openFor("complete", job)}
            onUploadPhotos={(job) => openFor("photos", job)}
            onAddMaterial={(job) => openFor("material", job)}
            onAddNotes={(job) => openFor("notes", job)}
          />
        )}
      </section>

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
    </div>
  );
}
