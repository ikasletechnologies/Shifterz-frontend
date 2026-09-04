import { useState, useCallback, useEffect } from "react";
import { QCJob, ChecklistResult, QCStats } from "../types/qc.types";
import {
  getPendingQC,
  startInspection as startInspectionSvc,
  submitChecklist as submitChecklistSvc,
  passQC as passQCSvc,
  failQC as failQCSvc,
  rework as reworkSvc,
  uploadQCPhotos as uploadQCPhotosSvc,
  addRemarks as addRemarksSvc,
} from "../services/qc.service";
import { toast } from "react-hot-toast";

// QC-relevant statuses — only Technician-completed and QC statuses
const QC_RELEVANT_STATUSES = [
  "Completed",
  "Work Completed",
  "QC Pending",
  "Waiting QC",
  "Inspecting",
  "QC Passed",
  "QC Failed",
  "Ready For Billing",
  "Rework Required",
];

export function useQC() {
  const [jobs, setJobs] = useState<QCJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getPendingQC();
      const qcJobs = (data || []).filter((j: QCJob) =>
        QC_RELEVANT_STATUSES.includes(j.status)
      );
      setJobs(qcJobs);
      setError(null);
    } catch (err: any) {
      setError("Failed to load QC queue: " + err.message);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Optimistically update a job's status in local state
  const patchJob = (jobId: string, patch: Partial<QCJob>) => {
    setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, ...patch } : j)));
  };

  const startInspection = async (jobId: string) => {
    try {
      patchJob(jobId, { status: "Inspecting" });
      await startInspectionSvc(jobId);
      toast.success("Inspection started");
      return true;
    } catch (err: any) {
      toast.error("Failed to start inspection: " + err.message);
      await fetchJobs();
      return false;
    }
  };

  const submitChecklist = async (jobId: string, checklist: ChecklistResult[]) => {
    try {
      await submitChecklistSvc(jobId, checklist);
      patchJob(jobId, { checklist });
      toast.success("Checklist saved");
      return true;
    } catch (err: any) {
      toast.error("Failed to save checklist: " + err.message);
      return false;
    }
  };

  const passQC = async (jobId: string, notes?: string) => {
    try {
      patchJob(jobId, {
        status: "Ready For Billing",
        passedAt: new Date().toISOString(),
        qcNotes: notes,
      });
      await passQCSvc(jobId, notes);
      toast.success("✅ Ready for Billing — job moved to billing");
      return true;
    } catch (err: any) {
      toast.error("Failed to pass QC: " + err.message);
      await fetchJobs();
      return false;
    }
  };

  const failQC = async (jobId: string, notes: string) => {
    try {
      patchJob(jobId, {
        status: "QC Failed",
        failedAt: new Date().toISOString(),
        qcNotes: notes,
      });
      await failQCSvc(jobId, notes);
      toast.error("❌ QC Failed — job requires rework");
      return true;
    } catch (err: any) {
      toast.error("Failed to record QC failure: " + err.message);
      await fetchJobs();
      return false;
    }
  };

  const sendRework = async (jobId: string, reason: string, notes?: string) => {
    try {
      patchJob(jobId, { status: "Rework" });
      await reworkSvc(jobId, reason, notes);
      toast.success("Job sent back to workshop for rework");
      return true;
    } catch (err: any) {
      toast.error("Failed to send for rework: " + err.message);
      await fetchJobs();
      return false;
    }
  };

  const uploadPhotos = async (jobId: string, files: File[]) => {
    try {
      const result = await uploadQCPhotosSvc(jobId, files);
      patchJob(jobId, { qcPhotos: result.photos });
      toast.success(`${files.length} QC photo(s) uploaded`);
      return true;
    } catch (err: any) {
      toast.error("Failed to upload QC photos: " + err.message);
      return false;
    }
  };

  const addRemarks = async (jobId: string, notes: string) => {
    try {
      await addRemarksSvc(jobId, notes);
      patchJob(jobId, { qcNotes: notes });
      toast.success("QC remarks saved");
      return true;
    } catch (err: any) {
      toast.error("Failed to save remarks: " + err.message);
      return false;
    }
  };

  const today = new Date().toISOString().slice(0, 10);

  const stats: QCStats = {
    waitingQC: jobs.filter((j) =>
      j.status === "Waiting QC" ||
      j.status === "Completed" ||
      j.status === "Work Completed" ||
      j.status === "QC Pending"
    ).length,
    inspecting: jobs.filter((j) => j.status === "Inspecting" || j.status === "In Inspection").length,
    readyForBilling: jobs.filter((j) => j.status === "Ready for Billing" || j.status === "Ready For Billing" || j.status === "QC Passed").length,
    rework: jobs.filter((j) => j.status === "Rework" || j.status === "QC Failed" || j.status === "Rework Required").length,
    passedToday: jobs.filter(
      (j) => j.status === "QC Passed" && (j.passedAt || "").startsWith(today)
    ).length,
    failedToday: jobs.filter(
      (j) => (j.status === "QC Failed" || j.status === "Rework Required") && (j.failedAt || "").startsWith(today)
    ).length,
    reworkPending: jobs.filter((j) => j.status === "Rework" || j.status === "Rework Required").length,
  };

  return {
    jobs,
    isLoading,
    error,
    stats,
    fetchJobs,
    startInspection,
    submitChecklist,
    passQC,
    failQC,
    sendRework,
    uploadPhotos,
    addRemarks,
  };
}
