"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit2, Trash2, Lock } from "lucide-react";
import AddFranchiseDialog from "@/components/franchise/AddFranchiseDialog";
import { getFranchises, createFranchise, updateFranchise, deleteFranchise } from "@/lib/api";
import { toast } from "react-hot-toast";

export default function FranchisePage() {
  const router = useRouter();
  const [franchises, setFranchises] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFranchise, setEditingFranchise] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFranchises = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getFranchises();
      setFranchises(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load franchises");
      console.error(err);
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
      setFranchises(franchises.filter(f => f.id !== id));
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
        toast.success("Franchise created successfully");
      }
      await fetchFranchises();
    } catch (err: any) {
      console.error("Failed to save franchise:", err);
      toast.error("Failed to save franchise: " + err.message);
    }
  };

  const totalFranchises = franchises.length;
  const activeFranchises = franchises.filter(f => f.status === "Active").length;
  const combinedRevenue = franchises.reduce((acc, f) => acc + (f.revenue || 0), 0);
  const totalRoyalty = franchises.reduce((acc, f) => acc + (f.royaltyDue || 0), 0);

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading franchises...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-8 space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex flex-col justify-between h-24">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Franchises</span>
          <span className="text-2xl font-bold text-gray-900">{totalFranchises}</span>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex flex-col justify-between h-24">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Active</span>
          <span className="text-2xl font-bold text-green-500">{activeFranchises}</span>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex flex-col justify-between h-24 col-span-1">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Combined Revenue</span>
          <span className="text-2xl font-bold text-yellow-500">₹{combinedRevenue.toLocaleString("en-IN")}</span>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex flex-col justify-between h-24 col-span-1">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Royalty</span>
          <span className="text-2xl font-bold text-green-500">₹{totalRoyalty.toLocaleString("en-IN")}</span>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleAdd}
          className="bg-[#f59e0b] hover:bg-[#d97706] text-white font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm"
        >
          <Plus className="w-4 h-4 stroke-3" /> Add Franchise
        </button>
      </div>

      {/* Table */}
      {franchises.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No franchises found</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[1100px]">
            <thead className="bg-gray-50/50 border-b border-gray-100 text-[10px] text-gray-800 uppercase font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Franchise</th>
                <th className="px-6 py-4">City</th>
                <th className="px-6 py-4">Owner</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4">Since</th>
                <th className="px-6 py-4 text-center">Jobs (May)</th>
                <th className="px-6 py-4">Revenue (May)</th>
                <th className="px-6 py-4 text-center">Royalty %</th>
                <th className="px-6 py-4">Royalty Due</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {franchises.map(f => (
                <tr key={f.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 font-mono text-xs font-bold" style={{ color: "#F0B100" }}>{f.id}</td>
                  <td className="px-6 py-4 font-bold text-gray-900">{f.name}</td>
                  <td className="px-6 py-4 text-gray-600">{f.city}</td>
                  <td className="px-6 py-4 text-gray-600">{f.owner}</td>
                  <td className="px-6 py-4 text-gray-600 font-mono text-xs whitespace-nowrap">{f.phone ? f.phone.replace(/\s+/g, '') : ''}</td>
                  <td className="px-6 py-4 text-gray-500 text-xs">{f.startDate}</td>
                  <td className="px-6 py-4 font-bold text-gray-900 text-center">{f.jobs}</td>
                  <td className="px-6 py-4 font-bold text-yellow-500">₹{(f.revenue || 0).toLocaleString("en-IN")}</td>
                  <td className="px-6 py-4 text-gray-600 text-center">{f.royalty || 0}%</td>
                  <td className="px-6 py-4 font-bold text-green-500">₹{(f.royaltyDue || 0).toLocaleString("en-IN")}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[11px] font-bold ${f.status === 'Active' ? 'text-green-500' : 'text-yellow-500'}`}>
                      {f.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleEdit(f)} className="p-1.5 hover:bg-gray-100 rounded border border-gray-200 text-gray-500 transition-colors bg-white" title="Edit Franchise"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(f.id)} className="p-1.5 hover:bg-red-50 rounded border border-red-200 text-red-500 transition-colors bg-red-50/50" title="Delete Franchise"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Bottom Panels */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-6 text-sm">Revenue Distribution</h3>
          <div className="space-y-5">
            {franchises.map(f => {
              const percentage = Math.round(((f.revenue || 0) / combinedRevenue) * 100) || 0;
              return (
                <div key={f.id} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-gray-700">{f.city}</span>
                    <span className="text-gray-400">{percentage}% · ₹{(f.revenue || 0).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-yellow-500 h-1.5 rounded-full" style={{ width: `${percentage}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-6 text-sm">Royalty Summary</h3>
          <div className="space-y-0">
            {franchises.map(f => (
              <div key={f.id} className="flex justify-between items-center border-b border-gray-50 py-3 first:pt-0 last:border-0 last:pb-0">
                <div>
                  <div className="font-bold text-gray-900 text-xs">{f.city}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{f.jobs} jobs · {f.royalty}% royalty</div>
                </div>
                <div className="font-bold text-green-500 text-sm">₹{(f.royaltyDue || 0).toLocaleString("en-IN")}</div>
              </div>
            ))}
            <div className="flex justify-between items-center pt-4 mt-2 border-t border-gray-100">
              <div className="font-bold text-gray-900 text-sm">Total</div>
              <div className="font-bold text-yellow-500 text-sm">₹{totalRoyalty.toLocaleString("en-IN")}</div>
            </div>
          </div>
        </div>
      </div>

      <AddFranchiseDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        franchiseData={editingFranchise}
        onSave={handleSave}
      />
    </div>
  );
}
