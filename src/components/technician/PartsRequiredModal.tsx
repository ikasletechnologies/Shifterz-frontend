"use client";

import { useState, useEffect, useMemo } from "react";
import { getInventory } from "@/lib/api";
import { 
  X, Search, Package, AlertCircle, CheckCircle2, 
  AlertTriangle, Loader2, Plus, Minus, ArrowRight, Check
} from "lucide-react";
import { toast } from "react-hot-toast";

export interface PartsRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: any;
  onPartsUsed: (part: { itemId: string; itemName: string; quantity: number; unit?: string }) => Promise<void>;
  onPartsRequested: (requestData: {
    jobId: string;
    vehicleId: string;
    technicianId: string;
    partId: string;
    partName: string;
    requiredQuantity: number;
    availableQuantity: number;
    requestedQuantity: number;
    reason: string;
    createdAt: string;
    status: string;
  }) => Promise<void>;
}

export default function PartsRequiredModal({
  isOpen,
  onClose,
  job,
  onPartsUsed,
  onPartsRequested,
}: PartsRequiredModalProps) {
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    setLoading(true);
    setSelectedItemId(null);
    setSearch("");
    setQuantities({});

    getInventory()
      .then((data) => {
        if (mounted) {
          const items = Array.isArray(data) ? data : [];
          setInventoryItems(items);
        }
      })
      .catch((err) => {
        console.error("Failed to load inventory:", err);
        toast.error("Failed to load inventory: " + (err.message || "Unknown error"));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [isOpen]);

  const filteredItems = useMemo(() => {
    if (!search.trim()) return inventoryItems;
    const q = search.toLowerCase().trim();
    return inventoryItems.filter(
      (item) =>
        (item.name && item.name.toLowerCase().includes(q)) ||
        (item.id && item.id.toLowerCase().includes(q)) ||
        (item.sku && item.sku.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q))
    );
  }, [inventoryItems, search]);

  if (!isOpen || !job) return null;

  const getItemQty = (itemId: string) => quantities[itemId] || 1;

  const updateItemQty = (itemId: string, delta: number) => {
    setQuantities((prev) => {
      const current = prev[itemId] || 1;
      const next = Math.max(1, current + delta);
      return { ...prev, [itemId]: next };
    });
  };

  const setItemQty = (itemId: string, val: number) => {
    setQuantities((prev) => ({
      ...prev,
      [itemId]: Math.max(1, val || 1),
    }));
  };

  // Handle Using an in-stock part
  const handleUsePart = async (item: any) => {
    const qty = getItemQty(item.id);
    const stock = Number(item.stock || 0);

    if (stock < qty) {
      toast.error("Insufficient stock available for this part");
      return;
    }

    setSubmitting(true);
    try {
      await onPartsUsed({
        itemId: item.id,
        itemName: item.name,
        quantity: qty,
        unit: item.unit || "unit",
      });
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to use part");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Requesting an out-of-stock or low-stock part
  const handleRequestPart = async (item: any) => {
    const required = getItemQty(item.id);
    const stock = Number(item.stock || 0);
    const requested = Math.max(1, required - stock);

    setSubmitting(true);
    try {
      const requestData = {
        jobId: job.id,
        vehicleId: job.vehicle || "",
        technicianId: job.technicianId || job.technician || "",
        partId: item.id,
        partName: item.name,
        requiredQuantity: required,
        availableQuantity: stock,
        requestedQuantity: requested,
        reason: `Required for job ${job.id} (${job.vehicle})`,
        createdAt: new Date().toISOString(),
        status: "Pending",
      };

      await onPartsRequested(requestData);
      toast.success("Parts request submitted successfully.");
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to request parts");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[88vh] border border-slate-200">
        
        {/* Header */}
        <div className="flex justify-between items-start p-5 sm:p-6 border-b border-slate-100 bg-slate-50/70">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Parts Needed</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select the parts required to complete this job.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search parts by name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl w-full focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none bg-white text-slate-900 shadow-2xs"
            />
          </div>

          {/* Inventory Items List */}
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 space-y-2">
              <Loader2 className="w-7 h-7 animate-spin text-amber-500" />
              <p className="text-xs text-slate-400">Loading Super Admin inventory...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-8 text-center text-slate-500 border border-slate-200 rounded-xl bg-slate-50">
              <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">No parts found matching search</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredItems.map((item) => {
                const stock = Number(item.stock || 0);
                const reqQty = getItemQty(item.id);
                const isStockAvailable = stock >= reqQty;
                const isLowStock = stock > 0 && stock < reqQty;
                const isOutOfStock = stock === 0;

                return (
                  <div
                    key={item.id}
                    className="p-3.5 sm:p-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-white shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                  >
                    {/* Item Information */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 truncate">
                          {item.name}
                        </span>
                        {item.sku && (
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                            {item.sku}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3 mt-1 text-xs">
                        <span className="text-slate-500">
                          Available: <strong className={stock > 0 ? "text-slate-800" : "text-red-600"}>{stock}</strong> {item.unit || "units"}
                        </span>

                        {isStockAvailable && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>In Stock</span>
                          </span>
                        )}

                        {isLowStock && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-300">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            <span>Low Stock</span>
                          </span>
                        )}

                        {isOutOfStock && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                            <AlertCircle className="w-3 h-3 text-red-600" />
                            <span>OUT OF STOCK</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions & Quantity Selector */}
                    <div className="flex items-center gap-3 shrink-0">
                      
                      {/* Quantity Selector */}
                      <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg p-1">
                        <button
                          type="button"
                          onClick={() => updateItemQty(item.id, -1)}
                          disabled={reqQty <= 1 || submitting}
                          className="w-7 h-7 flex items-center justify-center rounded text-slate-600 hover:bg-slate-200/70 disabled:opacity-40 cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <input
                          type="number"
                          min={1}
                          value={reqQty}
                          onChange={(e) => setItemQty(item.id, parseInt(e.target.value) || 1)}
                          className="w-10 text-center font-bold text-xs bg-transparent border-none outline-none text-slate-900"
                        />
                        <button
                          type="button"
                          onClick={() => updateItemQty(item.id, 1)}
                          disabled={submitting}
                          className="w-7 h-7 flex items-center justify-center rounded text-slate-600 hover:bg-slate-200/70 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Action Button: Select vs Request Parts */}
                      {isStockAvailable ? (
                        <button
                          type="button"
                          onClick={() => handleUsePart(item)}
                          disabled={submitting}
                          className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {submitting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          <span>Select</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRequestPart(item)}
                          disabled={submitting}
                          className="px-3.5 py-2 text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-500 rounded-xl transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {submitting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <ArrowRight className="w-3.5 h-3.5" />
                          )}
                          <span>Request Parts</span>
                        </button>
                      )}

                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <span className="text-[11px] text-slate-400">
            Select an in-stock part or click Request Parts for replenishment.
          </span>
        </div>

      </div>
    </div>
  );
}
