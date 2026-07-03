"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useCallback } from "react";
import { Plus, Edit2, Trash2, Search } from "lucide-react";
import AddServiceDialog from "@/components/services/AddServiceDialog";
import { getServices, createService, deleteService } from "@/lib/api";

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    try {
      await deleteService(id);
      setServices(services.filter(s => s.id !== id));
    } catch (err) {
      console.error("Failed to delete service:", err);
    }
  };

  const handleSave = async (data: any) => {
    try {
      if (data.id) {
        // Update would go here if API supports it
        setServices(services.map(s => s.id === data.id ? data : s));
      } else {
        await createService(data);
        await fetchServices();
      }
    } catch (err) {
      console.error("Failed to save service:", err);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading services...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Services & Pricing</h1>
        <button
          onClick={handleAdd}
          className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4 stroke-3" /> Add Service
        </button>
      </div>

      {services.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No services found</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/50 border-b border-gray-100 text-xs text-gray-800 uppercase font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Service Name</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4">Warranty</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {services.map(s => (
                <tr key={s.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 font-bold text-gray-900">{s.name}</td>
                  <td className="px-6 py-4"><span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-semibold">{s.category}</span></td>
                  <td className="px-6 py-4 font-bold text-green-500">₹{Number(s.price).toLocaleString("en-IN")}</td>
                  <td className="px-6 py-4 text-gray-500">{s.duration}</td>
                  <td className="px-6 py-4 text-gray-500">{s.warranty}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => handleEdit(s)} className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500 transition-colors"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(s.id)} className="p-1.5 hover:bg-red-50 rounded-md text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </td>
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
