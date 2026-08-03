"use client";

import { useState, useEffect, useCallback } from "react";
import {
  HardHat, Search, Filter, ChevronLeft, ChevronRight, Pencil, Trash2,
  Users, UserCheck2, UserX2, Briefcase, Loader2, PackageX, CheckCircle2, RefreshCw, TrendingUp,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import EditEmployeeDialog from "@/components/employees/EditEmployeeDialog";
import { getTechnicianManagementStats, getFranchises, updateEmployee, deleteEmployee } from "@/lib/api";
import { toast } from "react-hot-toast";

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
  productivity: number;
}

interface Summary {
  total: number;
  active: number;
  inactive: number;
  assignedJobs: number;
  inProgress: number;
  waitingParts: number;
  completedToday: number;
  rework: number;
  avgProductivity: number;
}

const PAGE_SIZE = 8;

export default function TechniciansPage() {
  const [rows, setRows] = useState<TechnicianRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [total, setTotal] = useState(0);
  const [franchises, setFranchises] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [branchFilter, setBranchFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [editing, setEditing] = useState<TechnicianRow | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const params: Record<string, string> = { page: String(currentPage), pageSize: String(PAGE_SIZE) };
      if (searchTerm) params.search = searchTerm;
      if (statusFilter !== "All") params.status = statusFilter;
      if (branchFilter !== "All") params.franchiseId = branchFilter;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;

      const data = await getTechnicianManagementStats(params);
      setRows(data.list || []);
      setSummary(data.summary || null);
      setTotal(data.total || 0);
    } catch (err: any) {
      toast.error("Failed to load technicians: " + err.message);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, statusFilter, branchFilter, dateFrom, dateTo, currentPage]);

  useEffect(() => { fetchData(); }, [fetchData]);

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

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <HardHat className="w-6 h-6 text-yellow-500" />
          Technician Management
        </h1>
        <p className="text-gray-500 mt-1">Monitor technician workload, rework and productivity</p>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          <StatCard title="Total Technicians" value={summary.total} icon={Users} color="blue" />
          <StatCard title="Active Technicians" value={summary.active} icon={UserCheck2} color="green" />
          <StatCard title="Inactive Technicians" value={summary.inactive} icon={UserX2} color="gray" />
          <StatCard title="Assigned Jobs" value={summary.assignedJobs} icon={Briefcase} color="purple" />
          <StatCard title="In Progress" value={summary.inProgress} icon={Loader2} color="orange" />
          <StatCard title="Waiting for Parts" value={summary.waitingParts} icon={PackageX} color="yellow" />
          <StatCard title="Completed Today" value={summary.completedToday} icon={CheckCircle2} color="green" />
          <StatCard title="Rework Jobs" value={summary.rework} icon={RefreshCw} color="red" />
          <StatCard title="Avg Productivity" value={`${summary.avgProductivity}%`} icon={TrendingUp} color="blue" />
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search Technician, Emp ID, Phone..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 transition-all"
          />
        </div>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }}
          className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/20"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }}
          className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/20"
        />
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
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="pl-4 pr-8 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/20 appearance-none"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Technician List</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[960px]">
            <thead className="bg-gray-50/50 border-b border-gray-100 text-xs text-gray-500 uppercase font-semibold tracking-wider">
              <tr>
                <th className="px-6 py-4">Emp ID</th>
                <th className="px-6 py-4">Technician</th>
                <th className="px-6 py-4">Branch</th>
                <th className="px-6 py-4">Assigned Jobs</th>
                <th className="px-6 py-4">In Progress</th>
                <th className="px-6 py-4">Completed</th>
                <th className="px-6 py-4">Rework</th>
                <th className="px-6 py-4">Productivity</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={10} className="px-6 py-10 text-center text-gray-400">Loading...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={10} className="px-6 py-10 text-center text-gray-400">No technicians found.</td></tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-yellow-600 whitespace-nowrap">{row.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="font-semibold text-gray-900">{row.name}</p>
                      <p className="text-xs text-gray-500">{row.phone}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{row.branch}</td>
                    <td className="px-6 py-4 text-gray-700">{row.assignedJobs}</td>
                    <td className="px-6 py-4 text-gray-700">{row.inProgress}</td>
                    <td className="px-6 py-4 text-gray-700">{row.completed}</td>
                    <td className="px-6 py-4 text-gray-700">{row.rework}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 min-w-[110px]">
                        <span className="text-xs font-bold text-gray-700 w-9">{row.productivity}%</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${row.productivity >= 80 ? "bg-green-500" : row.productivity >= 50 ? "bg-yellow-500" : "bg-red-500"}`}
                            style={{ width: `${Math.min(100, row.productivity)}%` }}
                          />
                        </div>
                      </div>
                    </td>
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

        {total > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Showing <span className="font-medium text-gray-900">{(currentPage - 1) * PAGE_SIZE + 1}</span> to{" "}
              <span className="font-medium text-gray-900">{Math.min(currentPage * PAGE_SIZE, total)}</span> of{" "}
              <span className="font-medium text-gray-900">{total}</span> entries
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-xl text-sm font-bold transition-colors ${
                    currentPage === page ? "bg-yellow-500 text-white border border-yellow-600 shadow-sm" : "text-gray-600 hover:bg-gray-100 border border-transparent"
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {isEditOpen && editing && (
        <EditEmployeeDialog
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          onEdit={handleEdit}
          employee={{ ...editing, role: "TECHNICIAN" }}
          franchises={franchises}
        />
      )}
    </div>
  );
}
