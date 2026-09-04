"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  UserCheck,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  TrendingUp,
  Award,
  Users,
  Search,
  Building2,
  Phone,
  HardHat,
  AlertCircle,
  CheckSquare,
  X,
  ChevronRight,
  Plus,
} from "lucide-react";
import { useQC } from "@/modules/qc/hooks/useQC";
import { QCTable } from "@/modules/qc/components/QCTable";
import { QCChecklistDialog } from "@/modules/qc/components/QCChecklistDialog";
import { QCPhotosDialog } from "@/modules/qc/components/QCPhotosDialog";
import { QCRemarksDialog } from "@/modules/qc/components/QCRemarksDialog";
import { PassDialog } from "@/modules/qc/components/PassDialog";
import { FailDialog } from "@/modules/qc/components/FailDialog";
import { ReworkDialog } from "@/modules/qc/components/ReworkDialog";
import AddEmployeeDialog from "@/components/employees/AddEmployeeDialog";
import { QCJob } from "@/modules/qc/types/qc.types";
import { getEmployees, getFranchises, createEmployee } from "@/lib/api";
import { toast } from "react-hot-toast";

type DialogType = "checklist" | "photos" | "remarks" | "pass" | "fail" | "rework" | null;

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
    startInspection,
    submitChecklist,
    passQC,
    failQC,
    sendRework,
    uploadPhotos,
    addRemarks,
  } = useQC();

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
  const [inspectorFromDate, setInspectorFromDate] = useState("");
  const [inspectorToDate, setInspectorToDate] = useState("");

  const getTodayISO = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleInspectorFromDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.value;
    const today = getTodayISO();
    if (selected && selected > today) {
      toast.error("Future dates are not allowed. Please select today or a past date.");
      setInspectorFromDate(today);
      return;
    }
    setInspectorFromDate(selected);
  };

  const handleInspectorToDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.value;
    const today = getTodayISO();
    if (selected && selected > today) {
      toast.error("Future dates are not allowed. Please select today or a past date.");
      setInspectorToDate(today);
      return;
    }
    setInspectorToDate(selected);
  };

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

        const formatted = (qcEmps.length > 0 ? qcEmps : allEmps.slice(0, 4)).map((e: any) => {
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
      toast.success("Technician / Inspector added successfully");
      setIsAddOpen(false);
      loadPersonnel();
    } catch (err: any) {
      toast.error("Failed to add technician: " + err.message);
    }
  };

  // Filter Inspectors by Branch, Search Query & Date Range
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

    // 3. Date Range Filter
    if (inspectorFromDate || inspectorToDate) {
      list = list.filter((i) => {
        if (!i.createdAt) return true;
        const iDate = i.createdAt.split("T")[0];
        if (!iDate) return true;
        if (inspectorFromDate && iDate < inspectorFromDate) return false;
        if (inspectorToDate && iDate > inspectorToDate) return false;
        return true;
      });
    }

    return list;
  }, [qcInspectors, selectedQcBranch, franchises, inspectorSearch, inspectorFromDate, inspectorToDate]);

  // Performance Summary calculations
  const awaitingCount = useMemo(() => {
    return jobs.filter((j) =>
      ["Waiting QC", "QC Pending", "Completed", "Work Completed", "Inspecting", "In Inspection"].includes(j.status)
    ).length;
  }, [jobs]);

  const passedCount = useMemo(() => {
    return jobs.filter((j) =>
      ["QC Passed", "Ready for Billing", "Ready For Billing"].includes(j.status)
    ).length;
  }, [jobs]);

  const failedCount = useMemo(() => {
    return jobs.filter((j) =>
      ["QC Failed", "Rework", "Rework Required"].includes(j.status)
    ).length;
  }, [jobs]);

  const totalEvaluated = passedCount + failedCount;
  const passRate = totalEvaluated > 0 ? Math.round((passedCount / totalEvaluated) * 100) : 100;
  const failRate = totalEvaluated > 0 ? 100 - passRate : 0;

  // Filtered Jobs by Tab & Search
  const filteredJobs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return jobs.filter((j) => {
      let matchesTab = true;

      if (activeTab === "Passed Jobs") {
        matchesTab = ["QC Passed", "Ready for Billing", "Ready For Billing"].includes(j.status);
      } else if (activeTab === "Failed / Rework") {
        matchesTab = ["QC Failed", "Rework", "Rework Required"].includes(j.status);
      } else if (activeTab === "Inspecting") {
        matchesTab = ["Inspecting", "In Inspection"].includes(j.status);
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
  }, [jobs, activeTab, searchQuery]);

  const openDialog = (type: DialogType) => (job: QCJob) => {
    setSelectedJob(job);
    setActiveDialog(type);
  };

  const closeDialog = () => {
    setActiveDialog(null);
    setSelectedJob(null);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Module Title Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-purple-100 text-purple-700">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">QC Inspection Module</h1>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200/80 px-2.5 py-0.5 rounded-lg w-fit mt-1 shadow-2xs">
                <Building2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span>Franchise: {selectedQcBranchName}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold rounded-full">
            Super Admin View
          </span>
          <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-full">
            {jobs.length} Active Records
          </span>
        </div>
      </div>

      {/* SECTION 1: QC Performance Summary */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-purple-600" />
          QC Performance Summary
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Card 1: Pass Rate % */}
          <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pass Rate</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-emerald-600">{passRate}%</span>
                <span className="text-[10px] font-semibold text-gray-400">of reviews</span>
              </div>
            </div>
          </div>

          {/* Card 2: Jobs Awaiting QC Review */}
          <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-sm flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Awaiting Review</p>
              <span className="text-2xl font-black text-amber-600">{awaitingCount}</span>
            </div>
          </div>

          {/* Card 3: QC Passed Jobs */}
          <div className="bg-white p-5 rounded-2xl border border-teal-100 shadow-sm flex items-center gap-4">
            <div className="p-3 rounded-xl bg-teal-50 text-teal-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">QC Passed</p>
              <span className="text-2xl font-black text-teal-600">{passedCount}</span>
            </div>
          </div>

          {/* Card 4: QC Failed / Rework Required */}
          <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm flex items-center gap-4">
            <div className="p-3 rounded-xl bg-rose-50 text-rose-600">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Rework Required</p>
              <span className="text-2xl font-black text-rose-600">{failedCount}</span>
            </div>
          </div>

          {/* Card 5: Total Inspections */}
          <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-sm flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Evaluated</p>
              <span className="text-2xl font-black text-purple-700">{totalEvaluated}</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: QC Personnel */}
      <div className="space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-gray-100 shadow-2xs">
          {/* Title & Search Bar on Left */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-purple-600" />
                QC Personnel & Inspectors
              </h2>
              <span className="text-xs text-gray-500 font-medium">({filteredQcInspectors.length})</span>
            </div>

            {/* Search Bar */}
            <div className="relative w-48 sm:w-56">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search inspector..."
                value={inspectorSearch}
                onChange={(e) => setInspectorSearch(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
              />
              {inspectorSearch && (
                <button
                  type="button"
                  onClick={() => setInspectorSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Date Filter & Branch Dropdown on Right Side */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Date Filter (From / To) */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs">
                <span className="text-gray-500 font-medium">From:</span>
                <input
                  type="date"
                  max={getTodayISO()}
                  value={inspectorFromDate}
                  onChange={handleInspectorFromDateChange}
                  className="bg-transparent border-none text-xs text-gray-800 focus:outline-none cursor-pointer"
                />
                {inspectorFromDate && (
                  <button
                    type="button"
                    onClick={() => setInspectorFromDate("")}
                    className="text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs">
                <span className="text-gray-500 font-medium">To:</span>
                <input
                  type="date"
                  max={getTodayISO()}
                  value={inspectorToDate}
                  onChange={handleInspectorToDateChange}
                  className="bg-transparent border-none text-xs text-gray-800 focus:outline-none cursor-pointer"
                />
                {inspectorToDate && (
                  <button
                    type="button"
                    onClick={() => setInspectorToDate("")}
                    className="text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Select Branch Dropdown */}
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs">
              <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
              <select
                value={selectedQcBranch}
                onChange={(e) => setSelectedQcBranch(e.target.value)}
                className="bg-transparent border-none text-xs text-gray-800 font-medium focus:outline-none cursor-pointer"
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

            {/* Add Technician Button */}
            <button
              type="button"
              onClick={() => setIsAddOpen(true)}
              className="bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shadow-2xs text-xs shrink-0 whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-3" />
              <span>Add Technician</span>
            </button>
          </div>
        </div>

        {loadingInspectors ? (
          <div className="bg-white p-6 rounded-2xl border border-gray-100 text-center text-gray-400 text-sm">
            Loading assigned QC Personnel...
          </div>
        ) : filteredQcInspectors.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center space-y-1">
            <p className="text-sm font-semibold text-gray-700">No QC Inspectors found</p>
            <p className="text-xs text-gray-400">There are no personnel assigned to the selected branch.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredQcInspectors.map((inspector) => (
              <div
                key={inspector.id}
                className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs hover:shadow-sm transition-shadow flex items-start gap-3.5"
              >
                <div className="p-3 rounded-xl bg-purple-100 text-purple-700 font-bold shrink-0">
                  <HardHat className="w-5 h-5" />
                </div>
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-gray-900 text-sm truncate">{inspector.name}</h3>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md shrink-0">
                      {inspector.status}
                    </span>
                  </div>
                  <p className="text-xs text-purple-600 font-medium">{inspector.role}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-500 pt-1 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-gray-400" />
                      {inspector.phone}
                    </span>
                    <span className="flex items-center gap-1 truncate">
                      <Building2 className="w-3 h-3 text-gray-400" />
                      {inspector.branch}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 3, 4, 5: Interactive Queue Tabs & Filters */}
      <div className="space-y-4">
        {/* Controls Row */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          {/* Section Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "All", label: "All Jobs", count: jobs.length },
              { id: "Inspecting", label: "Inspecting", count: stats.inspecting },
              { id: "Passed Jobs", label: "QC Passed Jobs", count: passedCount },
              { id: "Failed / Rework", label: "QC Failed / Rework Required", count: failedCount },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${activeTab === tab.id
                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
              >
                {tab.label}
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${activeTab === tab.id ? "bg-white/20 text-white" : "bg-gray-200 text-gray-700"
                    }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Left/Right Search Bar */}
          <div className="relative w-full md:w-72 shrink-0">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search vehicle, customer, service..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* QC Cards Queue Table */}
        {isLoading ? (
          <div className="py-16 text-center text-gray-400 bg-white rounded-2xl border border-gray-100">
            Loading QC queue...
          </div>
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
      </div>

      {/* Action Dialogs */}
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

