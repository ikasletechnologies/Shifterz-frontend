"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Building2, Search, Filter,
  ChevronLeft,
  ChevronRight, Edit2, X
} from "lucide-react";
import { getFranchises, updateFranchise } from "@/lib/api";
import { toast } from "react-hot-toast";
import AddFranchiseDialog from "@/components/franchise/AddFranchiseDialog";

export default function AllFranchisesPage() {
  const router = useRouter();
  const [franchises, setFranchises] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search, Filter, Pagination state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; // Display 6 cards per page

  // Edit Dialog state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingFranchise, setEditingFranchise] = useState<any>(null);

  const fetchFranchises = async () => {
    try {
      setIsLoading(true);
      const data = await getFranchises();
      if (Array.isArray(data)) {
        setFranchises(data);
      } else if (data && Array.isArray(data.franchises)) {
        setFranchises(data.franchises);
      } else if (data && Array.isArray(data.data)) {
        setFranchises(data.data);
      } else {
        setFranchises([]);
      }
    } catch (err: any) {
      toast.error("Failed to load franchises: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFranchises();
  }, []);

  // Filter and Search logic
  const filteredFranchises = useMemo(() => {
    return franchises.filter(f => {
      const safeName = f.name || "";
      const safeId = f.id || "";
      const safeOwner = f.owner || f.ownerName || "";
      const safeCustomer = f.customerName || f.customer || f.owner || "";
      const query = searchTerm.toLowerCase();

      const matchesSearch =
        safeName.toLowerCase().includes(query) ||
        safeId.toLowerCase().includes(query) ||
        safeOwner.toLowerCase().includes(query) ||
        safeCustomer.toLowerCase().includes(query);

      const matchesStatus = statusFilter === "All" || f.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [franchises, searchTerm, statusFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredFranchises.length / itemsPerPage);
  const paginatedFranchises = filteredFranchises.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handlers
  const handleEdit = (franchise: any) => {
    setEditingFranchise(franchise);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async (data: any) => {
    try {
      if (data.id) {
        await updateFranchise(data.id, data);
        toast.success("Franchise updated successfully");
        await fetchFranchises();
        setIsEditDialogOpen(false);
      }
    } catch (err: any) {
      toast.error("Failed to update franchise: " + err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-yellow-500" />
            All Franchises
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 transition-all w-64"
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
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 transition-all appearance-none"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {filteredFranchises.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center text-slate-500">No Franchises Found</div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
          <table className="data-table w-full min-w-[1100px] text-left">
            <thead>
              <tr>
                <th>Franchise ID</th>
                <th>Franchise Name</th>
                <th>Owner / Manager</th>
                <th>City</th>
                <th>Address</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Employees</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedFranchises.map((f) => (
                <tr key={f.id}>
                  <td className="whitespace-nowrap">{f.id}</td>
                  <td className="max-w-[200px] truncate" title={f.name}>{f.name}</td>
                  <td className="max-w-[160px] truncate">{f.owner || "Not Assigned"}</td>
                  <td className="whitespace-nowrap">{f.city || "—"}</td>
                  <td className="max-w-[200px] truncate" title={f.address}>{f.address || "—"}</td>
                  <td className="whitespace-nowrap">{f.phone || "—"}</td>
                  <td className="max-w-[200px] truncate" title={f.email}>{f.email || "—"}</td>
                  <td className="whitespace-nowrap">{f.totalEmployees !== undefined ? f.totalEmployees : "—"}</td>
                  <td className="whitespace-nowrap">{f.status}</td>
                  <td className="whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => router.push(`/dashboard/franchise-control/${f.id}`)} className="px-1">
                        Details
                      </button>
                      <button onClick={() => handleEdit(f)} className="p-1.5" title="Edit Franchise">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Showing <span className="font-medium text-gray-900">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium text-gray-900">{Math.min(currentPage * itemsPerPage, filteredFranchises.length)}</span> of <span className="font-medium text-gray-900">{filteredFranchises.length}</span> franchises
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-xl text-sm font-bold transition-colors ${currentPage === page
                  ? "bg-yellow-500 text-white border border-yellow-600 shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 border border-transparent"
                  }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      {isEditDialogOpen && (
        <AddFranchiseDialog
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          franchiseData={editingFranchise}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}
