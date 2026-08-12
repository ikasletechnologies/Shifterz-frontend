"use client";

import { useState, useEffect, useCallback } from "react";
import {
  PackageSearch, Search, Filter, ChevronLeft, ChevronRight, Pencil, Trash2, Plus,
  Users, UserCheck2, UserX2, Briefcase, Loader2, CheckCircle2, TrendingUp, X,
  AlertTriangle, Clock
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import EditEmployeeDialog from "@/components/employees/EditEmployeeDialog";
import AddEmployeeDialog from "@/components/employees/AddEmployeeDialog";
import {
  getInventoryExecutiveManagementStats, getFranchises, createEmployee, updateEmployee,
  deleteEmployee, getInventory, getInventoryRequests
} from "@/lib/api";
import { toast } from "react-hot-toast";

interface InventoryStaffRow {
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

export default function InventoryStaffPage() {
  const [rows, setRows] = useState<InventoryStaffRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [total, setTotal] = useState(0);
  const [franchises, setFranchises] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [branchFilter, setBranchFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  const [lowStockCount, setLowStockCount] = useState(0);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  const [editing, setEditing] = useState<InventoryStaffRow | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const params: Record<string, string> = { page: String(currentPage), pageSize: String(PAGE_SIZE) };
      if (searchTerm) params.search = searchTerm;
      if (statusFilter !== "All") params.status = statusFilter;
      if (branchFilter !== "All") params.franchiseId = branchFilter;

      const [data, invItems, invRequests] = await Promise.all([
        getInventoryExecutiveManagementStats(params),
        getInventory().catch(() => []),
        getInventoryRequests().catch(() => []),
      ]);

      setRows(data.list || []);
      setSummary(data.summary || null);
      setTotal(data.total || 0);

      // Filter Low Stock Items for Selected Branch
      const itemsList = Array.isArray(invItems) ? invItems : [];
      const filteredItems = itemsList.filter((item: any) => {
        if (branchFilter === "All") return true;
        if (branchFilter === "HQ") return !item.franchiseId || (item.branch || "").toLowerCase().includes("hq");
        return item.franchiseId === branchFilter;
      });

      const lowStockItems = filteredItems.filter((item: any) => {
        const stock = Number(item.stock ?? item.quantity ?? 0);
        const minVal = Number(item.minStock ?? item.minThreshold ?? item.reorderPoint ?? 5);
        const isLow = stock <= minVal || (item.status || "").toLowerCase().includes("low");
        return isLow;
      });
      setLowStockCount(lowStockItems.length);

      // Filter Pending Inventory Requests for Selected Branch
      const requestsList = Array.isArray(invRequests) ? invRequests : [];
      const filteredRequests = requestsList.filter((req: any) => {
        if (branchFilter === "All") return true;
        if (branchFilter === "HQ") return !req.franchiseId || (req.branch || "").toLowerCase().includes("hq");
        return req.franchiseId === branchFilter;
      });

      const pendingReqs = filteredRequests.filter((req: any) => {
        const st = (req.status || "").toLowerCase();
        return st === "pending" || st === "submitted" || st === "requested" || st === "awaiting approval";
      });
      setPendingRequestsCount(pendingReqs.length);

    } catch (err: any) {
      toast.error("Failed to load inventory staff: " + err.message);
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
        role: "INVENTORY_EXECUTIVE",
        franchiseId: (employeeData.franchiseId && employeeData.franchiseId !== "HQ") ? employeeData.franchiseId : null
      });
      toast.success("Inventory executive created successfully");
      setIsAddOpen(false);
      setSearchTerm("");
      setBranchFilter("All");
      setStatusFilter("All");
      setCurrentPage(1);

      const data = await getInventoryExecutiveManagementStats({ page: "1", pageSize: String(PAGE_SIZE) });
      setRows(data.list || []);
      setSummary(data.summary || null);
      setTotal(data.total || 0);
    } catch (err: any) {
      toast.error("Failed to create inventory executive: " + err.message);
    }
  };

  const openEdit = (row: InventoryStaffRow) => {
    setEditing(row);
    setIsEditOpen(true);
  };

  const handleEdit = async (id: string, employee: any) => {
    try {
      await updateEmployee(id, employee);
      toast.success("Inventory executive updated");
      setIsEditOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error("Failed to update inventory executive: " + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this inventory executive?")) return;
    try {
      await deleteEmployee(id);
      toast.success("Inventory executive removed");
      fetchData();
    } catch (err: any) {
      toast.error("Failed to remove inventory executive: " + err.message);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard title="Total Inventory Staff" value={summary.total} icon={Users} color="blue" />
          <StatCard title="Active" value={summary.active} icon={UserCheck2} color="green" />
          <StatCard title="Inactive" value={summary.inactive} icon={UserX2} color="gray" />
          <StatCard title="Low Stock Count" value={lowStockCount} icon={AlertTriangle} color="purple" />
          <StatCard title="Pending Requests Count" value={pendingRequestsCount} icon={Clock} color="purple" />
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search Name, Emp ID, Phone..."
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
          Add Inventory Executive
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Inventory Staff List</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[800px]">
            <thead className="bg-gray-50/50 border-b border-gray-100 text-xs text-gray-500 uppercase font-semibold tracking-wider">
              <tr>
                <th className="px-6 py-4">Emp ID</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Phone Number</th>
                <th className="px-6 py-4">Branch</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-400">Loading...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-400">No inventory staff found.</td></tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-yellow-600 whitespace-nowrap">{row.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">{row.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 font-medium">{row.phone || "—"}</td>
                    <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{typeof row.branch === "string" ? row.branch : (row.branch as any)?.name || "Headquarters"}</td>
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
          defaultRole="INVENTORY_EXECUTIVE"
        />
      )}

      {isEditOpen && editing && (
        <EditEmployeeDialog
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          onEdit={handleEdit}
          employee={{ ...editing, role: editing.role || "INVENTORY_EXECUTIVE" }}
          franchises={franchises}
        />
      )}
    </div>
  );
}
