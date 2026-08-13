"use client";
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any */

import React, { useState, useEffect } from "react";
import { createPurchase, updatePurchaseOrder, getVendors } from "@/lib/api";
import {
  ShoppingCart,
  Plus,
  Trash2,
  ShieldAlert,
  ShieldCheck,
  X,
} from "lucide-react";

interface CreatePurchaseOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  initialData?: any;
}

interface OrderItem {
  name: string;
  sku: string;
  qty: number;
  unitPrice: number;
  total: number;
}

export function CreatePurchaseOrderDialog({
  open,
  onOpenChange,
  onSuccess,
  initialData,
}: CreatePurchaseOrderDialogProps) {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [orderNumber, setOrderNumber] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<OrderItem[]>([
    { name: "Synthetic Oil 5W30 (210L Barrel)", sku: "OIL-5W30-210", qty: 2, unitPrice: 24500, total: 49000 },
  ]);

  useEffect(() => {
    if (open) {
      if (initialData) {
        setOrderNumber(initialData.orderNumber || "");
        setVendorId(initialData.vendorId || "");
        setNotes(initialData.notes || "");
        let parsedItems = initialData.items;
        if (typeof parsedItems === "string") {
          try {
            parsedItems = JSON.parse(parsedItems);
          } catch {
            parsedItems = [];
          }
        }
        setItems(
          Array.isArray(parsedItems) && parsedItems.length > 0
            ? parsedItems
            : [
                { name: "Synthetic Oil 5W30 (210L Barrel)", sku: "OIL-5W30-210", qty: 2, unitPrice: 24500, total: 49000 },
              ]
        );
      } else {
        setOrderNumber(`PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
        setVendorId("");
        setNotes("");
        setItems([
          { name: "Synthetic Oil 5W30 (210L Barrel)", sku: "OIL-5W30-210", qty: 2, unitPrice: 24500, total: 49000 },
        ]);
      }
      setError(null);
      fetchVendors();
    }
  }, [open, initialData]);

  const fetchVendors = async () => {
    try {
      const data = await getVendors();
      setVendors(data || []);
      if (data && data.length > 0) {
        setVendorId(data[0].id);
      }
    } catch (err) {
      console.error("Failed to load vendors:", err);
    }
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { name: "", sku: "", qty: 1, unitPrice: 0, total: 0 },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (
    index: number,
    field: keyof OrderItem,
    val: string | number
  ) => {
    setItems((prev) => {
      const copy = [...prev];
      const item = { ...copy[index] };
      if (field === "name" || field === "sku") {
        (item[field] as string) = String(val);
      } else if (field === "qty" || field === "unitPrice") {
        (item[field] as number) = Number(val) || 0;
        item.total = Number(item.qty) * Number(item.unitPrice);
      }
      copy[index] = item;
      return copy;
    });
  };

  const totalAmount = items.reduce((sum, item) => sum + (item.total || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber || !vendorId) {
      setError("Please select a vendor and ensure Order Number is present.");
      return;
    }
    if (items.length === 0 || items.some((i) => !i.name || i.qty <= 0)) {
      setError("Please add at least one valid item with positive quantity.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      if (initialData && initialData.id) {
        await updatePurchaseOrder(initialData.id, {
          orderNumber,
          vendorId,
          items,
          totalAmount,
          notes,
        });
      } else {
        await createPurchase({
          orderNumber,
          vendorId,
          items,
          totalAmount,
          notes,
          createdBy: "Headquarters Procurement",
        });
      }
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || (initialData ? "Failed to update Purchase Order." : "Failed to create Purchase Order."));
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-[#1e293b] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-100 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/80 bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                {initialData ? "Edit Headquarters Purchase Order" : "Create Headquarters Purchase Order"}
              </h3>
              <p className="text-xs text-slate-400">
                PRD §10: Only Headquarters shall create & authorize Purchase Orders.
              </p>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400 text-xs">
              <ShieldCheck className="w-4 h-4" />
              <span>
                <strong>HQ Authority Enforced:</strong> Goods Receipt will automatically update HQ inventory stock.
              </span>
            </div>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded uppercase font-bold tracking-wider">
              PRD Compliant
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Order Number *
              </label>
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="PO-2026-0001"
                required
                className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Select Supplier (Vendor) *
              </label>
              <select
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value)}
                required
                className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- Select Vendor --</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.code} - {v.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Items Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Purchase Order Items
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="h-7 px-3 text-xs font-medium border border-slate-700 hover:bg-slate-800 rounded-lg text-emerald-400 flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Line Item
              </button>
            </div>

            <div className="space-y-2">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-12 gap-2 p-3 rounded-lg bg-slate-900/80 border border-slate-700/80 items-center"
                >
                  <div className="col-span-4 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase">Item Name</span>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleItemChange(idx, "name", e.target.value)}
                      placeholder="e.g. Brake Pads Front"
                      className="w-full h-8 px-2 text-xs rounded bg-slate-950 border border-slate-700 text-slate-100"
                    />
                  </div>

                  <div className="col-span-3 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase">SKU / Code</span>
                    <input
                      type="text"
                      value={item.sku}
                      onChange={(e) => handleItemChange(idx, "sku", e.target.value)}
                      placeholder="BP-FR-01"
                      className="w-full h-8 px-2 text-xs rounded bg-slate-950 border border-slate-700 text-slate-100"
                    />
                  </div>

                  <div className="col-span-2 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase">Qty</span>
                    <input
                      type="number"
                      min="1"
                      value={item.qty}
                      onChange={(e) => handleItemChange(idx, "qty", e.target.value)}
                      className="w-full h-8 px-2 text-xs rounded bg-slate-950 border border-slate-700 text-slate-100"
                    />
                  </div>

                  <div className="col-span-2 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase">Unit Price (₹)</span>
                    <input
                      type="number"
                      min="0"
                      value={item.unitPrice}
                      onChange={(e) =>
                        handleItemChange(idx, "unitPrice", e.target.value)
                      }
                      className="w-full h-8 px-2 text-xs rounded bg-slate-950 border border-slate-700 text-slate-100"
                    />
                  </div>

                  <div className="col-span-1 flex justify-end pt-5">
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end items-center gap-3 py-2 px-3 rounded-lg bg-slate-900 border border-slate-700">
              <span className="text-xs text-slate-400">Total Purchase Amount:</span>
              <span className="text-lg font-bold text-emerald-400">
                ₹{totalAmount.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Notes & Delivery Instructions
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Please deliver to HQ warehouse Gate 2 before 5 PM."
              className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/80">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
            >
              {loading ? (initialData ? "Saving..." : "Creating...") : (initialData ? "✓ Save Changes" : "Create Purchase Order")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
