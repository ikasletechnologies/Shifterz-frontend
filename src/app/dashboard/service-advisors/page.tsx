"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Headset, Search, Filter, ChevronLeft, ChevronRight, Pencil, Trash2, Plus,
  Users, UserCheck2, UserX2, Briefcase, Loader2, CheckCircle2, TrendingUp, X
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import EditEmployeeDialog from "@/components/employees/EditEmployeeDialog";
import AddEmployeeDialog from "@/components/employees/AddEmployeeDialog";
import { getServiceAdvisorManagementStats, getFranchises, createEmployee, updateEmployee, deleteEmployee, apiCall } from "@/lib/api";
import { toast } from "react-hot-toast";

interface AdvisorRow {
  id: string;
  name: string;
  phone: string;
  email?: string;
  username?: string;
  role?: string;
  permissions?: string[];
  status: string;
  branch: string;
  franchiseId: string | null;
  assignedJobs: number;
  inProgress: number;
  completed: number;
  productivity: number;
}

interface Summary {
  total: number;
  active: number;
  inactive: number;
  assignedJobs: number;
  inProgress: number;
  completedToday: number;
  avgProductivity: number;
}

const PAGE_SIZE = 8;

export default function ServiceAdvisorsPage() {
  const [rows, setRows] = useState<AdvisorRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [total, setTotal] = useState(0);
  const [franchises, setFranchises] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [branchFilter, setBranchFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  const [editing, setEditing] = useState<AdvisorRow | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const params: Record<string, string> = { page: String(currentPage), pageSize: String(PAGE_SIZE) };
      if (searchTerm) params.search = searchTerm;
      if (statusFilter !== "All") params.status = statusFilter;
      if (branchFilter !== "All") params.franchiseId = branchFilter;

      const [data, jobsData] = await Promise.all([
        getServiceAdvisorManagementStats(params),
        apiCall("/jobs").catch(() => []),
      ]);

      const jobsList = Array.isArray(jobsData) ? jobsData : [];
      const isCompletedStatus = (s: string) =>
        ["Completed", "QC Passed", "Ready For Billing", "Ready for Billing", "Work Completed", "Delivered", "Out", "Invoiced", "Paid"].includes(s);

      const computedList = (data.list || []).map((row: AdvisorRow) => {
        const empJobs = jobsList.filter((j: any) => {
          const saId = j.serviceAdvisorId || j.advisorId || j.createdById;
          const saName = (j.serviceAdvisor || j.advisor || j.createdBy || j.creator || "").trim().toLowerCase();
          const normName = (row.name || "").trim().toLowerCase();
          const normUsername = (row.username || "").trim().toLowerCase();

          const idMatch = Boolean(saId && saId === row.id);
          const nameMatch = Boolean(
            saName &&
            ((normName && (saName === normName || saName.includes(normName) || normName.includes(saName))) ||
             (normUsername && (saName === normUsername || saName.includes(normUsername))))
          );

          return idMatch || nameMatch;
        });

        const assignedJobs = Math.max(row.assignedJobs || 0, empJobs.length);
        const completed = Math.max(
          row.completed || 0,
          empJobs.filter((j: any) => isCompletedStatus(j.status)).length
        );

        return {
          ...row,
          assignedJobs,
          completed,
        };
      });

      setRows(computedList);
      setSummary(data.summary || null);
      setTotal(data.total || 0);
    } catch (err: any) {
      toast.error("Failed to load service advisors: " + err.message);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, statusFilter, branchFilter, currentPage]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    getFranchises().then(setFranchises).catch(() => setFranchises([]));
  }, []);

  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

  const handleAdd = async (employeeData: any) => {
    try {
      await createEmployee({
        ...employeeData,
        role: "SERVICE_ADVISOR",
        franchiseId: (employeeData.franchiseId && employeeData.franchiseId !== "HQ") ? employeeData.franchiseId : null
      });
      toast.success("Service advisor created successfully");
      setIsAddOpen(false);
      setSearchTerm("");
      setBranchFilter("All");
      setStatusFilter("All");
      setCurrentPage(1);

      // Direct fetch to guarantee immediate state refresh
      const data = await getServiceAdvisorManagementStats({ page: "1", pageSize: String(PAGE_SIZE) });
      setRows(data.list || []);
      setSummary(data.summary || null);
      setTotal(data.total || 0);
    } catch (err: any) {
      toast.error("Failed to create service advisor: " + err.message);
    }
  };

  const openEdit = (row: AdvisorRow) => {
    setEditing(row);
    setIsEditOpen(true);
  };

  const handleEdit = async (id: string, employee: any) => {
    try {
      await updateEmployee(id, employee);
      toast.success("Service advisor updated");
      setIsEditOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error("Failed to update service advisor: " + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this service advisor?")) return;
    try {
      await deleteEmployee(id);
      toast.success("Service advisor removed");
      fetchData();
    } catch (err: any) {
      toast.error("Failed to remove service advisor: " + err.message);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Total Advisors" value={summary.total} icon={Users} color="blue" />
          <StatCard title="Active Advisors" value={summary.active} icon={UserCheck2} color="green" />
          <StatCard title="Inactive Advisors" value={summary.inactive} icon={UserX2} color="gray" />
          <StatCard title="Assigned Jobs" value={summary.assignedJobs} icon={Briefcase} color="purple" />
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search Advisor, Emp ID, Phone..."
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
        <div className="relative">
          <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <select
            value={branchFilter}
            onChange={(e) => { setBranchFilter(e.target.value); setCurrentPage(1); }}
            className="pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/20 appearance-none"
          >
            <option value="All">All Branches</option>
            <option value="HQ">Headquarters</option>
            {franchises.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-xs text-xs shrink-0 whitespace-nowrap cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-3" />
          Add Advisor
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Service Advisor List</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[800px]">
            <thead className="bg-gray-50/50 border-b border-gray-100 text-xs text-gray-500 uppercase font-semibold tracking-wider">
              <tr>
                <th className="px-6 py-4">Emp ID</th>
                <th className="px-6 py-4">Advisor Name</th>
                <th className="px-6 py-4">Phone Number</th>
                <th className="px-6 py-4">Branch</th>
                <th className="px-6 py-4">Assigned Jobs</th>
                <th className="px-6 py-4">Completed</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={8} className="px-6 py-10 text-center text-gray-400">Loading...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-10 text-center text-gray-400">No service advisors found.</td></tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-yellow-600 whitespace-nowrap">{row.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">{row.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 font-medium">{row.phone || "—"}</td>
                    <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{typeof row.branch === "string" ? row.branch : (row.branch as any)?.name || "Headquarters"}</td>
                    <td className="px-6 py-4 text-gray-700">{row.assignedJobs}</td>
                    <td className="px-6 py-4 text-gray-700">{row.completed}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${row.status === "Active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => openEdit(row)} title="Edit" className="p-1.5 hover:bg-blue-50 text-blue-500 rounded-lg transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(row.id)} title="Remove" className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isAddOpen && (
        <AddEmployeeDialog
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          onAdd={handleAdd}
          franchises={franchises}
          defaultRole="SERVICE_ADVISOR"
        />
      )}

      {isEditOpen && editing && (
        <EditEmployeeDialog
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          onEdit={handleEdit}
          employee={{ ...editing, role: editing.role || "SERVICE_ADVISOR" }}
          franchises={franchises}
        />
      )}
    </div>
  );
}
