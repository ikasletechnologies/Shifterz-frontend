"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useJobCards } from "../hooks/useJobCards";
import { JobCard, JobCardFormData } from "../types/job-card.types";
import { JobCardHeader } from "../components/JobCardHeader";
import { JobCardTable } from "../components/JobCardTable";
import { CreateJobCardDialog, JOB_CARD_DRAFT_STORAGE_KEY } from "../components/CreateJobCardDialog";
import { ViewJobCardDialog } from "../components/ViewJobCardDialog";
import { useVehicleCheckin } from "@/modules/vehicle-checkin/hooks/useVehicleCheckin";
import { useJobTracking } from "../hooks/useJobTracking";
import { STAGE_FILTERS } from "../lib/jobStage";
import { CarEntry, hasCompletedInspection } from "@/modules/vehicle-checkin/types/vehicle-checkin.types";


function normalizeVehicle(v?: string | null): string {
  return (v || "").replace(/[^A-Z0-9]/gi, "").toUpperCase();
}

export function JobCardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { jobCards, isLoading, error, handleSaveJobCard, handleDeleteJobCard, fetchJobCards } = useJobCards();
  const { cars } = useVehicleCheckin();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobCard | null>(null);
  const [viewingJob, setViewingJob] = useState<JobCard | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");

  const carByVehicle = useMemo(() => {
    const map = new Map<string, CarEntry>();
    for (const car of cars) {
      const key = normalizeVehicle(car.vehicleNo || car.vehicle || car.vehicleNumber);
      if (key) map.set(key, car);
    }
    return map;
  }, [cars]);

  // Keep an already-open View dialog in sync with refetched data (e.g. after
  // an edit from inside it) instead of holding the stale
  // snapshot from when it was opened — without this, a status change made via
  // onRefresh wouldn't be visible until the dialog was closed and reopened.
  useEffect(() => {
    if (viewingJob) {
      const fresh = jobCards.find((j) => j.id === viewingJob.id);
      if (fresh && fresh !== viewingJob) setViewingJob(fresh);
    }
  }, [jobCards, viewingJob]);

  // Deep link from Billing's "Add Billing Services" (?edit=<jobId>) — opens
  // straight into editing that job instead of leaving the user to hunt for
  // it manually, which is what led to them repeatedly hitting the "no
  // recorded services" invoice error with no clear path to fixing it.
  useEffect(() => {
    const editId = searchParams.get("edit");
    if (!editId || jobCards.length === 0) return;
    const target = jobCards.find((j) => j.id === editId);
    if (target) {
      setSelectedJob(target);
      setIsDialogOpen(true);
    }
    router.replace("/dashboard/jobs");
  }, [jobCards, searchParams, router]);

  // Deep link from Car-In's "Go to Job Card" (?fromCarIn=<carInId>) — pre-fills
  // a New Job Card with the check-in's own vehicle/customer/phone/service/notes
  // instead of making the service advisor retype everything from scratch, and
  // sets the real carInId link (backend's createJobCardSchema already accepts
  // it; nothing previously ever set it — job↔check-in was only ever matched by
  // fuzzy vehicle-number string comparison elsewhere in this app).
  useEffect(() => {
    const carInId = searchParams.get("fromCarIn");
    if (!carInId) return;
    if (cars.length > 0) {
      const car = cars.find((c) => c.id === carInId);
      if (car) {
        // Only the plain-text label is set here — CreateJobCardDialog is
        // responsible for matching it against the Service catalog and
        // filling in the priced `services` line item Billing actually reads,
        // once its own catalog fetch has resolved (see the effect there).
        setSelectedJob({
          id: "",
          carInId: car.id,
          vehicle: car.vehicleNo || car.vehicle || car.vehicleNumber || "",
          customer: car.customer || "",
          phone: car.phone || "",
          service: car.service || "",
          technician: "",
          priority: "Normal",
          status: "Pending",
          startDate: new Date().toISOString().split("T")[0],
          estCompletion: "",
          actualCompletion: "",
          notes: car.notes || "",
        });
        setIsDialogOpen(true);
      }
      router.replace("/dashboard/jobs");
    }
  }, [cars, searchParams, router]);

  // Restore a job card draft saved before the "+ Add Technician" round trip
  // to /dashboard/technicians — the draft lives in sessionStorage rather than
  // a query param since it can be an entire in-progress form, not just an id.
  useEffect(() => {
    try {
      const draftStr = sessionStorage.getItem(JOB_CARD_DRAFT_STORAGE_KEY);
      if (draftStr) {
        setSelectedJob(JSON.parse(draftStr));
        setIsDialogOpen(true);
        sessionStorage.removeItem(JOB_CARD_DRAFT_STORAGE_KEY);
      }
    } catch {
      // Ignore — worst case they just start the job card over.
    }
  }, []);

  const findCarForJob = useCallback(
    (job: JobCard): CarEntry | undefined => carByVehicle.get(normalizeVehicle(job.vehicle)),
    [carByVehicle]
  );

  // Only block assignment when we can positively confirm a matched check-in's
  // inspection is incomplete — a job card with no matched check-in (e.g. legacy
  // data) falls back to the old always-assignable behavior rather than getting stuck.
  const isInspectionPending = useCallback(
    (job: JobCard): boolean => {
      const car = findCarForJob(job);
      return car ? !hasCompletedInspection(car) : false;
    },
    [findCarForJob]
  );

  const { trackingFor } = useJobTracking(jobCards, isInspectionPending);

  const handleStatusSelect = (status: string) => {
    setSelectedStatus(status);
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
    // Auto-link to the matching Car-In record by vehicle number when the form
    // wasn't already deep-linked with one (?fromCarIn=) — makes the job↔check-in
    // relation a real FK (carInId) rather than leaving it to always be inferred
    // by fuzzy vehicle-number matching elsewhere in the app.
    let toSave = data;
    if (!toSave.carInId) {
      const matchedCar = carByVehicle.get(normalizeVehicle(toSave.vehicle));
      if (matchedCar) {
        toSave = { ...toSave, carInId: matchedCar.id };
      }
    }
    await handleSaveJobCard(toSave);
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

  // Role scope + date + search. Stage cards count within this set.
  const visibleJobs = jobCards.filter((j) => {
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

    if (isQualityInspector) {
      const statusStr = j.status as string;
      const isQCStatus =
        statusStr === "Completed" ||
        statusStr === "Work Completed" ||
        statusStr === "QC Pending" ||
        statusStr === "Waiting QC" ||
        statusStr === "Waiting for Quality Check" ||
        statusStr === "Rework Required" ||
        statusStr === "Inspecting" ||
        statusStr === "QC Passed" ||
        statusStr === "QC Failed" ||
        statusStr === "Rework" ||
        statusStr === "Ready For Billing";
      if (!isQCStatus) return false;
    }

    // Date Filtering (From Date & To Date - exact match with Car In module)
    if (fromDate) {
      const start = new Date(fromDate + "T00:00:00");
      const jobDate = j.startDate ? new Date(j.startDate) : null;
      if (jobDate && !isNaN(jobDate.getTime()) && jobDate < start) return false;
    }

    if (toDate) {
      const end = new Date(toDate + "T23:59:59.999");
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

  const stageCards = [
    { id: "All", label: "All", count: visibleJobs.length },
    ...STAGE_FILTERS.map((f) => ({
      id: f.id,
      label: f.label,
      tone: f.tone,
      count: visibleJobs.filter((j) => f.stages.includes(trackingFor(j).stage.key)).length,
    })),
  ];
  const activeFilter = STAGE_FILTERS.find((f) => f.id === selectedStatus);
  const filteredJobs = activeFilter
    ? visibleJobs.filter((j) => activeFilter.stages.includes(trackingFor(j).stage.key))
    : visibleJobs;

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading job cards...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;

  return (
    <div className="p-8 space-y-6">
      <JobCardHeader
        cards={stageCards}
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

      <JobCardTable
        jobCards={filteredJobs}
        onView={handleView}
        onEdit={handleEdit}
        trackingFor={trackingFor}
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
        inspectionCar={viewingJob ? findCarForJob(viewingJob) : null}
        stage={viewingJob ? trackingFor(viewingJob)?.stage : undefined}
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
