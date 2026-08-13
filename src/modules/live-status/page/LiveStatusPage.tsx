"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { RefreshCw } from "lucide-react";
import { useLiveStatus } from "../hooks/useLiveStatus";
import { LiveStatusFilters } from "../components/LiveStatusFilters";
import { LiveStatusTable } from "../components/LiveStatusTable";
import { LiveStatusReports } from "../components/LiveStatusReports";
import { LiveVehicleRecord, LiveStage } from "../types/live-status.types";
import { updateJobCard } from "@/modules/job-card/services/job-card.service";
import { JobCardFormData } from "@/modules/job-card/types/job-card.types";
import { ViewJobCardDialog } from "@/modules/job-card/components/ViewJobCardDialog";
import { CreateJobCardDialog } from "@/modules/job-card/components/CreateJobCardDialog";
import { getFranchises } from "@/lib/api";

function getCurrentUser() {
  try {
    if (typeof window === "undefined") return null;
    const u = localStorage.getItem("user");
    return u ? JSON.parse(u) : null;
  } catch {
    return null;
  }
}

function timeAgo(date: Date | null): string {
  if (!date) return "";
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 5) return "just now";
  if (secs < 60) return `${secs}s ago`;
  return `${Math.floor(secs / 60)}m ago`;
}

export function LiveStatusPage() {
  const { records, allJobCards, isLoading, error, lastUpdated, refetch } = useLiveStatus();

  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<LiveStage | "All">("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [technicianFilter, setTechnicianFilter] = useState("All");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [franchiseFilter, setFranchiseFilter] = useState("All");
  const [franchises, setFranchises] = useState<{ id: string; name: string }[]>([]);

  const [viewingRecord, setViewingRecord] = useState<LiveVehicleRecord | null>(null);
  const [editingRecord, setEditingRecord] = useState<LiveVehicleRecord | null>(null);

  const currentUser = getCurrentUser();
  const userRole = (currentUser?.role || "").toUpperCase().replace(/[\s_]+/g, "_");
  const isHQ = userRole === "SUPER_ADMIN" || userRole === "SUPERADMIN" || userRole === "HQ" || userRole === "HQ_USER";

  const hasFranchiseData = useMemo(() => records.some((r) => r.franchiseId || r.franchiseName), [records]);
  const showFranchiseFilter = isHQ && hasFranchiseData;

  useEffect(() => {
    if (!showFranchiseFilter) return;
    getFranchises()
      .then((data: any[]) => setFranchises((data || []).map((f) => ({ id: f.id, name: f.name || f.franchiseName || f.id }))))
      .catch((err) => console.error("Live status: failed to load franchises", err));
  }, [showFranchiseFilter]);

  const technicians = useMemo(
    () => Array.from(new Set(records.map((r) => r.technician).filter((t): t is string => !!t))).sort(),
    [records]
  );

  const filteredRecords = records.filter((r) => {
    if (stageFilter !== "All" && r.stage !== stageFilter) return false;
    if (priorityFilter !== "All" && r.priority !== priorityFilter) return false;
    if (technicianFilter !== "All" && r.technician !== technicianFilter) return false;
    if (showFranchiseFilter && franchiseFilter !== "All" && r.franchiseId !== franchiseFilter) return false;

    if (fromDate) {
      const start = new Date(fromDate + "T00:00:00");
      const d = r.checkInTime ? new Date(r.checkInTime) : null;
      if (d && !isNaN(d.getTime()) && d < start) return false;
    }
    if (toDate) {
      const end = new Date(toDate + "T23:59:59.999");
      const d = r.checkInTime ? new Date(r.checkInTime) : null;
      if (d && !isNaN(d.getTime()) && d > end) return false;
    }

    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return (
      r.vehicle?.toLowerCase().includes(q) ||
      r.customer?.toLowerCase().includes(q) ||
      (r.jobCardId || "").toLowerCase().includes(q) ||
      (r.technician || "").toLowerCase().includes(q)
    );
  });

  const handleSaveEdit = async (data: JobCardFormData) => {
    if (!data.id) return;
    try {
      await updateJobCard(data.id, data);
      toast.success("Job card updated");
      setEditingRecord(null);
      await refetch();
    } catch (err: any) {
      toast.error("Failed to update job card: " + err.message);
    }
  };

  const handlePrint = (record: LiveVehicleRecord) => {
    if (!record.jobCard) return;
    const job = record.jobCard;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, 210, 24, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(`JOB CARD - ${job.vehicle}`, 14, 16);

    autoTable(doc, {
      startY: 30,
      head: [["Field", "Details"]],
      body: [
        ["Job Card #", job.id],
        ["Vehicle", job.vehicle],
        ["Customer", job.customer],
        ["Phone", job.phone || job.customerPhone || "-"],
        ["Service", job.service],
        ["Assigned To", job.technician || "Unassigned"],
        ["Priority", record.priority],
        ["Stage", record.stage],
        ["Status", job.status],
        ["Start Date", job.startDate || "-"],
        ["Expected Completion", job.estCompletion || "-"],
      ],
      theme: "striped",
      headStyles: { fillColor: [240, 177, 0], textColor: [17, 24, 39], fontStyle: "bold" },
      styles: { fontSize: 10, cellPadding: 4 },
    });

    doc.save(`JobCard_${job.vehicle}_${job.id}.pdf`);
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading live workshop status...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vehicle Live Status Board</h1>
          <p className="text-sm text-gray-500 flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            Updates automatically · last refreshed {timeAgo(lastUpdated)}
          </p>
        </div>
        <LiveStatusReports records={filteredRecords} allJobCards={allJobCards} />
      </div>

      <LiveStatusFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        stageFilter={stageFilter}
        onStageChange={setStageFilter}
        priorityFilter={priorityFilter}
        onPriorityChange={setPriorityFilter}
        technicianFilter={technicianFilter}
        onTechnicianChange={setTechnicianFilter}
        technicians={technicians}
        fromDate={fromDate}
        toDate={toDate}
        onFromDateChange={setFromDate}
        onToDateChange={setToDate}
        franchises={franchises}
        franchiseFilter={franchiseFilter}
        onFranchiseChange={setFranchiseFilter}
        showFranchiseFilter={showFranchiseFilter}
      />

      <LiveStatusTable
        records={filteredRecords}
        onOpenJobCard={setViewingRecord}
        onEditJobCard={setEditingRecord}
        onPrintJobCard={handlePrint}
      />

      <ViewJobCardDialog
        isOpen={!!viewingRecord}
        onClose={() => setViewingRecord(null)}
        job={viewingRecord?.jobCard || null}
      />

      <CreateJobCardDialog
        isOpen={!!editingRecord}
        onClose={() => setEditingRecord(null)}
        onSave={handleSaveEdit}
        initialData={editingRecord?.jobCard || null}
      />
    </div>
  );
}
