"use client";

import { useState, useCallback, useEffect } from "react";
import { WorkshopJob, MaterialRecord, WorkshopStats } from "../types/workshop.types";
import {
  getMyJobs,
  startWork as startWorkSvc,
  pauseWork as pauseWorkSvc,
  resumeWork as resumeWorkSvc,
  completeWork as completeWorkSvc,
  uploadPhotos as uploadPhotosSvc,
  recordMaterial as recordMaterialSvc,
  sendToQC as sendToQCSvc,
  updateProgress as updateProgressSvc,
} from "../services/workshop.service";
import { toast } from "react-hot-toast";

export function useWorkshop() {
  const [jobs, setJobs] = useState<WorkshopJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getMyJobs();
      // Workshop only sees jobs relevant to work execution — filter out billing-only statuses
      const workshopJobs = (data || []).filter((j: WorkshopJob) =>
        ["Assigned", "In Progress", "Paused", "Completed", "Waiting QC", "QC Failed", "Rework"].includes(j.status)
      );
      setJobs(workshopJobs);
      setError(null);
    } catch (err: any) {
      setError("Failed to load jobs: " + err.message);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Optimistically update a job in local state
  const patchJob = (jobId: string, patch: Partial<WorkshopJob>) => {
    setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, ...patch } : j)));
  };

  const startWork = async (jobId: string) => {
    try {
      patchJob(jobId, { status: "In Progress", startedAt: new Date().toISOString() });
      await startWorkSvc(jobId);
      toast.success("Work started!");
      return true;
    } catch (err: any) {
      toast.error("Failed to start work: " + err.message);
      await fetchJobs();
      return false;
    }
  };

  const pauseWork = async (jobId: string, note?: string) => {
    try {
      patchJob(jobId, { status: "Paused" });
      await pauseWorkSvc(jobId, note);
      toast.success("Work paused");
      return true;
    } catch (err: any) {
      toast.error("Failed to pause work: " + err.message);
      await fetchJobs();
      return false;
    }
  };

  const resumeWork = async (jobId: string) => {
    try {
      patchJob(jobId, { status: "In Progress" });
      await resumeWorkSvc(jobId);
      toast.success("Work resumed!");
      return true;
    } catch (err: any) {
      toast.error("Failed to resume work: " + err.message);
      await fetchJobs();
      return false;
    }
  };

  const updateProgress = async (jobId: string, notes: string) => {
    try {
      await updateProgressSvc(jobId, notes);
      patchJob(jobId, { notes });
      toast.success("Notes saved");
      return true;
    } catch (err: any) {
      toast.error("Failed to save notes: " + err.message);
      return false;
    }
  };

  const completeWork = async (jobId: string, data: { notes?: string; actualCompletion?: string }) => {
    try {
      patchJob(jobId, {
        status: "Completed",
        actualCompletion: data.actualCompletion || new Date().toISOString().slice(0, 10),
      });
      await completeWorkSvc(jobId, data);
      toast.success("Job marked as completed!");
      return true;
    } catch (err: any) {
      toast.error("Failed to complete job: " + err.message);
      await fetchJobs();
      return false;
    }
  };

  const uploadPhotos = async (jobId: string, files: File[]) => {
    try {
      const result = await uploadPhotosSvc(jobId, files);
      patchJob(jobId, { photos: result.photos });
      toast.success(`${files.length} photo(s) uploaded`);
      return true;
    } catch (err: any) {
      toast.error("Failed to upload photos: " + err.message);
      return false;
    }
  };

  const recordMaterial = async (jobId: string, material: Omit<MaterialRecord, "jobId" | "addedAt">) => {
    try {
      const newRecord = await recordMaterialSvc(jobId, material);
      setJobs((prev) =>
        prev.map((j) =>
          j.id === jobId
            ? { ...j, materials: [...(j.materials || []), newRecord] }
            : j
        )
      );
      toast.success("Material recorded");
      return true;
    } catch (err: any) {
      toast.error("Failed to record material: " + err.message);
      return false;
    }
  };

  const sendToQC = async (jobId: string, notes?: string) => {
    try {
      patchJob(jobId, { status: "Waiting QC" });
      await sendToQCSvc(jobId, notes);
      toast.success("Job sent to QC!");
      return true;
    } catch (err: any) {
      toast.error("Failed to send to QC: " + err.message);
      await fetchJobs();
      return false;
    }
  };

  const stats: WorkshopStats = {
    myJobs: jobs.length,
    pending: jobs.filter((j) => j.status === "Assigned").length,
    inProgress: jobs.filter((j) => j.status === "In Progress" || j.status === "Paused").length,
    completedToday: jobs.filter((j) => {
      if (j.status !== "Completed") return false;
      const today = new Date().toISOString().slice(0, 10);
      return (j.actualCompletion || j.completedAt || "").startsWith(today);
    }).length,
    sentToQC: jobs.filter((j) => j.status === "Waiting QC").length,
  };

  return {
    jobs,
    isLoading,
    error,
    stats,
    fetchJobs,
    startWork,
    pauseWork,
    resumeWork,
    updateProgress,
    completeWork,
    uploadPhotos,
    recordMaterial,
    sendToQC,
  };
}
