"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useCallback } from "react";
import { Plus, Printer, Edit2, Search, X } from "lucide-react";
import NewOutPassDialog from "@/components/outpass/NewOutPassDialog";
import PrintPassDialog from "@/components/outpass/PrintPassDialog";
import { getOutPasses, createOutPass, updateOutPass } from "@/lib/api";

interface OutPass {
  id: string;
  passId?: string;
  vehicle: string;
  model: string;
  customer: string;
  phone: string;
  service: string;
  outTime: string;
  technician?: string;
  technicianName?: string;
  security?: string;
  securityName?: string;
}

export default function OutPassPage() {
  const [outPasses, setOutPasses] = useState<OutPass[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [selectedPass, setSelectedPass] = useState<OutPass | null>(null);
  const [editingPass, setEditingPass] = useState<OutPass | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchOutPasses = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getOutPasses();
      setOutPasses(data || []);
    } catch (err: any) {
      setError("Failed to load outpasses: " + err.message);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOutPasses();
  }, [fetchOutPasses]);

  const handleSave = async (data: any) => {
    try {
      if (editingPass) {
        await updateOutPass(editingPass.id, data);
      } else {
        await createOutPass(data);
      }
      await fetchOutPasses();
      setIsDialogOpen(false);
      setEditingPass(null);
    } catch (err) {
      console.error("Failed to save out pass:", err);
      alert("Failed to save out pass.");
    }
  };

  const totalPasses = outPasses.length;

  const handlePrintClick = (pass: OutPass) => {
    setSelectedPass(pass);
    setIsPrintOpen(true);
  };

  const filteredOutPasses = outPasses.filter(pass =>
    (pass.passId || pass.id || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    pass.vehicle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pass.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pass.phone.includes(searchQuery)
  );

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading out passes...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-8">
      {/* Stats and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between mb-6">
        <div className="flex flex-wrap items-center gap-4 flex-1">
          <div className="bg-yellow-100 text-yellow-700 font-semibold px-4 py-2 rounded-lg inline-block">
            🟨 Total Passes: {totalPasses}
          </div>
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search out passes by ID, vehicle, customer, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-9 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        <button
          onClick={() => {
            setEditingPass(null);
            setIsDialogOpen(true);
          }}
          className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap"
        >
          <Plus className="w-5 h-5" />
          New Out Pass
        </button>
      </div>

      {/* Table */}
      {filteredOutPasses.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No out passes found</div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Out Pass Register</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full table-fixed">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-3 py-3 text-left text-[11px] font-bold text-gray-900 uppercase tracking-wider">
                    Pass ID
                  </th>
                  <th className="px-3 py-3 text-left text-[11px] font-bold text-gray-900 uppercase tracking-wider">
                    Vehicle
                  </th>
                  <th className="px-3 py-3 text-left text-[11px] font-bold text-gray-900 uppercase tracking-wider">
                    Model
                  </th>
                  <th className="px-3 py-3 text-left text-[11px] font-bold text-gray-900 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-3 py-3 text-left text-[11px] font-bold text-gray-900 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-3 py-3 text-left text-[11px] font-bold text-gray-900 uppercase tracking-wider">
                    Out Time
                  </th>
                  <th className="px-3 py-3 text-left text-[11px] font-bold text-gray-900 uppercase tracking-wider">
                    Technician
                  </th>
                  <th className="px-3 py-3 text-left text-[11px] font-bold text-gray-900 uppercase tracking-wider">
                    Security
                  </th>
                  <th className="px-3 py-3 text-left text-[11px] font-bold text-gray-900 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredOutPasses.map((pass) => (
                  <tr key={pass.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-3 text-xs font-mono font-bold" style={{ color: "#F0B100" }}>
                      {pass.passId || pass.id}
                    </td>
                    <td className="px-3 py-3 text-xs font-bold text-gray-900 whitespace-nowrap">
                      {pass.vehicle}
                    </td>
                    <td className="px-3 py-3 text-xs font-medium text-gray-900">{pass.model}</td>
                    <td className="px-3 py-3 text-xs">
                      <div className="font-bold text-gray-900">{pass.customer}</div>
                      <div className="text-[10px] font-medium text-gray-700">{pass.phone}</div>
                    </td>
                    <td className="px-3 py-3 text-xs font-medium text-gray-900">{pass.service}</td>
                    <td className="px-3 py-3 text-xs font-medium text-gray-900">
                      {pass.outTime ? new Date(pass.outTime).toLocaleString('en-IN', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      }) : '-'}
                    </td>
                    <td className="px-3 py-3 text-xs font-medium text-gray-900">
                      {pass.technicianName || pass.technician}
                    </td>
                    <td className="px-3 py-3 text-xs font-medium text-gray-900">{pass.securityName || pass.security}</td>
                    <td className="px-3 py-3 text-xs">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handlePrintClick(pass)}
                          className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-2 py-1 rounded text-[10px] transition-colors flex items-center gap-1"
                        >
                          <Printer className="w-3 h-3" />
                          Print
                        </button>
                        <button
                          onClick={() => {
                            setEditingPass(pass);
                            setIsDialogOpen(true);
                          }}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-gray-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <NewOutPassDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingPass(null);
        }}
        onSubmit={handleSave}
        initialData={editingPass}
      />
      <PrintPassDialog
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        pass={selectedPass ? {
          ...selectedPass,
          passId: selectedPass.passId || selectedPass.id,
          technician: selectedPass.technicianName || selectedPass.technician || "",
          security: selectedPass.securityName || selectedPass.security || ""
        } : undefined}
      />
    </div>
  );
}
