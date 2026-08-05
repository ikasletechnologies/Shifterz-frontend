"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useCallback } from "react";
import { Plus, Edit2, Trash2, Search, ShieldCheck, X } from "lucide-react";
import AddServiceDialog from "@/components/services/AddServiceDialog";
import { getServices, createService, updateService, deleteService } from "@/lib/api";

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isHQ, setIsHQ] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchServices = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getServices();
      setServices(data || []);
      setError(null);
    } catch (err: any) {
      setError("Failed to load services: " + err.message);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        setIsHQ(u.role === "SUPER_ADMIN" || u.role === "HQ_USER");
      } catch {
        setIsHQ(false);
      }
    }
  }, [fetchServices]);

  const handleAdd = () => {
    setEditingService(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (service: any) => {
    setEditingService(service);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to deactivate/remove this service?")) return;
    try {
      await deleteService(id);
      await fetchServices();
    } catch (err: any) {
      console.error("Failed to delete service:", err);
      alert("Failed to delete service: " + (err.message || err));
    }
  };

  const handleSave = async (data: any) => {
    try {
      if (data.id) {
        await updateService(data.id, data);
      } else {
        await createService(data);
      }
      await fetchServices();
    } catch (err: any) {
      console.error("Failed to save service:", err);
      alert("Error saving service: " + (err.message || err));
    }
  };

  const filteredServices = services.filter(s => {
    const q = searchQuery.toLowerCase();
    return (
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.code && s.code.toLowerCase().includes(q)) ||
      (s.category && s.category.toLowerCase().includes(q))
    );
  });

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading Service Master...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Service Master</h1>
            {isHQ && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                <ShieldCheck className="w-3.5 h-3.5" /> HQ Authority
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Centralized Shifterz repository of all services, standard pricing, warranties, and GST rates (§Service Master)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search services..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-8 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {isHQ && (
            <button
              onClick={handleAdd}
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4 stroke-3" /> Add Service
            </button>
          )}
        </div>
      </div>

      {filteredServices.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-100">No services found</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/50 border-b border-gray-100 text-xs text-gray-700 uppercase font-bold tracking-wider">
              <tr>
                <th className="px-5 py-4">Service Code</th>
                <th className="px-5 py-4">Service Name</th>
                <th className="px-5 py-4">Category</th>
                <th className="px-5 py-4">Standard Price</th>
                <th className="px-5 py-4">Min Price</th>
                <th className="px-5 py-4">GST</th>
                <th className="px-5 py-4">Duration</th>
                <th className="px-5 py-4">Default Warranty</th>
                <th className="px-5 py-4">Status</th>
                {isHQ && <th className="px-5 py-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredServices.map(s => (
                <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-4 font-mono text-xs font-bold text-gray-600">{s.code || s.id}</td>
                  <td className="px-5 py-4 font-bold text-gray-900">
                    <div>{s.name}</div>
                    {s.desc && <div className="text-xs font-normal text-gray-400 mt-0.5">{s.desc}</div>}
                  </td>
                  <td className="px-5 py-4">
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-semibold">{s.category}</span>
                  </td>
                  <td className="px-5 py-4 font-bold text-emerald-600">₹{Number(s.price).toLocaleString("en-IN")}</td>
                  <td className="px-5 py-4 text-gray-600">₹{Number(s.minPrice || 0).toLocaleString("en-IN")}</td>
                  <td className="px-5 py-4 text-gray-600">{s.gst ?? 18}%</td>
                  <td className="px-5 py-4 text-gray-600">{s.duration}</td>
                  <td className="px-5 py-4 text-gray-600">{s.warranty}</td>
                  <td className="px-5 py-4">
                    <button
                      onClick={async () => {
                        if (!isHQ) return;
                        const nextStatus = s.status === "Active" ? "Inactive" : "Active";
                        try {
                          await updateService(s.id, { status: nextStatus });
                          await fetchServices();
                        } catch (e: any) {
                          alert(e.message);
                        }
                      }}
                      disabled={!isHQ}
                      className={`px-2.5 py-1 rounded-full text-xs font-extrabold transition-colors ${
                        s.status === "Active"
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-red-100 text-red-700 hover:bg-red-200"
                      }`}
                    >
                      {s.status || "Active"}
                    </button>
                  </td>
                  {isHQ && (
                    <td className="px-5 py-4 text-right space-x-1">
                      <button
                        onClick={() => handleEdit(s)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                        title="Edit Service (§Service Master)"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="p-1.5 hover:bg-red-50 rounded-lg text-red-400 transition-colors"
                        title="Deactivate/Remove Service"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <AddServiceDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        serviceData={editingService}
        onSave={handleSave}
      />
    </div>
  );
}

