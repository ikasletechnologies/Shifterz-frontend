"use client";

import { useState, useEffect, useMemo } from "react";
import {
  X,
  Package,
  Plus,
  Search,
  Check,
  Boxes,
  AlertCircle,
  History,
  Layers,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { WorkshopJob, MaterialRecord } from "../types/workshop.types";
import { MATERIAL_UNITS } from "../constants/workshop.constants";
import { getInventory } from "@/lib/api";
import { getJobMaterials } from "../services/workshop.service";
import toast from "react-hot-toast";

interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  category: string;
  stock: number;
  reorder?: number;
  cost?: number;
  supplier?: string;
  location?: string;
}

interface MaterialUsageDialogProps {
  job: WorkshopJob | null;
  isOpen: boolean;
  onClose: () => void;
  onRecord: (material: { itemId?: string; name: string; quantity: number; unit: string }) => Promise<boolean>;
}

export function MaterialUsageDialog({ job, isOpen, onClose, onRecord }: MaterialUsageDialogProps) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoadingInventory, setIsLoadingInventory] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  // Custom (unlisted) part toggle
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customName, setCustomName] = useState("");

  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("pcs");
  const [isSaving, setIsSaving] = useState(false);

  // Job material consumption history
  const [jobMaterials, setJobMaterials] = useState<MaterialRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Load inventory items and job material history when modal opens
  useEffect(() => {
    if (!isOpen || !job) return;

    let isMounted = true;
    setIsLoadingInventory(true);
    getInventory()
      .then((data) => {
        if (!isMounted) return;
        setInventory(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error("Failed to load inventory items:", err);
        toast.error("Could not load inventory items");
      })
      .finally(() => {
        if (isMounted) setIsLoadingInventory(false);
      });

    setIsLoadingHistory(true);
    getJobMaterials(job.id)
      .then((records) => {
        if (!isMounted) return;
        setJobMaterials(Array.isArray(records) ? records : []);
      })
      .catch((err) => {
        console.warn("Could not load recorded materials:", err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingHistory(false);
      });

    // Reset selection state
    setSelectedItem(null);
    setIsCustomMode(false);
    setCustomName("");
    setQuantity("1");
    setUnit("pcs");
    setSearchQuery("");
    setSelectedCategory("ALL");

    return () => {
      isMounted = false;
    };
  }, [isOpen, job]);

  // Extract categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    inventory.forEach((i) => {
      if (i.category && i.category.trim()) {
        set.add(i.category.trim());
      }
    });
    return ["ALL", ...Array.from(set)];
  }, [inventory]);

  // Filtered inventory items
  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return inventory.filter((item) => {
      const matchCat = selectedCategory === "ALL" || item.category === selectedCategory;
      if (!matchCat) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        (item.category && item.category.toLowerCase().includes(q)) ||
        item.id.toLowerCase().includes(q)
      );
    });
  }, [inventory, searchQuery, selectedCategory]);

  if (!isOpen || !job) return null;

  const handleSelectItem = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsCustomMode(false);
    setUnit(item.unit || "pcs");
    if (!quantity || quantity === "0") {
      setQuantity("1");
    }
  };

  const handleToggleCustom = () => {
    setIsCustomMode((prev) => {
      const next = !prev;
      if (next) {
        setSelectedItem(null);
        setUnit("pcs");
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const partName = isCustomMode ? customName.trim() : (selectedItem?.name || "").trim();
    const itemId = isCustomMode ? undefined : selectedItem?.id;

    if (!partName) {
      toast.error("Please select an inventory item or enter a material name");
      return;
    }

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      toast.error("Quantity must be a positive number");
      return;
    }

    setIsSaving(true);
    const success = await onRecord({
      itemId,
      name: partName,
      quantity: qty,
      unit,
    });
    setIsSaving(false);

    if (success) {
      // Refresh local recorded materials
      try {
        const updated = await getJobMaterials(job.id);
        if (Array.isArray(updated)) {
          setJobMaterials(updated);
        }
      } catch (_) {}

      // Reset selection for next item or close
      setSelectedItem(null);
      setCustomName("");
      setIsCustomMode(false);
      setQuantity("1");
      onClose();
    }
  };

  const currentStock = selectedItem ? selectedItem.stock : null;
  const parsedQty = parseFloat(quantity) || 0;
  const isExceedingStock = currentStock !== null && parsedQty > currentStock;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden my-auto border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-2xs">
              <Package className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                Parts &amp; Inventory Usage
              </h2>
              <p className="text-xs text-slate-500">
                Vehicle: <span className="font-semibold text-slate-700">{job.vehicle}</span> &bull; Job: <span className="font-semibold text-slate-700">{job.id}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          
          {/* Mode Switcher / Banner */}
          <div className="flex items-center justify-between gap-3 bg-amber-50/70 border border-amber-200/80 rounded-xl p-3">
            <div className="flex items-center gap-2 text-xs text-amber-900 font-medium">
              <Boxes className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                {isCustomMode
                  ? "Recording an unlisted or custom workshop consumable."
                  : "Select an available inventory part below to record usage for this job."}
              </span>
            </div>
            <button
              type="button"
              onClick={handleToggleCustom}
              className="text-xs font-bold text-amber-800 hover:text-amber-950 underline underline-offset-2 shrink-0 cursor-pointer"
            >
              {isCustomMode ? "Pick from Inventory" : "Enter Custom Item"}
            </button>
          </div>

          {/* Section: Available Inventory Search & Grid */}
          {!isCustomMode ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Boxes className="w-3.5 h-3.5 text-amber-500" />
                  Available Inventory Items
                  <span className="ml-1 text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    {filteredItems.length} available
                  </span>
                </label>
              </div>

              {/* Search Bar & Category Filter */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search available parts, lubricants, consumables..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition-all"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {categories.length > 2 && (
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat === "ALL" ? "All Categories" : cat}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Inventory Items List / Grid */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                {isLoadingInventory ? (
                  <div className="p-8 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-amber-500 animate-spin" />
                    <span>Loading available inventory from master...</span>
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs space-y-2">
                    <Package className="w-7 h-7 text-slate-300 mx-auto" />
                    <p className="font-semibold text-slate-600">
                      {searchQuery
                        ? `No inventory items match "${searchQuery}".`
                        : "No inventory items registered in this branch."}
                    </p>
                    <p className="text-slate-400">
                      You can click &ldquo;Enter Custom Item&rdquo; above to record an unlisted consumable.
                    </p>
                  </div>
                ) : (
                  <div className="max-h-52 overflow-y-auto divide-y divide-slate-100 p-1">
                    {filteredItems.map((item) => {
                      const isSelected = selectedItem?.id === item.id;
                      const inStock = item.stock > 0;
                      const isLow = inStock && item.stock <= (item.reorder || 5);

                      return (
                        <div
                          key={item.id}
                          onClick={() => handleSelectItem(item)}
                          className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all ${
                            isSelected
                              ? "bg-amber-100/70 border border-amber-300 shadow-2xs"
                              : "hover:bg-white hover:shadow-2xs border border-transparent"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 pr-2">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                                isSelected
                                  ? "bg-amber-400 text-slate-900"
                                  : inStock
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-slate-100 text-slate-400 border border-slate-200"
                              }`}
                            >
                              {isSelected ? <Check className="w-4 h-4 stroke-[3]" /> : <Package className="w-3.5 h-3.5" />}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                                {item.name}
                              </p>
                              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                                {item.category && (
                                  <span className="font-medium text-slate-600">{item.category}</span>
                                )}
                                <span className="text-slate-300">&bull;</span>
                                <span className="text-slate-400 text-[10px] uppercase font-mono">{item.id}</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0 flex items-center gap-3">
                            <div className="text-right">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold ${
                                  !inStock
                                    ? "bg-rose-100 text-rose-700"
                                    : isLow
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-emerald-100 text-emerald-800"
                                }`}
                              >
                                {inStock ? `Stock: ${item.stock} ${item.unit || "pcs"}` : "Out of Stock"}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectItem(item);
                              }}
                              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                                isSelected
                                  ? "bg-amber-400 text-slate-950 font-black"
                                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                              }`}
                            >
                              {isSelected ? "Selected" : "Select"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Custom Material Input */
            <div className="space-y-1.5 bg-slate-50 border border-slate-200 rounded-xl p-4">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Custom / Unlisted Material Name *
              </label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g. Special Primer, Sandpaper 2000, 3M Masking Tape"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                autoFocus
              />
              <p className="text-[11px] text-slate-500">
                Enter the name of the workshop consumable if it is not found in the standard inventory catalog.
              </p>
            </div>
          )}

          {/* Selected Item Banner (When in Inventory mode & an item is chosen) */}
          {!isCustomMode && selectedItem && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                  Selected Part
                </span>
                <p className="text-sm font-black text-slate-900">{selectedItem.name}</p>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <span>Available Balance:</span>
                  <span className={`font-bold ${selectedItem.stock > 0 ? "text-emerald-700" : "text-rose-600"}`}>
                    {selectedItem.stock} {selectedItem.unit || "pcs"}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-700 bg-white border border-slate-200 px-2.5 py-1 rounded-lg cursor-pointer"
              >
                Change
              </button>
            </div>
          )}

          {/* Form inputs: Quantity and Unit */}
          <form id="material-usage-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Quantity */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Quantity to Record *
                  </label>
                  {selectedItem && (
                    <span className="text-[10px] text-slate-500 font-medium">
                      In Stock: {selectedItem.stock}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const v = Math.max(0.5, (parseFloat(quantity) || 1) - 1);
                      setQuantity(String(v));
                    }}
                    className="w-10 h-10 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center shrink-0 cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="1"
                    min="0.1"
                    step="0.1"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-center font-bold focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const v = (parseFloat(quantity) || 0) + 1;
                      setQuantity(String(v));
                    }}
                    className="w-10 h-10 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center shrink-0 cursor-pointer"
                  >
                    +
                  </button>
                </div>

                {/* Warning if requested exceeds available stock */}
                {isExceedingStock && (
                  <p className="text-[11px] font-medium text-amber-700 flex items-center gap-1 mt-1 bg-amber-50 p-1.5 rounded-md border border-amber-200">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                    <span>Requested qty ({parsedQty}) exceeds branch balance ({currentStock}).</span>
                  </p>
                )}
              </div>

              {/* Unit */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Unit of Measure
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  {/* Ensure current unit is an option even if not in standard list */}
                  {!MATERIAL_UNITS.includes(unit) && unit && (
                    <option value={unit}>{unit}</option>
                  )}
                  {MATERIAL_UNITS.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
            </div>
          </form>

          {/* Section: Previously Recorded Parts for this Job */}
          <div className="border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={() => setShowHistory((prev) => !prev)}
              className="w-full flex items-center justify-between text-xs font-bold text-slate-600 hover:text-slate-900 py-1 cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-slate-500" />
                <span>Recorded Parts on this Job ({jobMaterials.length})</span>
              </div>
              {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {showHistory && (
              <div className="mt-2 border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                {isLoadingHistory ? (
                  <div className="p-4 text-center text-xs text-slate-500">Loading parts history...</div>
                ) : jobMaterials.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    No parts have been recorded for this job yet.
                  </div>
                ) : (
                  <div className="max-h-36 overflow-y-auto divide-y divide-slate-100">
                    {jobMaterials.map((rec, idx) => (
                      <div key={rec.id || idx} className="p-2.5 flex items-center justify-between text-xs">
                        <div className="min-w-0 pr-2">
                          <p className="font-bold text-slate-800 truncate">
                            {rec.itemName || rec.name}
                          </p>
                          <span className="text-[10px] text-slate-400">
                            {rec.createdAt ? new Date(rec.createdAt).toLocaleDateString() : "Recorded"}
                          </span>
                        </div>
                        <div className="text-right shrink-0 flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                            {rec.quantity} {rec.unit}
                          </span>
                          {rec.status && (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                rec.status === "Approved"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : rec.status === "Rejected"
                                  ? "bg-rose-100 text-rose-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {rec.status}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-100 bg-slate-50/70 sticky bottom-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="material-usage-form"
            disabled={isSaving || (!isCustomMode && !selectedItem) || (isCustomMode && !customName.trim())}
            className="px-5 py-2 text-xs sm:text-sm font-black text-slate-950 bg-amber-400 hover:bg-amber-500 rounded-xl flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs transition-all cursor-pointer"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Recording...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Record Material</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
