"use client";

import React, { useState, useEffect } from "react";
import { createWarranty, getCustomers } from "@/lib/api";

interface CustomerOption {
  id: string;
  name: string;
  phone: string;
  vehicleNo?: string;
}

interface CreateWarrantyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateWarrantyDialog({
  isOpen,
  onClose,
  onSuccess,
}: CreateWarrantyDialogProps) {
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [vehicleNo, setVehicleNo] = useState("");
  const [itemName, setItemName] = useState("");
  const [durationDays, setDurationDays] = useState(365);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadCustomers();
    }
  }, [isOpen]);

  const loadCustomers = async () => {
    try {
      const data = await getCustomers();
      setCustomers(data || []);
      if (data && data.length > 0) {
        setSelectedCustomerId(data[0].id);
        if (data[0].vehicleNo) setVehicleNo(data[0].vehicleNo);
      }
    } catch (err: any) {
      console.error("Failed to load customers:", err);
    }
  };

  const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedCustomerId(id);
    const found = customers.find((c) => c.id === id);
    if (found && found.vehicleNo) {
      setVehicleNo(found.vehicleNo);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !vehicleNo.trim() || !itemName.trim()) {
      setError("Please fill out Customer, Vehicle Number, and Service/Item Name.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      await createWarranty({
        customerId: selectedCustomerId,
        vehicleNo: vehicleNo.trim().toUpperCase(),
        itemName: itemName.trim(),
        durationDays: Number(durationDays),
        status: "Active",
        notes: notes.trim() || undefined,
      });
      onSuccess();
      onClose();
      // reset form
      setItemName("");
      setDurationDays(365);
      setNotes("");
    } catch (err: any) {
      setError(err.message || "Failed to create warranty record.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Create New Warranty</h3>
            <p className="text-xs text-slate-400">
              Issue an active warranty for service or part replacement
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Select Customer *
            </label>
            <select
              value={selectedCustomerId}
              onChange={handleCustomerChange}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              required
            >
              <option value="">-- Select Customer --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Vehicle Registration Number *
            </label>
            <input
              type="text"
              value={vehicleNo}
              onChange={(e) => setVehicleNo(e.target.value)}
              placeholder="e.g. MH02AB1234"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 uppercase"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Covered Service / Item Name *
            </label>
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="e.g. Ceramic Coating 5-Year / Engine Overhaul"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Warranty Period *
              </label>
              <select
                value={durationDays}
                onChange={(e) => setDurationDays(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                <option value={90}>3 Months (90 days)</option>
                <option value={180}>6 Months (180 days)</option>
                <option value={365}>1 Year (365 days)</option>
                <option value={730}>2 Years (730 days)</option>
                <option value={1095}>3 Years (1095 days)</option>
                <option value={1825}>5 Years (1825 days)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Initial Status
              </label>
              <select
                disabled
                value="Active"
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-3 py-2 text-sm text-emerald-400 font-medium cursor-not-allowed"
              >
                <option value="Active">Active</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Warranty Terms & Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Specify warranty coverage limitations, terms, or reference..."
              rows={3}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-sm font-medium rounded-xl shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
            >
              {loading ? "Creating..." : "Issue Warranty"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
