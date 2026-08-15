"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  Building2,
  Edit2,
  Trash2,
  MapPin,
  User,
  Phone,
  Calendar,
  Percent, X
} from "lucide-react";
import AddFranchiseDialog from "@/components/franchise/AddFranchiseDialog";
import { getFranchises, createFranchise, updateFranchise, deleteFranchise } from "@/lib/api";
import { toast } from "react-hot-toast";

export default function FranchiseManagementPage() {
  const [franchises, setFranchises] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFranchise, setEditingFranchise] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchFranchises = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getFranchises();
      setFranchises(data || []);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to load franchises");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFranchises();
  }, [fetchFranchises]);

  const handleAdd = () => {
    setEditingFranchise(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (franchise: any) => {
    setEditingFranchise(franchise);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this franchise?")) return;
    try {
      await deleteFranchise(id);
      setFranchises(franchises.filter((f) => f.id !== id));
      toast.success("Franchise deleted successfully");
    } catch (err: any) {
      console.error("Failed to delete franchise:", err);
      toast.error("Failed to delete franchise: " + err.message);
    }
  };

  const handleSave = async (data: any) => {
    try {
      if (data.id) {
        await updateFranchise(data.id, data);
        toast.success("Franchise updated successfully");
      } else {
        await createFranchise(data);
        toast.success("Franchise submitted for approval. A license has been auto-generated and is pending Super Admin review. 🔑");
      }
      await fetchFranchises();
    } catch (err: any) {
      console.error("Failed to save franchise:", err);
      toast.error("Failed to save franchise: " + err.message);
    }
  };

  // Filtered franchises based on search query and status filter
  const filtered = franchises.filter((f) => {
    const matchSearch =
      (f.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (f.city || "").toLowerCase().includes(search.toLowerCase()) ||
      (f.owner || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || f.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalCount = franchises.length;
  const activeCount = franchises.filter((f) => f.status === "Active").length;
  const inactiveCount = franchises.filter((f) => f.status === "Inactive" || f.status === "Pending").length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-yellow-100">
            <Building2 className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Franchise Management</h1>
            <p className="text-sm text-gray-500">Create and manage franchises with individual configurations.</p>
          </div>
        </div>
        <button
          onClick={handleAdd}
          style={{ background: "linear-gradient(135deg, #facc15, #f59e0b)" }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-gray-900 font-semibold text-sm shadow-sm hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Add Franchise
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <button
          onClick={() => setStatusFilter("ALL")}
          className={`p-4 rounded-xl border text-left transition-all ${
            statusFilter === "ALL" ? "border-yellow-400 shadow-md bg-white" : "border-gray-100 bg-white hover:border-gray-200"
          }`}
        >
          <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
          <p className="text-[11px] font-semibold text-gray-500 mt-0.5 leading-tight">Total Franchises</p>
        </button>
        <button
          onClick={() => setStatusFilter("Active")}
          className={`p-4 rounded-xl border text-left transition-all ${
            statusFilter === "Active" ? "border-yellow-400 shadow-md bg-white" : "border-gray-100 bg-white hover:border-gray-200"
          }`}
        >
          <p className="text-2xl font-bold text-green-500">{activeCount}</p>
          <p className="text-[11px] font-semibold text-gray-500 mt-0.5 leading-tight">Active Franchises</p>
        </button>
        <button
          onClick={() => setStatusFilter("Inactive")}
          className={`p-4 rounded-xl border text-left transition-all ${
            statusFilter === "Inactive" ? "border-yellow-400 shadow-md bg-white" : "border-gray-100 bg-white hover:border-gray-200"
          }`}
        >
          <p className="text-2xl font-bold text-amber-500">{inactiveCount}</p>
          <p className="text-[11px] font-semibold text-gray-500 mt-0.5 leading-tight">Inactive/Pending Franchises</p>
        </button>
      </div>

      {/* Search + filter bar */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by franchise name, city or owner…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white"
        >
          <option value="ALL">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-400 text-sm">Loading franchises…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">No franchises found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Franchise</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">City</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Owner</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Since</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Royalty %</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((f) => (
                  <tr key={f.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-yellow-600">{f.id}</td>
                    <td className="px-6 py-4 font-bold text-gray-900">{f.name}</td>
                    <td className="px-6 py-4 text-gray-600">{f.city}</td>
                    <td className="px-6 py-4 text-gray-600 font-semibold">{f.owner}</td>
                    <td className="px-6 py-4 text-gray-600 font-mono text-xs">
                      <div>{f.email || "—"}</div>
                      <div className="text-gray-400">{f.phone ? f.phone.replace(/\s+/g, "") : ""}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">{f.startDate}</td>
                    <td className="px-6 py-4 text-gray-600 text-center font-bold">{f.royalty || 0}%</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          f.status === "Active" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {f.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(f)}
                          className="p-1.5 rounded-lg hover:bg-yellow-50 text-gray-400 hover:text-yellow-600 transition-colors"
                          title="Edit Franchise"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(f.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                          title="Delete Franchise"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Dialog */}
      <AddFranchiseDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        franchiseData={editingFranchise}
        onSave={handleSave}
      />
    </div>
  );
}
