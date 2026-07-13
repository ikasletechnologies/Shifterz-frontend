"use client";

import { useState } from "react";
import { X, Package, Plus } from "lucide-react";
import { WorkshopJob } from "../types/workshop.types";
import { MATERIAL_UNITS } from "../constants/workshop.constants";
import toast from "react-hot-toast";

interface MaterialUsageDialogProps {
  job: WorkshopJob | null;
  isOpen: boolean;
  onClose: () => void;
  onRecord: (material: { name: string; quantity: number; unit: string }) => Promise<boolean>;
}

export function MaterialUsageDialog({ job, isOpen, onClose, onRecord }: MaterialUsageDialogProps) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("ml");
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen || !job) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(quantity);
    if (!name.trim()) { toast.error("Material name is required"); return; }
    if (isNaN(qty) || qty <= 0) { toast.error("Quantity must be a positive number"); return; }

    setIsSaving(true);
    const success = await onRecord({ name: name.trim(), quantity: qty, unit });
    setIsSaving(false);

    if (success) {
      setName(""); setQuantity(""); setUnit("ml");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-yellow-500" /> Material Usage — {job.vehicle}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Material Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. PPF Film, Primer, Clear Coat"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Quantity *</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
                min="0"
                step="0.1"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Unit</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
              >
                {MATERIAL_UNITS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 text-sm font-bold text-gray-900 bg-yellow-400 hover:bg-yellow-500 rounded-lg flex items-center gap-2 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              {isSaving ? "Recording..." : "Record Material"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
