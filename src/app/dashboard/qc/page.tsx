"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Search, Building2, X, Plus } from "lucide-react";
import { useQC } from "@/modules/qc/hooks/useQC";
import { QCTable } from "@/modules/qc/components/QCTable";
import { QCChecklistDialog } from "@/modules/qc/components/QCChecklistDialog";
import { QCPhotosDialog } from "@/modules/qc/components/QCPhotosDialog";
import { QCRemarksDialog } from "@/modules/qc/components/QCRemarksDialog";
import { PassDialog } from "@/modules/qc/components/PassDialog";
import { FailDialog } from "@/modules/qc/components/FailDialog";
import { AssignInspectorDialog } from "@/modules/qc/components/AssignInspectorDialog";
import AddEmployeeDialog from "@/components/employees/AddEmployeeDialog";
import { getCurrentUser } from "@/lib/franchise-scope";
import { QCJob } from "@/modules/qc/types/qc.types";
import { getEmployees, getFranchises, createEmployee } from "@/lib/api";
import { toast } from "react-hot-toast";
import { StatusText } from "@/components/common/StatusText";
import { SummaryCard } from "@/components/common/SummaryCard";

type DialogType = "checklist" | "photos" | "remarks" | "pass" | "fail" | "assign" | null;

// Roles that may assign a QC inspector or record Pass/Fail directly.
const MANAGEMENT_ROLES = ["SUPER_ADMIN", "SUPERADMIN", "HQ_USER", "FRANCHISE_ADMIN", "BRANCH_MANAGER"];

interface QCInspector {
  id: string;
  name: string;
  username?: string;
  email?: string;
  role: string;
  phone?: string;
  franchiseId?: string | null;
  branch?: string;
  assignedCount?: number;
  status?: string;
  createdAt?: string;
}

export default function QCInspectionPage() {
  const {
    jobs,
    isLoading,
    stats,
    getCurrentInspection,
    hasOpenInspection,
    startInspection,
    submitChecklist,
    passQC,
    failQC,
    uploadPhotos,
    addRemarks,
    assignInspector,
  } = useQC();

  const [canManage, setCanManage] = useState(false);
  useEffect(() => {
    const role = (getCurrentUser()?.role || "").toUpperCase().replace(/[s_]+/g, "_");
    setCanManage(MANAGEMENT_ROLES.includes(role));
  }, []);

  const [activeTab, setActiveTab] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJob, setSelectedJob] = useState<QCJob | null>(null);
  const [activeDialog, setActiveDialog] = useState<DialogType>(null);
  const [qcInspectors, setQcInspectors] = useState<QCInspector[]>([]);
  const [franchises, setFranchises] = useState<any[]>([]);
  const [selectedQcBranch, setSelectedQcBranch] = useState<string>("ALL");
  const [loadingInspectors, setLoadingInspectors] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [inspectorSearch, setInspectorSearch] = useState("");

  // Fetch QC Personnel & Franchises
  const loadPersonnel = useCallback(async () => {
    try {
      setLoadingInspectors(true);
      const [allEmps, franData] = await Promise.all([
        getEmployees(),
        getFranchises().catch(() => []),
      ]);

      setFranchises(Array.isArray(franData) ? franData : []);

      if (Array.isArray(allEmps)) {
        const qcEmps = allEmps.filter((e: any) => {
          const r = (e.role || "").toLowerCase();
          return (
            r.includes("qc") ||
            r.includes("quality") ||
            r.includes("inspector") ||
            r.includes("assurance")
          );
        });

        const formatted = qcEmps.map((e: any) => {
          const b = typeof e.branch === "string" ? e.branch : e.branch?.name || (e.franchiseId ? "Franchise Branch" : "Headquarters (HQ)");
          return {
            id: e.id,
            name: e.name || e.username || "QC Staff",
            username: e.username || "",
            email: e.email || "",
            role: e.role || "QC Inspector",
            phone: e.phone || e.mobile || e.contactNo || "-",
            franchiseId: e.franchiseId || null,
            branch: b,
            status: e.status || "Active Duty",
            createdAt: e.createdAt || e.date || e.joinedDate || "",
          };
        });

        setQcInspectors(formatted);
      }
    } catch (err) {
      console.error("Failed to load QC personnel/franchises:", err);
    } finally {
      setLoadingInspectors(false);
    }
  }, []);

  useEffect(() => {
    loadPersonnel();
  }, [loadPersonnel]);

  const handleAdd = async (employeeData: any) => {
    try {
      await createEmployee({
        ...employeeData,
        role: employeeData.role || "QUALITY_INSPECTOR",
        franchiseId: (employeeData.franchiseId && employeeData.franchiseId !== "HQ") ? employeeData.franchiseId : null
      });
      toast.success("QC inspector added successfully");
      setIsAddOpen(false);
      loadPersonnel();
    } catch (err: any) {
      toast.error("Failed to add QC inspector: " + err.message);
    }
  };

  // Filter Inspectors by Branch & Search Query
  const selectedQcBranchName = useMemo(() => {
    if (selectedQcBranch === "ALL") return "All Branches";
    if (selectedQcBranch === "HQ") return "Headquarters (HQ)";
    const found = franchises.find((f) => String(f.id) === String(selectedQcBranch));
    return found?.name || "Franchise Branch";
  }, [selectedQcBranch, franchises]);

  const filteredQcInspectors = useMemo(() => {
    let list = qcInspectors;

    // 1. Branch Filter
    if (selectedQcBranch !== "ALL") {
      if (selectedQcBranch === "HQ") {
        list = list.filter(
          (i) => !i.franchiseId || i.branch?.toLowerCase().includes("hq") || i.branch?.toLowerCase().includes("headquarters")
        );
      } else {
        list = list.filter((i) => {
          if (i.franchiseId === selectedQcBranch) return true;
          const matchFran = franchises.find((f) => f.id === selectedQcBranch);
          if (matchFran && i.branch?.toLowerCase().includes(matchFran.name.toLowerCase())) return true;
          return false;
        });
      }
    }

    // 2. Search Filter
    if (inspectorSearch.trim()) {
      const q = inspectorSearch.trim().toLowerCase();
      list = list.filter(
        (i) =>
          (i.name || "").toLowerCase().includes(q) ||
          (i.username || "").toLowerCase().includes(q) ||
          (i.email || "").toLowerCase().includes(q) ||
          (i.role || "").toLowerCase().includes(q) ||
          (i.phone || "").toLowerCase().includes(q) ||
          (i.branch || "").toLowerCase().includes(q)
      );
    }

    return list;
  }, [qcInspectors, selectedQcBranch, franchises, inspectorSearch]);

  // Performance Summary calculations
  const awaitingCount = useMemo(() => {
    return jobs.filter((j) => !hasOpenInspection(j.id) && j.status !== "Ready For Billing").length;
  }, [jobs, hasOpenInspection]);

  const passedCount = useMemo(() => {
    return jobs.filter((j) => j.status === "Ready For Billing").length;
  }, [jobs]);

  const failedCount = useMemo(() => {
    return jobs.filter((j) => j.status === "Rework Required").length;
  }, [jobs]);

  const totalEvaluated = passedCount + failedCount;
  const passRate = totalEvaluated > 0 ? Math.round((passedCount / totalEvaluated) * 100) : 100;

  // Filtered Jobs by Tab & Search
  const filteredJobs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return jobs.filter((j) => {
      let matchesTab = true;

      if (activeTab === "Passed") {
        matchesTab = j.status === "Ready For Billing";
      } else if (activeTab === "Rework") {
        matchesTab = j.status === "Rework Required";
      } else if (activeTab === "Inspecting") {
        matchesTab = hasOpenInspection(j.id);
      } else if (activeTab === "Awaiting") {
        matchesTab = !hasOpenInspection(j.id) && j.status !== "Ready For Billing";
      }

      const matchesSearch =
        !q ||
        j.id?.toLowerCase().includes(q) ||
        j.vehicle?.toLowerCase().includes(q) ||
        j.customer?.toLowerCase().includes(q) ||
        j.technician?.toLowerCase().includes(q) ||
        j.service?.toLowerCase().includes(q);

      return matchesTab && matchesSearch;
    });
  }, [jobs, activeTab, searchQuery, hasOpenInspection]);

  const openDialog = (type: DialogType) => (job: QCJob) => {
    setSelectedJob(job);
    setActiveDialog(type);
  };

  // Phase 4B-2D-A — the checklist dialog renders exclusively from the
  // active attempt's frozen checklist (QCInspection.checklist), never from a
  // live template fetch. Opening it must therefore guarantee an attempt
  // actually exists (and is therefore frozen) first: startInspection is
  // idempotent (Phase 4A's getOrCreateOpenInspection returns the existing
  // Pending attempt if one is already open, freezing nothing new), so this
  // is safe to call every time, including when the inspection already
  // exists in the backend but hasn't been fetched into this session yet.
  const openChecklistDialog = async (job: QCJob) => {
    const started = await startInspection(job.id, { silent: true });
    if (!started) return;
    setSelectedJob(job);
    setActiveDialog("checklist");
  };

  const closeDialog = () => {
    setActiveDialog(null);
    setSelectedJob(null);
  };

  const QUEUE_FILTERS: { id: string; label: string; count: number; tone?: "good" | "bad" }[] = [
    { id: "All", label: "All Jobs", count: jobs.length },
    { id: "Awaiting", label: "Awaiting Review", count: awaitingCount },
    { id: "Inspecting", label: "Inspecting", count: stats.inspecting },
    { id: "Passed", label: "QC Passed", count: passedCount, tone: "good" },
    { id: "Rework", label: "Rework Required", count: failedCount, tone: "bad" },
  ];
  const activeFilterLabel = QUEUE_FILTERS.find((f) => f.id === activeTab)?.label ?? "All Jobs";

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      {/* 1. Queue status — each card is also the queue filter */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {QUEUE_FILTERS.map((f) => (
          <SummaryCard
            key={f.id}
            label={f.label}
            value={f.count}
            tone={f.tone}
            active={activeTab === f.id}
            onClick={() => setActiveTab(f.id)}
          />
        ))}
      </div>

      {/* 2. QC Queue — the main work area */}
      <section className="space-y-3">
        <div className="bg-white border border-slate-200 rounded-lg px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              QC Queue <span className="font-normal text-slate-500">· {activeFilterLabel} ({filteredJobs.length})</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Pass rate{" "}
              {totalEvaluated > 0 ? (
                <span className={`font-semibold ${passRate >= 80 ? "text-green-700" : "text-red-600"}`}>{passRate}%</span>
              ) : (
                <span className="font-semibold text-slate-700">—</span>
              )}{" "}
              · {totalEvaluated} evaluated
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search job, vehicle, customer, service..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-slate-500 bg-white rounded-lg border border-slate-200">Loading QC queue...</div>
        ) : (
          <QCTable
            jobs={filteredJobs}
            emptyMessage={
              searchQuery
                ? `No jobs match "${searchQuery}".`
                : activeTab === "All"
                ? "No jobs in the QC queue right now. Jobs appear here when a technician marks work as completed."
                : `No jobs in "${activeFilterLabel}".`
            }
            hasOpenInspection={hasOpenInspection}
            getCurrentInspection={getCurrentInspection}
            onInspect={(job) => startInspection(job.id)}
            onOpenChecklist={openChecklistDialog}
            onOpenPhotos={openDialog("photos")}
            onOpenRemarks={openDialog("remarks")}
            onPass={openDialog("pass")}
            onFail={openDialog("fail")}
            canManage={canManage}
            onAssign={openDialog("assign")}
          />
        )}
      </section>

      {/* 3. QC Team — the people who inspect */}
      <section className="bg-white border border-slate-200 rounded-lg">
        <div className="px-4 py-3 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-slate-900">
            QC Team <span className="font-normal text-slate-500">({filteredQcInspectors.length})</span>
          </h2>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search name, phone..."
                value={inspectorSearch}
                onChange={(e) => setInspectorSearch(e.target.value)}
                className="w-full pl-8 pr-7 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
              {inspectorSearch && (
                <button
                  type="button"
                  onClick={() => setInspectorSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm">
              <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
              <select
                value={selectedQcBranch}
                onChange={(e) => setSelectedQcBranch(e.target.value)}
                className="bg-transparent border-none text-sm text-gray-800 focus:outline-none cursor-pointer"
                aria-label="Branch"
              >
                <option value="ALL">All Branches</option>
                <option value="HQ">Headquarters (HQ)</option>
                {franchises.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setIsAddOpen(true)}
              className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors text-sm whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add QC Inspector
            </button>
          </div>
        </div>

        {loadingInspectors ? (
          <div className="p-8 text-center text-slate-500 text-sm">Loading QC team...</div>
        ) : filteredQcInspectors.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            {qcInspectors.length === 0
              ? "No QC inspectors yet. Use “Add QC Inspector” to add someone who can pass or fail jobs."
              : `No QC inspectors in ${selectedQcBranchName}${inspectorSearch ? ` matching "${inspectorSearch}"` : ""}.`}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full min-w-[700px] text-left">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Phone</th>
                  <th>Branch</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredQcInspectors.map((inspector) => (
                  <tr key={inspector.id}>
                    <td className="whitespace-nowrap">{inspector.name}</td>
                    <td className="whitespace-nowrap capitalize">{inspector.role.replace(/_/g, " ").toLowerCase()}</td>
                    <td className="whitespace-nowrap">{inspector.phone}</td>
                    <td className="max-w-[200px] truncate">{inspector.branch}</td>
                    <td className="whitespace-nowrap"><StatusText status={inspector.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Action Dialogs — all operate against the current QCInspection attempt
          for the selected job, not the legacy Job.checklist/Job.qcPhotos fields */}
      <QCChecklistDialog
        job={selectedJob}
        checklist={selectedJob ? getCurrentInspection(selectedJob.id)?.checklist : null}
        isOpen={activeDialog === "checklist"}
        onClose={closeDialog}
        onSubmit={(checklist) => submitChecklist(selectedJob!.id, checklist)}
      />
      <QCPhotosDialog
        job={selectedJob}
        photos={(selectedJob ? getCurrentInspection(selectedJob.id)?.photos : []) || []}
        isOpen={activeDialog === "photos"}
        onClose={closeDialog}
        onUpload={(files, category) => uploadPhotos(selectedJob!.id, category, files)}
      />
      <QCRemarksDialog
        job={selectedJob}
        isOpen={activeDialog === "remarks"}
        onClose={closeDialog}
        onSave={(notes) => addRemarks(selectedJob!.id, notes)}
      />
      <PassDialog
        job={selectedJob}
        checklist={selectedJob ? getCurrentInspection(selectedJob.id)?.checklist : null}
        checklistDefinition={selectedJob ? getCurrentInspection(selectedJob.id)?.checklistDefinition : null}
        isOpen={activeDialog === "pass"}
        onClose={closeDialog}
        onPass={(notes) => passQC(selectedJob!.id, notes, { quick: canManage })}
      />
      <FailDialog
        job={selectedJob}
        checklist={selectedJob ? getCurrentInspection(selectedJob.id)?.checklist : null}
        isOpen={activeDialog === "fail"}
        onClose={closeDialog}
        onFail={(notes) => failQC(selectedJob!.id, notes, { quick: canManage })}
      />
      <AssignInspectorDialog
        job={selectedJob}
        isOpen={activeDialog === "assign"}
        onClose={closeDialog}
        onAssign={(inspector) => assignInspector(selectedJob!.id, inspector)}
      />

      {isAddOpen && (
        <AddEmployeeDialog
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          onAdd={handleAdd}
          franchises={franchises}
          defaultRole="QUALITY_INSPECTOR"
        />
      )}
    </div>
  );
}

