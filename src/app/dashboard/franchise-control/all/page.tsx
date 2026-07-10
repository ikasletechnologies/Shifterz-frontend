"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  Building2, Search, Filter, Mail, Phone, MapPin, 
  User, Users, CheckCircle2, XCircle, Clock, ChevronLeft, 
  ChevronRight, Edit2, Eye 
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
      const matchesSearch = 
        safeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        safeId.toLowerCase().includes(searchTerm.toLowerCase());
      
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

  const getStatusColor = (status: string) => {
    switch(status) {
      case "Active": return "bg-green-100 text-green-700 border-green-200";
      case "Inactive": return "bg-red-100 text-red-700 border-red-200";
      case "Pending": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case "Active": return <CheckCircle2 className="w-3.5 h-3.5" />;
      case "Inactive": return <XCircle className="w-3.5 h-3.5" />;
      case "Pending": return <Clock className="w-3.5 h-3.5" />;
      default: return null;
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
          <p className="text-gray-500 mt-1">Manage and view all registered franchises</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text"
              placeholder="Search by name or ID..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 transition-all w-64"
            />
          </div>
          
          <div className="relative">
            <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 transition-all appearance-none"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {filteredFranchises.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">No Franchises Found</h3>
          <p className="text-gray-500">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {paginatedFranchises.map((f) => (
            <div key={f.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col group">
              
              {/* Card Header */}
              <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-yellow-600 transition-colors line-clamp-1" title={f.name}>
                    {f.name}
                  </h3>
                  <p className="text-xs font-mono text-gray-500 mt-1">ID: {f.id}</p>
                </div>
                <div className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${getStatusColor(f.status)}`}>
                  {getStatusIcon(f.status)}
                  {f.status}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 space-y-4">
                <div className="flex items-start gap-3">
                  <User className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Owner / Manager</p>
                    <p className="text-sm font-medium text-gray-900">{f.owner || "Not Assigned"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Location</p>
                    <p className="text-sm font-medium text-gray-900">{f.city || "Not Specified"}</p>
                    {f.address && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1" title={f.address}>{f.address}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <p className="text-sm font-medium text-gray-900">{f.phone || "N/A"}</p>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <p className="text-sm font-medium text-gray-900 truncate" title={f.email}>{f.email || "N/A"}</p>
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-white px-2 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                  <Users className="w-3.5 h-3.5" />
                  {f.totalEmployees !== undefined ? `${f.totalEmployees} Employees` : "Employees N/A"}
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleEdit(f)}
                    className="p-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:text-yellow-600 hover:border-yellow-300 hover:bg-yellow-50 transition-all shadow-sm"
                    title="Edit Franchise"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => router.push(`/dashboard/franchise-control/${f.id}`)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Details
                  </button>
                </div>
              </div>

            </div>
          ))}
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
                className={`w-8 h-8 rounded-xl text-sm font-bold transition-colors ${
                  currentPage === page 
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
