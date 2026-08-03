"use client";

import { useState, useCallback, useEffect } from "react";
import { JobCard, JobCardFormData, JobCardStats } from "../types/job-card.types";
import { getJobCards, createJobCard, updateJobCard, deleteJobCard } from "../services/job-card.service";
import { toast } from "react-hot-toast";

export function useJobCards() {
  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobCards = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getJobCards();
      setJobCards(data || []);
      setError(null);
    } catch (err: any) {
      setError("Failed to load job cards: " + err.message);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobCards();
  }, [fetchJobCards]);

  const handleSaveJobCard = async (data: JobCardFormData) => {
    try {
      if (data.id) {
        await updateJobCard(data.id, data);
        toast.success("Job card updated successfully");
      } else {
        await createJobCard(data);
        toast.success("Job card created successfully");
      }
      await fetchJobCards();
      return true;
    } catch (err: any) {
      toast.error("Failed to save job card: " + err.message);
      console.error(err);
      return false;
    }
  };

  const handleDeleteJobCard = async (id: string) => {
    try {
      await deleteJobCard(id);
      setJobCards((prev) => prev.filter((j) => j.id !== id));
      toast.success("Job card deleted successfully");
      return true;
    } catch (err: any) {
      toast.error("Failed to delete job card: " + err.message);
      console.error(err);
      return false;
    }
  };

  const stats: JobCardStats = {
    all: jobCards.length,
    assigned: jobCards.filter((j) => {
      const s = j.status as string;
      return (
        s === "Assigned" ||
        (s !== "Pending" &&
          j.technician &&
          j.technician.trim() !== "" &&
          j.technician.toLowerCase() !== "unassigned" &&
          s !== "Cancelled")
      );
    }).length,
    unassigned: jobCards.filter((j) => {
      const s = j.status as string;
      return (
        s === "Pending" ||
        s === "Unassigned" ||
        !j.technician ||
        j.technician.trim() === "" ||
        j.technician.toLowerCase() === "unassigned" ||
        j.technician.toLowerCase() === "none"
      );
    }).length,
    inProgress: jobCards.filter((j) => {
      const s = j.status as string;
      return s === "In Progress" || s === "Ongoing";
    }).length,
    reviewForQC: jobCards.filter((j) => {
      const s = j.status as string;
      return s === "Review for QC" || s === "Waiting QC" || s === "Inspecting" || s === "In QC";
    }).length,
    completed: jobCards.filter((j) => {
      const s = j.status as string;
      return s === "Completed" || s === "Complete";
    }).length,
    rework: jobCards.filter((j) => {
      const s = j.status as string;
      return s === "Rework" || s === "QC Failed";
    }).length,
    readyForBilling: jobCards.filter((j) => {
      const s = j.status as string;
      return s === "Ready For Billing" || s === "QC Passed";
    }).length,
    delivered: jobCards.filter((j) => {
      const s = j.status as string;
      return s === "Delivered" || s === "Out" || s === "Delivery";
    }).length,
    cancelled: jobCards.filter((j) => {
      const s = j.status as string;
      return s === "Cancelled" || s === "Canceled";
    }).length,
  };

  return {
    jobCards,
    isLoading,
    error,
    stats,
    fetchJobCards,
    handleSaveJobCard,
    handleDeleteJobCard,
  };
}
