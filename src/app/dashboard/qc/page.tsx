"use client";

import { useState, useMemo } from "react";
import { ShieldCheck } from "lucide-react";
import { useQC } from "@/modules/qc/hooks/useQC";
import { QCCard } from "@/modules/qc/components/QCCard";
import { QCFilters } from "@/modules/qc/components/QCFilters";
import { QCTable } from "@/modules/qc/components/QCTable";
import { QCChecklistDialog } from "@/modules/qc/components/QCChecklistDialog";
import { QCPhotosDialog } from "@/modules/qc/components/QCPhotosDialog";
import { QCRemarksDialog } from "@/modules/qc/components/QCRemarksDialog";
import { PassDialog } from "@/modules/qc/components/PassDialog";
import { FailDialog } from "@/modules/qc/components/FailDialog";
import { ReworkDialog } from "@/modules/qc/components/ReworkDialog";
import { QCJob } from "@/modules/qc/types/qc.types";

type DialogType = "checklist" | "photos" | "remarks" | "pass" | "fail" | "rework" | null;

export default function QCInspectionPage() {
  const {
    jobs, isLoading, stats,
    startInspection, submitChecklist, passQC, failQC, sendRework, uploadPhotos, addRemarks,
  } = useQC();

  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJob, setSelectedJob] = useState<QCJob | null>(null);
  const [activeDialog, setActiveDialog] = useState<DialogType>(null);

  const filteredJobs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return jobs.filter((j) => {
      const matchesStatus = statusFilter === "All" || j.status === statusFilter;
      const matchesSearch =
        !q ||
        j.vehicle?.toLowerCase().includes(q) ||
        j.customer?.toLowerCase().includes(q) ||
        j.technician?.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [jobs, statusFilter, searchQuery]);

  const openDialog = (type: DialogType) => (job: QCJob) => {
    setSelectedJob(job);
    setActiveDialog(type);
  };

  const closeDialog = () => {
    setActiveDialog(null);
    setSelectedJob(null);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-yellow-500" />
          QC Inspection
        </h1>
        <p className="text-gray-500 mt-1">Inspect, pass, fail, or rework jobs sent from the workshop</p>
      </div>

      <QCCard stats={stats} />

      <QCFilters
        statusFilter={statusFilter}
        searchQuery={searchQuery}
        onStatusChange={setStatusFilter}
        onSearchChange={setSearchQuery}
      />

      {isLoading ? (
        <div className="py-16 text-center text-gray-400">Loading QC queue...</div>
      ) : (
        <QCTable
          jobs={filteredJobs}
          onInspect={(job) => startInspection(job.id)}
          onOpenChecklist={openDialog("checklist")}
          onOpenPhotos={openDialog("photos")}
          onOpenRemarks={openDialog("remarks")}
          onPass={openDialog("pass")}
          onFail={openDialog("fail")}
          onRework={openDialog("rework")}
        />
      )}

      <QCChecklistDialog
        job={selectedJob}
        isOpen={activeDialog === "checklist"}
        onClose={closeDialog}
        onSubmit={(checklist) => submitChecklist(selectedJob!.id, checklist)}
      />
      <QCPhotosDialog
        job={selectedJob}
        isOpen={activeDialog === "photos"}
        onClose={closeDialog}
        onUpload={(files) => uploadPhotos(selectedJob!.id, files)}
      />
      <QCRemarksDialog
        job={selectedJob}
        isOpen={activeDialog === "remarks"}
        onClose={closeDialog}
        onSave={(notes) => addRemarks(selectedJob!.id, notes)}
      />
      <PassDialog
        job={selectedJob}
        isOpen={activeDialog === "pass"}
        onClose={closeDialog}
        onPass={(notes) => passQC(selectedJob!.id, notes)}
      />
      <FailDialog
        job={selectedJob}
        isOpen={activeDialog === "fail"}
        onClose={closeDialog}
        onFail={(notes) => failQC(selectedJob!.id, notes)}
      />
      <ReworkDialog
        job={selectedJob}
        isOpen={activeDialog === "rework"}
        onClose={closeDialog}
        onRework={(reason, notes) => sendRework(selectedJob!.id, reason, notes)}
      />
    </div>
  );
}
