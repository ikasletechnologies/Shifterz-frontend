import { useState, useCallback, useEffect, useMemo } from "react";
import { QCJob, ChecklistResult, QCStats, QCInspection } from "../types/qc.types";
import {
  getPendingQC,
  startInspection as startInspectionSvc,
  getInspections as getInspectionsSvc,
  submitChecklist as submitChecklistSvc,
  passQC as passQCSvc,
  failQC as failQCSvc,
  uploadQCPhotos as uploadQCPhotosSvc,
  addRemarks as addRemarksSvc,
  assignInspector as assignInspectorSvc,
  prepareForDecision,
} from "../services/qc.service";
import { toast } from "react-hot-toast";

export function useQC() {
  const [jobs, setJobs] = useState<QCJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Phase 4B-1: the canonical attempt record for each job, keyed by jobId,
  // newest-attempt-first — NOT derived from Job.status (the backend never
  // persists an "Inspecting" Job status; an open attempt lives only as a
  // Pending QCInspection row).
  const [inspectionsByJob, setInspectionsByJob] = useState<Record<string, QCInspection[]>>({});

  const fetchJobs = useCallback(async () => {
    try {
      setIsLoading(true);
      const data: QCJob[] = (await getPendingQC()) || [];
      setJobs(data);
      setError(null);
      // Load every queued job's attempts up front so jobs already assigned to
      // an inspector (or mid-inspection) show that state on first render.
      const entries = await Promise.all(
        data.map(async (j) => [j.id, await getInspectionsSvc(j.id).catch(() => [])] as const)
      );
      setInspectionsByJob(Object.fromEntries(entries));
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

  const refreshInspections = useCallback(async (jobId: string) => {
    try {
      const inspections = await getInspectionsSvc(jobId);
      setInspectionsByJob((prev) => ({ ...prev, [jobId]: inspections }));
      return inspections;
    } catch (err) {
      console.error("Failed to load QC inspection attempts:", err);
      return [];
    }
  }, []);

  // `silent` — Phase 4B-2D-A: the checklist dialog now proactively calls this
  // (idempotently — Phase 4A's getOrCreateOpenInspection just returns the
  // existing Pending attempt if there is one) every time it's opened, so its
  // frozen checklist is guaranteed loaded before rendering. That would fire
  // an "Inspection opened" toast on every single dialog open, including
  // reopening an attempt that's been open for days — silent:true suppresses
  // that for this codepath while leaving the deliberate "Inspect" button
  // (QCTable's onInspect) unchanged.
  const startInspection = async (jobId: string, opts?: { silent?: boolean }) => {
    try {
      await startInspectionSvc(jobId);
      await refreshInspections(jobId);
      if (!opts?.silent) toast.success("Inspection opened");
      return true;
    } catch (err: any) {
      toast.error("Failed to start inspection: " + err.message);
      return false;
    }
  };

  const submitChecklist = async (jobId: string, checklist: ChecklistResult[]) => {
    try {
      await submitChecklistSvc(jobId, checklist);
      await refreshInspections(jobId);
      toast.success("Checklist saved");
      return true;
    } catch (err: any) {
      toast.error("Failed to save checklist: " + err.message);
      return false;
    }
  };

  // `quick` — management decides directly: any unanswered checklist items
  // are filled in as Passed first (see prepareForDecision).
  const passQC = async (jobId: string, notes?: string, opts?: { quick?: boolean }) => {
    try {
      if (opts?.quick) await prepareForDecision(jobId);
      await passQCSvc(jobId, notes);
      setInspectionsByJob((prev) => {
        const next = { ...prev };
        delete next[jobId];
        return next;
      });
      toast.success("✅ Ready for Billing — job moved to billing");
      await fetchJobs();
      return true;
    } catch (err: any) {
      toast.error("Failed to pass QC: " + err.message);
      return false;
    }
  };

  const failQC = async (jobId: string, notes: string, opts?: { quick?: boolean }) => {
    try {
      if (opts?.quick) await prepareForDecision(jobId);
      await failQCSvc(jobId, notes);
      setInspectionsByJob((prev) => {
        const next = { ...prev };
        delete next[jobId];
        return next;
      });
      toast.error("❌ QC Failed — job requires rework");
      await fetchJobs();
      return true;
    } catch (err: any) {
      toast.error("Failed to record QC failure: " + err.message);
      return false;
    }
  };

  const assignInspector = async (jobId: string, inspector: { id: string; name: string }) => {
    try {
      await assignInspectorSvc(jobId, inspector.id);
      await refreshInspections(jobId);
      toast.success(`QC Inspector ${inspector.name} assigned`);
      return true;
    } catch (err: any) {
      toast.error("Failed to assign QC inspector: " + err.message);
      return false;
    }
  };

  const uploadPhotos = async (jobId: string, category: string, files: File[]) => {
    try {
      await uploadQCPhotosSvc(jobId, category, files);
      await refreshInspections(jobId);
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
      toast.success("QC remarks saved");
      return true;
    } catch (err: any) {
      toast.error("Failed to save remarks: " + err.message);
      return false;
    }
  };

  // The current attempt is simply the newest one (getInspections orders
  // attemptNumber desc) — at most one attempt is ever Pending at a time
  // (Phase 4A unique constraint + row-locked allocation), so "newest" and
  // "open" coincide whenever an attempt is in progress.
  const getCurrentInspection = useCallback(
    (jobId: string): QCInspection | undefined => inspectionsByJob[jobId]?.[0],
    [inspectionsByJob]
  );

  const hasOpenInspection = useCallback(
    (jobId: string): boolean => inspectionsByJob[jobId]?.[0]?.result === "Pending",
    [inspectionsByJob]
  );

  const today = new Date().toISOString().slice(0, 10);

  const stats: QCStats = useMemo(() => {
    const openCount = jobs.filter((j) => hasOpenInspection(j.id)).length;
    return {
      waitingQC: jobs.filter((j) => ["Completed", "Work Completed", "Waiting for Quality Check"].includes(j.status) && !hasOpenInspection(j.id)).length,
      inspecting: openCount,
      readyForBilling: jobs.filter((j) => j.status === "Ready For Billing").length,
      rework: jobs.filter((j) => j.status === "Rework Required").length,
      passedToday: jobs.filter((j) => j.status === "Ready For Billing" && (j.passedAt || "").startsWith(today)).length,
      failedToday: jobs.filter((j) => j.status === "Rework Required" && (j.failedAt || "").startsWith(today)).length,
      reworkPending: jobs.filter((j) => j.status === "Rework Required").length,
    };
  }, [jobs, hasOpenInspection, today]);

  return {
    jobs,
    isLoading,
    error,
    stats,
    inspectionsByJob,
    getCurrentInspection,
    hasOpenInspection,
    fetchJobs,
    startInspection,
    submitChecklist,
    passQC,
    failQC,
    assignInspector,
    uploadPhotos,
    addRemarks,
  };
}
