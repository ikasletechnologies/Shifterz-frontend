"use client";

import { useState, useEffect, useCallback } from "react";
import {
  HardHat, Search, Filter, ChevronLeft, ChevronRight, Pencil, Trash2,
  Users, UserCheck2, UserX2, Briefcase, Loader2, PackageX, CheckCircle2, RefreshCw, TrendingUp, X,
  Download, ChevronDown, FileSpreadsheet, FileText, BarChart3, Wrench, Hourglass, ClipboardList,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import EditEmployeeDialog from "@/components/employees/EditEmployeeDialog";
import { getTechnicianManagementStats, getFranchises, updateEmployee, deleteEmployee } from "@/lib/api";
import { toast } from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { JobCardTable } from "@/modules/job-card/components/JobCardTable";
import { ViewJobCardDialog } from "@/modules/job-card/components/ViewJobCardDialog";
import { getJobCards } from "@/modules/job-card/services/job-card.service";
import { JobCard } from "@/modules/job-card/types/job-card.types";

interface JobInfo {
  id: string;
  vehicle: string;
  customer: string;
  service: string;
  status: string;
  priority: string;
}

interface TechnicianRow {
  id: string;
  name: string;
  phone: string;
  status: string;
  branch: string;
  franchiseId: string | null;
  assignedJobs: number;
  inProgress: number;
  waitingParts: number;
  completed: number;
  completedToday: number;
  rework: number;
  qcPending?: number;
  productivity: number;
  jobs?: JobInfo[];
}

interface Summary {
  total: number;
  active: number;
  inactive: number;
  assignedJobs: number;
  inProgress: number;
  waitingParts: number;
  completedToday: number;
  completed?: number;
  totalCompleted?: number;
  rework: number;
  qcPending: number;
  avgProductivity: number;
}

const PAGE_SIZE = 8;

export default function TechniciansPage() {
  const [rows, setRows] = useState<TechnicianRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [total, setTotal] = useState(0);
  const [franchises, setFranchises] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<"info" | "details">("info");
  const [selectedTechnician, setSelectedTechnician] = useState<TechnicianRow | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [branchFilter, setBranchFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [activeKPI, setActiveKPI] = useState("Total Technicians");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const getTodayISO = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleFromDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.value;
    const today = getTodayISO();
    if (selected && selected > today) {
      toast.error("Future dates are not allowed. Please select today or a past date.");
      setDateFrom(today);
      return;
    }
    setDateFrom(selected);
    setCurrentPage(1);
  };

  const handleToDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.value;
    const today = getTodayISO();
    if (selected && selected > today) {
      toast.error("Future dates are not allowed. Please select today or a past date.");
      setDateTo(today);
      return;
    }
    setDateTo(selected);
    setCurrentPage(1);
  };

  const [editing, setEditing] = useState<TechnicianRow | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);

  const [jobCardsList, setJobCardsList] = useState<JobCard[]>([]);
  const [viewingJob, setViewingJob] = useState<JobCard | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const params: Record<string, string> = { page: String(currentPage), pageSize: String(PAGE_SIZE) };
      if (searchTerm) params.search = searchTerm;
      if (statusFilter !== "All") params.status = statusFilter;
      if (branchFilter !== "All") params.franchiseId = branchFilter;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;

      const [data, jobsRes] = await Promise.all([
        getTechnicianManagementStats(params),
        getJobCards().catch(() => []),
      ]);
      setRows(data.list || []);
      setSummary(data.summary || null);
      setTotal(data.total || 0);
      setJobCardsList(jobsRes || []);
    } catch (err: any) {
      if (!err?.message?.toLowerCase().includes("unauthorized") && !err?.message?.toLowerCase().includes("token")) {
        toast.error("Failed to load technicians: " + err.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, statusFilter, branchFilter, dateFrom, dateTo, currentPage]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
    }, 10000);
    const onFocus = () => fetchData();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [fetchData]);

  useEffect(() => {
    getFranchises().then(setFranchises).catch(() => setFranchises([]));
  }, []);

  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

  const openEdit = (row: TechnicianRow) => {
    setEditing(row);
    setIsEditOpen(true);
  };

  const handleEdit = async (id: string, employee: any) => {
    try {
      await updateEmployee(id, employee);
      toast.success("Technician updated");
      setIsEditOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error("Failed to update technician: " + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this technician?")) return;
    try {
      await deleteEmployee(id);
      toast.success("Technician removed");
      fetchData();
    } catch (err: any) {
      toast.error("Failed to remove technician: " + err.message);
    }
  };

  const assignedJobCards = jobCardsList.filter((j) => {
    const s = j.status as string;
    const hasTech = Boolean(
      j.technician &&
        j.technician.trim() !== "" &&
        j.technician.toLowerCase() !== "unassigned" &&
        j.technician.toLowerCase() !== "none"
    );
    return s === "Assigned" || (hasTech && s !== "Pending" && s !== "Cancelled" && s !== "Canceled");
  });

  const filteredAssignedJobs = assignedJobCards.filter((j) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      j.id.toLowerCase().includes(q) ||
      j.vehicle.toLowerCase().includes(q) ||
      j.customer.toLowerCase().includes(q) ||
      (j.technician && j.technician.toLowerCase().includes(q)) ||
      (j.service && j.service.toLowerCase().includes(q))
    );
  });

  const isWaitingForPartsStatus = (status?: string) => {
    if (!status) return false;
    const norm = status.trim().toLowerCase();
    return (
      norm === "waiting for parts" ||
      norm === "waiting material" ||
      norm === "waiting parts" ||
      (norm.includes("waiting") && norm.includes("part"))
    );
  };

  const waitingForPartsJobCards = jobCardsList.filter((j) => isWaitingForPartsStatus(j.status));

  const filteredWaitingForPartsJobs = waitingForPartsJobCards.filter((j) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      j.id.toLowerCase().includes(q) ||
      j.vehicle.toLowerCase().includes(q) ||
      j.customer.toLowerCase().includes(q) ||
      (j.technician && j.technician.toLowerCase().includes(q)) ||
      (j.service && j.service.toLowerCase().includes(q))
    );
  });

  const isCompletedJobStatus = (status?: string) => {
    if (!status) return false;
    const norm = status.trim().toLowerCase();
    return (
      norm === "completed" ||
      norm === "work completed" ||
      norm === "qc pending" ||
      norm === "qc passed" ||
      norm === "ready for billing" ||
      norm === "delivered"
    );
  };

  const completedJobCards = jobCardsList.filter((j) => isCompletedJobStatus(j.status));

  const filteredCompletedJobs = completedJobCards.filter((j) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      j.id.toLowerCase().includes(q) ||
      j.vehicle.toLowerCase().includes(q) ||
      j.customer.toLowerCase().includes(q) ||
      (j.technician && j.technician.toLowerCase().includes(q)) ||
      (j.service && j.service.toLowerCase().includes(q))
    );
  });

  const isReworkJobStatus = (status?: string) => {
    if (!status) return false;
    const norm = status.trim().toLowerCase();
    return norm === "rework" || norm === "qc failed";
  };

  const reworkJobCards = jobCardsList.filter((j) => isReworkJobStatus(j.status));

  const filteredReworkJobs = reworkJobCards.filter((j) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      j.id.toLowerCase().includes(q) ||
      j.vehicle.toLowerCase().includes(q) ||
      j.customer.toLowerCase().includes(q) ||
      (j.technician && j.technician.toLowerCase().includes(q)) ||
      (j.service && j.service.toLowerCase().includes(q))
    );
  });

  const displayedRows = rows.filter((row) => {
    if (activeKPI === "Active Technicians") return row.status === "Active";
    if (activeKPI === "Inactive Technicians") return row.status !== "Active";
    if (activeKPI === "Assigned Jobs") return row.assignedJobs > 0;
    if (activeKPI === "In Progress") return row.inProgress > 0;
    if (activeKPI === "Waiting for Parts") return row.waitingParts > 0;
    if (activeKPI === "Completed Today" || activeKPI === "Completed Jobs") return row.completedToday > 0 || row.completed > 0;
    if (activeKPI === "Rework Jobs") return row.rework > 0;
    if (activeKPI === "QC Pending Jobs") return (row.qcPending || 0) > 0;
    return true;
  });

  const effectiveSummary = {
    total: summary?.total ?? total,
    active: summary?.active ?? rows.filter((r) => r.status === "Active").length,
    inactive: summary?.inactive ?? rows.filter((r) => r.status !== "Active").length,
    assignedJobs: summary?.assignedJobs ?? assignedJobCards.length,
    inProgress: summary?.inProgress ?? rows.reduce((s, r) => s + (r.inProgress || 0), 0),
    waitingParts: (summary?.waitingParts && summary.waitingParts > 0) ? summary.waitingParts : waitingForPartsJobCards.length,
    completedToday: (summary?.completedToday && summary.completedToday > 0) ? summary.completedToday : completedJobCards.length,
    completed: (summary?.totalCompleted && summary.totalCompleted > 0) ? summary.totalCompleted : completedJobCards.length,
    rework: reworkJobCards.length > 0 ? reworkJobCards.length : (summary?.rework ?? 0),
    qcPending: summary?.qcPending ?? 0,
    avgProductivity: summary?.avgProductivity ?? 0,
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard
          title="Total Technicians"
          value={effectiveSummary.total}
          icon={Users}
          color="blue"
          onClick={() => {
            setActiveKPI("Total Technicians");
            setStatusFilter("All");
            setCurrentPage(1);
          }}
          active={activeKPI === "Total Technicians"}
        />
        <StatCard
          title="Active Technicians"
          value={effectiveSummary.active}
          icon={UserCheck2}
          color="green"
          onClick={() => {
            setActiveKPI("Active Technicians");
            setStatusFilter("Active");
            setCurrentPage(1);
          }}
          active={activeKPI === "Active Technicians"}
        />
        <StatCard
          title="Inactive Technicians"
          value={effectiveSummary.inactive}
          icon={UserX2}
          color="gray"
          onClick={() => {
            setActiveKPI("Inactive Technicians");
            setStatusFilter("Inactive");
            setCurrentPage(1);
          }}
          active={activeKPI === "Inactive Technicians"}
        />
        <StatCard
          title="Assigned Jobs"
          value={effectiveSummary.assignedJobs}
          icon={Briefcase}
          color="purple"
          onClick={() => {
            setActiveKPI("Assigned Jobs");
            setCurrentPage(1);
          }}
          active={activeKPI === "Assigned Jobs"}
        />
        <StatCard
          title="In Progress"
          value={effectiveSummary.inProgress}
          icon={Loader2}
          color="orange"
          onClick={() => {
            setActiveKPI("In Progress");
            setCurrentPage(1);
          }}
          active={activeKPI === "In Progress"}
        />
        <StatCard
          title="Waiting for Parts"
          value={effectiveSummary.waitingParts}
          icon={PackageX}
          color="yellow"
          onClick={() => {
            setActiveKPI("Waiting for Parts");
            setCurrentPage(1);
          }}
          active={activeKPI === "Waiting for Parts"}
        />
        <StatCard
          title="Completed Jobs"
          value={effectiveSummary.completed}
          icon={CheckCircle2}
          color="green"
          onClick={() => {
            setActiveKPI("Completed Jobs");
            setCurrentPage(1);
          }}
          active={activeKPI === "Completed Jobs" || activeKPI === "Completed Today"}
        />
        <StatCard
          title="Rework Jobs"
          value={effectiveSummary.rework}
          icon={RefreshCw}
          color="red"
          onClick={() => {
            setActiveKPI("Rework Jobs");
            setCurrentPage(1);
          }}
          active={activeKPI === "Rework Jobs"}
        />
        <StatCard
          title="QC Pending Jobs"
          value={effectiveSummary.qcPending}
          icon={Search}
          color="blue"
          onClick={() => {
            setActiveKPI("QC Pending Jobs");
            setCurrentPage(1);
          }}
          active={activeKPI === "QC Pending Jobs"}
        />
        <StatCard
          title="Avg Productivity"
          value={`${effectiveSummary.avgProductivity}%`}
          icon={TrendingUp}
          color="blue"
          onClick={() => {
            setActiveKPI("Avg Productivity");
            setCurrentPage(1);
          }}
          active={activeKPI === "Avg Productivity"}
        />
      </div>

      {activeTab === "info" ? (
        <>
          <div className="flex flex-nowrap items-center gap-2.5 w-full">
            <div className="relative min-w-[180px] max-w-sm flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search Technician, Emp ID, Phone..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => { setSearchTerm(""); setCurrentPage(1); }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {/* From Date Filter */}
            <div className="flex items-center gap-1.5 bg-white border border-gray-300 rounded-lg px-2.5 py-2 shrink-0">
              <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">From:</span>
              <input
                type="date"
                value={dateFrom}
                max={getTodayISO()}
                onChange={handleFromDateChange}
                className="bg-transparent border-none text-xs text-gray-800 focus:outline-none cursor-pointer p-0"
              />
              <button
                type="button"
                disabled={!dateFrom}
                onClick={() => { setDateFrom(""); setCurrentPage(1); }}
                className={`p-0.5 rounded transition-colors flex items-center justify-center shrink-0 ${
                  dateFrom
                    ? "text-gray-600 hover:text-gray-900 hover:bg-gray-100 cursor-pointer"
                    : "text-gray-300 cursor-not-allowed opacity-50"
                }`}
                title={dateFrom ? "Clear From Date" : ""}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* To Date Filter */}
            <div className="flex items-center gap-1.5 bg-white border border-gray-300 rounded-lg px-2.5 py-2 shrink-0">
              <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">To:</span>
              <input
                type="date"
                value={dateTo}
                max={getTodayISO()}
                onChange={handleToDateChange}
                className="bg-transparent border-none text-xs text-gray-800 focus:outline-none cursor-pointer p-0"
              />
              <button
                type="button"
                disabled={!dateTo}
                onClick={() => { setDateTo(""); setCurrentPage(1); }}
                className={`p-0.5 rounded transition-colors flex items-center justify-center shrink-0 ${
                  dateTo
                    ? "text-gray-600 hover:text-gray-900 hover:bg-gray-100 cursor-pointer"
                    : "text-gray-300 cursor-not-allowed opacity-50"
                }`}
                title={dateTo ? "Clear To Date" : ""}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="relative">
              <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <select
                value={branchFilter}
                onChange={(e) => { setBranchFilter(e.target.value); setCurrentPage(1); }}
                className="pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/20 appearance-none cursor-pointer"
              >
                <option value="All">All Branches</option>
                <option value="HQ">Headquarters</option>
                {franchises.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => {
                  const val = e.target.value;
                  setStatusFilter(val);
                  setCurrentPage(1);
                  if (val === "All") setActiveKPI("Total Technicians");
                  else if (val === "Active") setActiveKPI("Active Technicians");
                  else if (val === "Inactive") setActiveKPI("Inactive Technicians");
                }}
                className="pl-4 pr-8 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/20 appearance-none"
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            {/* Download Dropdown Button */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsDownloadOpen((prev) => !prev)}
                className="bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold px-3.5 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors text-sm whitespace-nowrap cursor-pointer shadow-2xs"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-80" />
              </button>

              {isDownloadOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsDownloadOpen(false)} />
                  <div className="absolute right-0 mt-1.5 w-44 bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          const ws = XLSX.utils.json_to_sheet(
                            displayedRows.map((r) => ({
                              "Emp ID": r.id,
                              Technician: r.name,
                              Phone: r.phone,
                              Branch: r.branch,
                              "Assigned Jobs": r.assignedJobs,
                              "In Progress": r.inProgress,
                              Completed: r.completed,
                              Rework: r.rework,
                              Productivity: `${r.productivity}%`,
                              Status: r.status,
                            }))
                          );
                          const wb = XLSX.utils.book_new();
                          XLSX.utils.book_append_sheet(wb, ws, "Technicians");
                          XLSX.writeFile(wb, "technicians.xlsx");
                          toast.success("Downloaded as CSV");
                        } catch {
                          toast.error("Failed to download CSV");
                        }
                        setIsDownloadOpen(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      Download as CSV
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          const doc = new jsPDF();
                          doc.setFontSize(14);
                          doc.text("Technician Report", 14, 18);
                          autoTable(doc, {
                            startY: 26,
                            head: [["Emp ID", "Technician", "Branch", "Assigned", "In Progress", "Completed", "Rework", "Productivity", "Status"]],
                            body: displayedRows.map((r) => [
                              r.id, r.name, r.branch,
                              r.assignedJobs, r.inProgress, r.completed, r.rework,
                              `${r.productivity}%`, r.status,
                            ]),
                            styles: { fontSize: 8 },
                            headStyles: { fillColor: [37, 99, 235] },
                          });
                          doc.save("technicians.pdf");
                          toast.success("Downloaded as PDF");
                        } catch {
                          toast.error("Failed to download PDF");
                        }
                        setIsDownloadOpen(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <FileText className="w-4 h-4 text-red-500" />
                      Download as PDF
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Main Content View (JobCardTable for Assigned Jobs, Technician Cards Grid for other KPIs) */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="mb-6 border-b border-gray-100 pb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {activeKPI === "Total Technicians" ? "Technician Information" : activeKPI}
              </h2>
              {activeKPI === "Assigned Jobs" && (
                <span className="text-xs font-bold bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-100">
                  {filteredAssignedJobs.length} Assigned Jobs
                </span>
              )}
              {activeKPI === "Waiting for Parts" && (
                <span className="text-xs font-bold bg-amber-50 text-amber-700 px-3 py-1 rounded-full border border-amber-100">
                  {filteredWaitingForPartsJobs.length} Waiting for Parts Jobs
                </span>
              )}
              {(activeKPI === "Completed Today" || activeKPI === "Completed Jobs") && (
                <span className="text-xs font-bold bg-green-50 text-green-700 px-3 py-1 rounded-full border border-green-100">
                  {filteredCompletedJobs.length} Completed Jobs
                </span>
              )}
              {activeKPI === "Rework Jobs" && (
                <span className="text-xs font-bold bg-red-50 text-red-700 px-3 py-1 rounded-full border border-red-100">
                  {filteredReworkJobs.length} Rework Jobs
                </span>
              )}
            </div>

            {isLoading ? (
              <div className="py-12 text-center text-gray-400">Loading details...</div>
            ) : activeKPI === "Assigned Jobs" ? (
              filteredAssignedJobs.length === 0 ? (
                <div className="py-12 text-center text-gray-400 font-medium">No assigned job cards found.</div>
              ) : (
                <JobCardTable
                  jobCards={filteredAssignedJobs}
                  onView={(job) => {
                    setViewingJob(job);
                    setIsViewDialogOpen(true);
                  }}
                  onEdit={() => {}}
                  onDelete={() => {}}
                />
              )
            ) : activeKPI === "Waiting for Parts" ? (
              filteredWaitingForPartsJobs.length === 0 ? (
                <div className="py-12 text-center text-gray-400 font-medium">No job cards currently waiting for parts.</div>
              ) : (
                <JobCardTable
                  jobCards={filteredWaitingForPartsJobs}
                  onView={(job) => {
                    setViewingJob(job);
                    setIsViewDialogOpen(true);
                  }}
                  onEdit={() => {}}
                  onDelete={() => {}}
                />
              )
            ) : (activeKPI === "Completed Today" || activeKPI === "Completed Jobs") ? (
              filteredCompletedJobs.length === 0 ? (
                <div className="py-12 text-center text-gray-400 font-medium">No completed job cards found.</div>
              ) : (
                <JobCardTable
                  jobCards={filteredCompletedJobs}
                  onView={(job) => {
                    setViewingJob(job);
                    setIsViewDialogOpen(true);
                  }}
                  onEdit={() => {}}
                  onDelete={() => {}}
                />
              )
            ) : activeKPI === "Rework Jobs" ? (
              filteredReworkJobs.length === 0 ? (
                <div className="py-12 text-center text-gray-400 font-medium">No job cards currently in rework status.</div>
              ) : (
                <JobCardTable
                  jobCards={filteredReworkJobs}
                  onView={(job) => {
                    setViewingJob(job);
                    setIsViewDialogOpen(true);
                  }}
                  onEdit={() => {}}
                  onDelete={() => {}}
                />
              )
            ) : displayedRows.length === 0 ? (
              <div className="py-12 text-center text-gray-400">No technicians found.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedRows.map((row) => (
                  <div
                    key={row.id}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-6 relative group"
                  >
                    {/* Header Title with Avatar Icon */}
                    <div className="flex items-center gap-3.5 mb-6">
                      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                        <UserCheck2 className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-lg text-slate-800 tracking-tight">Technician Information</h3>
                      <div className="ml-auto flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => openEdit(row)}
                          title="Edit Technician"
                          className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors cursor-pointer"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(row.id)}
                          title="Remove Technician"
                          className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </div>

                    {/* Details List */}
                    <div className="space-y-4 text-sm text-slate-700">
                      {/* Name */}
                      <div className="flex items-center py-2.5 border-b border-gray-100">
                        <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shrink-0 mr-3">
                          <Users className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-slate-600 min-w-[110px]">Name</span>
                        <span className="text-slate-400 mr-4 font-normal">:</span>
                        <span className="font-semibold text-slate-900 truncate">{row.name}</span>
                      </div>

                      {/* Employee ID */}
                      <div className="flex items-center py-2.5 border-b border-gray-100">
                        <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shrink-0 mr-3">
                          <HardHat className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-slate-600 min-w-[110px]">Employee ID</span>
                        <span className="text-slate-400 mr-4 font-normal">:</span>
                        <span className="font-semibold text-slate-900 uppercase">{row.id}</span>
                      </div>

                      {/* Phone Number */}
                      <div className="flex items-center py-2.5 border-b border-gray-100">
                        <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shrink-0 mr-3">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        </div>
                        <span className="font-medium text-slate-600 min-w-[110px]">Phone Number</span>
                        <span className="text-slate-400 mr-4 font-normal">:</span>
                        <span className="font-semibold text-slate-900">{row.phone || "N/A"}</span>
                      </div>

                      {/* Email */}
                      <div className="flex items-center py-2.5 border-b border-gray-100">
                        <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shrink-0 mr-3">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 002-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <span className="font-medium text-slate-600 min-w-[110px]">Email</span>
                        <span className="text-slate-400 mr-4 font-normal">:</span>
                        <span className="font-medium text-slate-700 truncate">{row.id.toLowerCase()}@shifterz.com</span>
                      </div>

                      {/* Branch */}
                      <div className="flex items-center py-2.5 border-b border-gray-100">
                        <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shrink-0 mr-3">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h5m-5 0V9m0 4h.01M9 9h.01M9 13h.01M15 9h.01M15 13h.01" />
                          </svg>
                        </div>
                        <span className="font-medium text-slate-600 min-w-[110px]">Branch</span>
                        <span className="text-slate-400 mr-4 font-normal">:</span>
                        <span className="font-semibold text-slate-900 truncate">{row.branch}</span>
                      </div>

                      {/* Status */}
                      <div className="flex items-center py-2.5 border-b border-gray-100">
                        <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0 mr-3">
                          <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        </div>
                        <span className="font-medium text-slate-600 min-w-[110px]">Status</span>
                        <span className="text-slate-400 mr-4 font-normal">:</span>
                        <div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${row.status === "Active" ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-red-50 text-red-600 border border-red-200"}`}>
                            {row.status}
                          </span>
                        </div>
                      </div>

                      {/* Associated Vehicles / Job Cards details for Assigned Jobs & active KPIs */}
                      {row.jobs && row.jobs.length > 0 && (
                        <div className="py-2.5 border-b border-gray-100 space-y-2">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                            <span>
                              {activeKPI === "Assigned Jobs"
                                ? "Assigned Vehicles & Job Cards"
                                : activeKPI === "Waiting for Parts"
                                ? "Vehicles Waiting for Parts"
                                : activeKPI === "Total Technicians" || activeKPI === "Active Technicians" || activeKPI === "Inactive Technicians"
                                ? "Assigned Job Cards"
                                : `${activeKPI} Job Cards`}
                            </span>
                            <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                              {
                                row.jobs.filter((j) => {
                                  if (activeKPI === "Assigned Jobs") return j.status !== "Cancelled" && j.status !== "Canceled";
                                  if (activeKPI === "Waiting for Parts") return j.status === "Waiting for Parts" || j.status === "Waiting Material" || j.status === "Waiting Parts";
                                  if (activeKPI === "In Progress") return j.status === "In Progress" || j.status === "Assigned";
                                  if (activeKPI === "QC Pending Jobs") return j.status === "QC Pending" || j.status === "Waiting QC" || j.status === "Review for QC";
                                  if (activeKPI === "Rework Jobs") return j.status === "Rework" || j.status === "QC Failed";
                                  if (activeKPI === "Completed Today") return j.status === "Completed" || j.status === "Ready For Billing";
                                  return true;
                                }).length
                              }
                            </span>
                          </div>
                          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                            {row.jobs
                              .filter((j) => {
                                if (activeKPI === "Assigned Jobs") return j.status !== "Cancelled" && j.status !== "Canceled";
                                if (activeKPI === "Waiting for Parts") return j.status === "Waiting for Parts" || j.status === "Waiting Material" || j.status === "Waiting Parts";
                                if (activeKPI === "In Progress") return j.status === "In Progress" || j.status === "Assigned";
                                if (activeKPI === "QC Pending Jobs") return j.status === "QC Pending" || j.status === "Waiting QC" || j.status === "Review for QC";
                                if (activeKPI === "Rework Jobs") return j.status === "Rework" || j.status === "QC Failed";
                                if (activeKPI === "Completed Today") return j.status === "Completed" || j.status === "Ready For Billing";
                                return true;
                              })
                              .map((job) => (
                                <div key={job.id} className="flex items-center justify-between bg-slate-50 rounded-xl p-2 text-xs border border-slate-100 hover:bg-slate-100/80 transition-colors">
                                  <div className="truncate mr-2">
                                    <p className="font-bold text-slate-900 truncate">{job.vehicle || job.id}</p>
                                    <p className="text-[11px] text-slate-500 truncate">{job.id} • {job.service}{job.customer ? ` • ${job.customer}` : ""}</p>
                                  </div>
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                                    job.status.includes("Waiting") ? "bg-amber-100 text-amber-700" :
                                    job.status === "Completed" || job.status === "Ready For Billing" ? "bg-emerald-100 text-emerald-700" :
                                    "bg-blue-100 text-blue-700"
                                  }`}>
                                    {job.status}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Details Button directly below Active Status */}
                      <div className="pt-3">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTechnician(row);
                            setActiveTab("details");
                          }}
                          className="w-full py-2.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200"
                        >
                          <FileText className="w-4 h-4" />
                          <span>Details</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        /* Details Page/Layout showing ONLY selected technician's details */
        (() => {
          const selectedTech = selectedTechnician || rows[0];
          if (!selectedTech) {
            return (
              <div className="bg-white rounded-2xl p-8 text-center text-slate-500">
                No technician record selected.
              </div>
            );
          }
          return (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 max-w-4xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3.5">
                  <button
                    type="button"
                    onClick={() => { setActiveTab("info"); setSelectedTechnician(null); }}
                    className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    title="Back to Technician List"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                      {selectedTech.name}
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        selectedTech.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-700"
                      }`}>
                        {selectedTech.status}
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500 font-mono">Employee ID: {selectedTech.id} • Branch: {selectedTech.branch || "Headquarters"}</p>
                  </div>
                </div>
              </div>

              {/* Technician Info Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
                <div>
                  <p className="text-slate-400 font-semibold mb-0.5">Phone Number</p>
                  <p className="font-bold text-slate-800">{selectedTech.phone || "N/A"}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-semibold mb-0.5">Branch</p>
                  <p className="font-bold text-slate-800">{selectedTech.branch || "Headquarters"}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-semibold mb-0.5">Productivity</p>
                  <p className="font-bold text-emerald-600">{selectedTech.productivity || 85}%</p>
                </div>
              </div>

              {/* Individual Metrics Grid (Only for this selected technician) */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-3">Record Details & Metrics</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Assigned Jobs */}
                  <div className="bg-white rounded-xl border border-slate-100 p-4 flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                        <ClipboardList className="w-5 h-5" />
                      </div>
                      <span className="font-semibold text-slate-700 text-xs">Assigned Jobs</span>
                    </div>
                    <span className="text-2xl font-extrabold text-blue-600">{selectedTech.assignedJobs ?? 0}</span>
                  </div>

                  {/* In Progress */}
                  <div className="bg-white rounded-xl border border-slate-100 p-4 flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                        <Wrench className="w-5 h-5" />
                      </div>
                      <span className="font-semibold text-slate-700 text-xs">In Progress</span>
                    </div>
                    <span className="text-2xl font-extrabold text-emerald-600">{selectedTech.inProgress ?? 0}</span>
                  </div>

                  {/* Completed Today */}
                  <div className="bg-white rounded-xl border border-slate-100 p-4 flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <span className="font-semibold text-slate-700 text-xs">Completed Today</span>
                    </div>
                    <span className="text-2xl font-extrabold text-emerald-500">{selectedTech.completedToday ?? 0}</span>
                  </div>

                  {/* Waiting for Parts */}
                  <div className="bg-white rounded-xl border border-slate-100 p-4 flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
                        <Hourglass className="w-5 h-5" />
                      </div>
                      <span className="font-semibold text-slate-700 text-xs">Waiting for Parts</span>
                    </div>
                    <span className="text-2xl font-extrabold text-amber-500">{selectedTech.waitingParts ?? 0}</span>
                  </div>

                  {/* Rework Jobs */}
                  <div className="bg-white rounded-xl border border-slate-100 p-4 flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
                        <RefreshCw className="w-5 h-5" />
                      </div>
                      <span className="font-semibold text-slate-700 text-xs">Rework Jobs</span>
                    </div>
                    <span className="text-2xl font-extrabold text-rose-500">{selectedTech.rework ?? 0}</span>
                  </div>

                  {/* QC Pending Jobs */}
                  <div className="bg-white rounded-xl border border-slate-100 p-4 flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 shrink-0">
                        <Search className="w-5 h-5" />
                      </div>
                      <span className="font-semibold text-slate-700 text-xs">QC Pending Jobs</span>
                    </div>
                    <span className="text-2xl font-extrabold text-indigo-600">{selectedTech.qcPending ?? 0}</span>
                  </div>
                </div>
              </div>

              {/* Specific Jobs Assigned To This Selected Technician */}
              {selectedTech.jobs && selectedTech.jobs.length > 0 && (
                <div className="pt-2">
                  <h3 className="text-sm font-bold text-slate-900 mb-3">Assigned Job Cards for {selectedTech.name}</h3>
                  <div className="space-y-2">
                    {selectedTech.jobs.map((job) => (
                      <div key={job.id} className="flex items-center justify-between bg-slate-50 rounded-xl p-3 text-xs border border-slate-200/80">
                        <div>
                          <p className="font-bold text-slate-900">{job.vehicle || job.id}</p>
                          <p className="text-slate-500">{job.id} • {job.service} {job.customer ? `• ${job.customer}` : ""}</p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          job.status.includes("Waiting") ? "bg-amber-100 text-amber-700" :
                          job.status === "Completed" || job.status === "Ready For Billing" ? "bg-emerald-100 text-emerald-700" :
                          "bg-blue-100 text-blue-700"
                        }`}>
                          {job.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()
      )}

      {isEditOpen && editing && (
        <EditEmployeeDialog
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          onEdit={handleEdit}
          employee={{ ...editing, role: "TECHNICIAN" }}
          franchises={franchises}
        />
      )}

      {isViewDialogOpen && viewingJob && (
        <ViewJobCardDialog
          isOpen={isViewDialogOpen}
          job={viewingJob}
          onClose={() => {
            setIsViewDialogOpen(false);
            setViewingJob(null);
          }}
        />
      )}
    </div>
  );
}
