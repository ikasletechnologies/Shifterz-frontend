"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { useJobCards } from "../hooks/useJobCards";
import { JobCard, JobCardFormData } from "../types/job-card.types";
import { JobCardHeader } from "../components/JobCardHeader";
import { JobCardTable } from "../components/JobCardTable";
import { CreateJobCardDialog, JOB_CARD_DRAFT_STORAGE_KEY } from "../components/CreateJobCardDialog";
import { ViewJobCardDialog } from "../components/ViewJobCardDialog";
import { AssignQCDialog } from "../components/AssignQCDialog";
import { useVehicleCheckin } from "@/modules/vehicle-checkin/hooks/useVehicleCheckin";
import VehicleInspectionDialog from "@/modules/vehicle-checkin/components/VehicleInspectionDialog";
import { CarEntry, hasCompletedInspection } from "@/modules/vehicle-checkin/types/vehicle-checkin.types";
import { passQC, failQC } from "@/modules/qc/services/qc.service";
import { PassDialog } from "@/modules/qc/components/PassDialog";
import { FailDialog } from "@/modules/qc/components/FailDialog";
import { ensureSentToQCAndChecklistSubmitted } from "../lib/qcQuickDecide";

import { JobCardNavTabs } from "../components/JobCardNavTabs";

function normalizeVehicle(v?: string | null): string {
  return (v || "").replace(/[^A-Z0-9]/gi, "").toUpperCase();
}

export function JobCardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { jobCards, isLoading, error, stats, handleSaveJobCard, handleAssignQC, handleDeleteJobCard, fetchJobCards } = useJobCards();
  const { cars, handleUpdateVehicleCheckIn } = useVehicleCheckin();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobCard | null>(null);
  const [viewingJob, setViewingJob] = useState<JobCard | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [inspectingCar, setInspectingCar] = useState<CarEntry | null>(null);
  const [assigningQCJob, setAssigningQCJob] = useState<JobCard | null>(null);
  const [quickQCJob, setQuickQCJob] = useState<JobCard | null>(null);
  const [showQuickPassDialog, setShowQuickPassDialog] = useState(false);
  const [showQuickFailDialog, setShowQuickFailDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "assign" | "unassign">("all");
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
  // Send to QC / Pass / Fail from inside it) instead of holding the stale
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
        setSelectedJob({
          id: "",
          carInId: car.id,
          vehicle: car.vehicleNo || car.vehicle || car.vehicleNumber || "",
          customer: car.customer || "",
          phone: car.phone || "",
          service: car.service || "PPF Full Body",
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

  const findCarForJob = (job: JobCard): CarEntry | undefined =>
    carByVehicle.get(normalizeVehicle(job.vehicle));

  // Only block assignment when we can positively confirm a matched check-in's
  // inspection is incomplete — a job card with no matched check-in (e.g. legacy
  // data) falls back to the old always-assignable behavior rather than getting stuck.
  const isInspectionPending = (job: JobCard): boolean => {
    const car = findCarForJob(job);
    if (!car) return false;
    return !hasCompletedInspection(car);
  };

  const handleInspect = (job: JobCard) => {
    const car = findCarForJob(job);
    if (!car) {
      toast.error("No matching vehicle check-in found for this job card's vehicle.");
      return;
    }
    setInspectingCar(car);
  };

  const handleAssignQCInspector = async (inspector: { id: string; name: string }) => {
    if (!assigningQCJob) return false;
    return handleAssignQC(assigningQCJob.id, inspector);
  };

  // Super Admin quick Pass/Fail on the Job Card board itself, so it's
  // available without opening the detail view.
  const handleConfirmQuickPass = async (notes?: string) => {
    if (!quickQCJob) return false;
    try {
      await ensureSentToQCAndChecklistSubmitted(quickQCJob);
      await passQC(quickQCJob.id, notes);
      toast.success("QC passed — job moved to Ready For Billing");
      await fetchJobCards();
      return true;
    } catch (err: any) {
      toast.error(err.message || "Failed to pass QC");
      return false;
    }
  };

  const handleConfirmQuickFail = async (notes: string) => {
    if (!quickQCJob) return false;
    try {
      await ensureSentToQCAndChecklistSubmitted(quickQCJob);
      await failQC(quickQCJob.id, notes);
      toast.error("QC failed — job requires rework");
      await fetchJobCards();
      return true;
    } catch (err: any) {
      toast.error(err.message || "Failed to record QC failure");
      return false;
    }
  };

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

  // Assigning a QC Inspector is specifically a Super Admin / Service Advisor
  // action — other roles (Technician, QC Inspector, Billing, and also
  // Franchise Admin/Branch Manager/HQ User/Reception) view this board but
  // don't perform the assignment themselves (a QC Inspector in particular
  // should be going to /dashboard/qc to do the inspection, not assigning it).
  const isSuperAdminRole = userRole === "SUPER_ADMIN" || userRole === "SUPERADMIN";
  const isServiceAdvisor = userRole === "SERVICE_ADVISOR";
  const canAssignQC = isSuperAdminRole || isServiceAdvisor;

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
          j.status === "Waiting for Quality Check" ||
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
        isInspectionPending={isInspectionPending}
        onInspect={handleInspect}
        onAssignQC={canAssignQC ? setAssigningQCJob : undefined}
        onQuickPass={isSuperAdminRole ? (job) => { setQuickQCJob(job); setShowQuickPassDialog(true); } : undefined}
        onQuickFail={isSuperAdminRole ? (job) => { setQuickQCJob(job); setShowQuickFailDialog(true); } : undefined}
      />

      <CreateJobCardDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        onSave={handleSave}
        initialData={selectedJob}
      />

      <VehicleInspectionDialog
        isOpen={!!inspectingCar}
        car={inspectingCar}
        onClose={() => setInspectingCar(null)}
        onSubmit={handleUpdateVehicleCheckIn}
      />

      <AssignQCDialog
        isOpen={!!assigningQCJob}
        job={assigningQCJob}
        onClose={() => setAssigningQCJob(null)}
        onAssign={handleAssignQCInspector}
      />

      <PassDialog
        job={quickQCJob}
        isOpen={showQuickPassDialog}
        onClose={() => { setShowQuickPassDialog(false); setQuickQCJob(null); }}
        onPass={handleConfirmQuickPass}
      />

      <FailDialog
        job={quickQCJob}
        isOpen={showQuickFailDialog}
        onClose={() => { setShowQuickFailDialog(false); setQuickQCJob(null); }}
        onFail={handleConfirmQuickFail}
      />

      <ViewJobCardDialog
        isOpen={isViewDialogOpen}
        onClose={() => { setIsViewDialogOpen(false); setViewingJob(null); }}
        job={viewingJob}
        inspectionCar={viewingJob ? findCarForJob(viewingJob) : null}
        onRefresh={fetchJobCards}
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
