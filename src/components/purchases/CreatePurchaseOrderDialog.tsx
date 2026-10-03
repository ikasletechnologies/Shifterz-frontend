"use client";
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any */

import React, { useState, useEffect } from "react";
import {
  createPurchase,
  updatePurchaseOrder,
  getActiveVendors,
  getNextPoNumber,
} from "@/lib/api";
import {
  ShoppingCart,
  Plus,
  Trash2,
  X,
  AlertCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";

interface CreatePurchaseOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  initialData?: any;
}

export interface OrderItem {
  name: string;
  sku: string; // internal reference (hidden from UI)
  qty: number | "";
  unitPrice: number | "";
  gstRate: number | ""; // 0, 5, 12, 18, 28, or ""
  taxAmount: number;
  total: number;
}

const createBlankItem = (): OrderItem => ({
  name: "",
  sku: "",
  qty: "",
  unitPrice: "",
  gstRate: "",
  taxAmount: 0,
  total: 0,
});

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
  const [deliveryInstructions, setDeliveryInstructions] = useState("");
  const [notes, setNotes] = useState("");

  // One blank item row by default
  const [items, setItems] = useState<OrderItem[]>([createBlankItem()]);

  // Reset form to clean state whenever modal opens
  useEffect(() => {
    if (!open) {
      setError(null);
      return;
    }

    setError(null);

    // Clean reset for new creation mode
    if (!initialData) {
      setVendorId("");
      setNotes("");
      setDeliveryInstructions("");
      setItems([createBlankItem()]);
    }

    // Load active vendors and next PO number in parallel
    Promise.all([
      getActiveVendors().catch(() => []),
      !initialData ? getNextPoNumber().catch(() => null) : Promise.resolve(null),
    ]).then(([vList, nextPoRes]) => {
      const vArr = Array.isArray(vList) ? vList : [];
      setVendors(vArr);

      if (initialData) {
        setOrderNumber(initialData.orderNumber || "");
        setVendorId(initialData.vendorId || "");
        setNotes(initialData.notes || "");
        setDeliveryInstructions(initialData.deliveryInstructions || "");

        let parsedItems = initialData.items;
        if (typeof parsedItems === "string") {
          try {
            parsedItems = JSON.parse(parsedItems);
          } catch {
            parsedItems = [];
          }
        }

        if (Array.isArray(parsedItems) && parsedItems.length > 0) {
          setItems(
            parsedItems.map((it: any) => {
              const qty = it.qty !== undefined && it.qty !== null && it.qty !== "" ? Number(it.qty) : "";
              const unitPrice = it.unitPrice !== undefined && it.unitPrice !== null && it.unitPrice !== "" ? Number(it.unitPrice) : "";
              const gstRate = it.gstRate !== undefined && it.gstRate !== null && it.gstRate !== "" ? Number(it.gstRate) : "";
              const numQty = typeof qty === "number" ? qty : 0;
              const numPrice = typeof unitPrice === "number" ? unitPrice : 0;
              const numGst = typeof gstRate === "number" ? gstRate : 0;
              const taxable = Math.max(0, numQty * numPrice);
              const taxAmount = it.taxAmount !== undefined ? Number(it.taxAmount) : Math.round(taxable * (numGst / 100));
              const total = it.total !== undefined ? Number(it.total) : taxable + taxAmount;
              return {
                name: it.name || "",
                sku: it.sku || "",
                qty,
                unitPrice,
                gstRate,
                taxAmount,
                total,
              };
            })
          );
        } else {
          setItems([createBlankItem()]);
        }
      } else {
        // Auto-assign next PO number: PO-{YY}-{MM}-{SEQUENCE}
        if (nextPoRes?.orderNumber) {
          setOrderNumber(nextPoRes.orderNumber);
        } else {
          const now = new Date();
          const yy = String(now.getFullYear()).slice(-2);
          const mm = String(now.getMonth() + 1).padStart(2, "0");
          setOrderNumber(`PO-${yy}-${mm}-001`);
        }
        setItems([createBlankItem()]);
      }
    });
  }, [open, initialData]);

  // Recalculate row when name, qty, unitPrice, or gstRate change
  const updateItemField = (index: number, field: "name" | "qty" | "unitPrice" | "gstRate", val: any) => {
    setItems((prev) => {
      const next = [...prev];
      const current = next[index] || createBlankItem();
      const updatedValue = field === "name" ? val : val === "" ? "" : Number(val);
      const row = { ...current, [field]: updatedValue };

      const numQty = typeof row.qty === "number" ? row.qty : Number(row.qty) || 0;
      const numPrice = typeof row.unitPrice === "number" ? row.unitPrice : Number(row.unitPrice) || 0;
      const numGst = typeof row.gstRate === "number" ? row.gstRate : Number(row.gstRate) || 0;

      const taxable = Math.max(0, numQty * numPrice);
      const taxAmount = Math.round(taxable * (numGst / 100));
      row.taxAmount = taxAmount;
      row.total = taxable + taxAmount;

      next[index] = row;
      return next;
    });
  };

  // Add a new blank row
  const addItem = () => {
    setItems((prev) => [...prev, createBlankItem()]);
  };

  // Remove a row
  const removeItem = (idx: number) => {
    if (items.length <= 1) {
      setItems([createBlankItem()]);
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  // Totals dynamically calculated: if no items/quantities entered, totals remain ₹0
  const subtotal = items.reduce((acc, curr) => {
    const q = typeof curr.qty === "number" ? curr.qty : Number(curr.qty) || 0;
    const p = typeof curr.unitPrice === "number" ? curr.unitPrice : Number(curr.unitPrice) || 0;
    return acc + (q * p);
  }, 0);

  const totalGst = items.reduce((acc, curr) => {
    return acc + (Number(curr.taxAmount) || 0);
  }, 0);

  const grandTotal = subtotal + totalGst;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!vendorId) {
      setError("Please select a supplier/vendor.");
      return;
    }

    if (items.length === 0 || items.every((i) => !i.name.trim())) {
      setError("Please enter at least one purchase item.");
      return;
    }

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.name.trim()) {
        setError(`Row #${i + 1}: Please enter the item name.`);
        return;
      }
      const q = typeof it.qty === "number" ? it.qty : Number(it.qty) || 0;
      if (q <= 0) {
        setError(`Row #${i + 1} (${it.name}): Quantity must be greater than 0.`);
        return;
      }
      const p = typeof it.unitPrice === "number" ? it.unitPrice : Number(it.unitPrice) || 0;
      if (p < 0) {
        setError(`Row #${i + 1} (${it.name}): Unit price cannot be negative.`);
        return;
      }
    }

    try {
      setLoading(true);

      const formattedItems = items.map((it) => ({
        name: it.name.trim(),
        sku: it.sku || "",
        qty: typeof it.qty === "number" ? it.qty : Number(it.qty) || 1,
        unitPrice: typeof it.unitPrice === "number" ? it.unitPrice : Number(it.unitPrice) || 0,
        gstRate: typeof it.gstRate === "number" ? it.gstRate : Number(it.gstRate) || 0,
        taxAmount: Number(it.taxAmount) || 0,
        total: Number(it.total) || 0,
      }));

      const payload = {
        orderNumber,
        vendorId,
        items: formattedItems,
        subtotal,
        taxAmount: totalGst,
        discount: 0,
        totalAmount: grandTotal,
        deliveryInstructions,
        notes,
      };

      if (initialData) {
        await updatePurchaseOrder(initialData.id, payload);
        toast.success("Purchase Order updated successfully!");
      } else {
        await createPurchase(payload);
        toast.success("Purchase Order created successfully!");
      }
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      console.error("Failed to save PO:", err);
      setError(err.message || "Failed to save Purchase Order");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-2xl bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/80">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-black text-gray-900 tracking-tight uppercase">
              {initialData ? "Edit Purchase Order" : "Create Purchase Order"}
            </h3>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* PO Number & Vendor Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-gray-700 mb-1">
                Purchase Order Number
              </label>
              <input
                type="text"
                required
                readOnly
                value={orderNumber}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-gray-50 font-mono font-bold text-gray-900 cursor-not-allowed select-all"
                title="Automatically generated sequential PO Number"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">
                Supplier / Vendor <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="">Select Vendor ▼</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} {v.code ? `(${v.code})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* PURCHASE ITEMS */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-900 uppercase tracking-wider text-[11px]">
                PURCHASE ITEMS
              </span>
              <button
                type="button"
                onClick={addItem}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Item
              </button>
            </div>

            {/* Table layout: ITEM NAME | QTY | UNIT PRICE | GST | TOTAL */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold text-[10px] uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Item Name</th>
                    <th className="py-2.5 px-2 w-20 text-right">Qty</th>
                    <th className="py-2.5 px-2 w-28 text-right">Unit Price</th>
                    <th className="py-2.5 px-2 w-24 text-right">GST</th>
                    <th className="py-2.5 px-3 w-28 text-right">Total</th>
                    <th className="py-2.5 px-2 w-8 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      {/* Item Name: Normal text input where user manually types the item name */}
                      <td className="p-2">
                        <input
                          type="text"
                          required
                          placeholder="e.g. Brake Pads"
                          value={row.name}
                          onChange={(e) => updateItemField(idx, "name", e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </td>

                      {/* Qty */}
                      <td className="p-2">
                        <input
                          type="number"
                          min="1"
                          placeholder="0"
                          value={row.qty}
                          onChange={(e) => updateItemField(idx, "qty", e.target.value === "" ? "" : Math.max(0, parseInt(e.target.value, 10)))}
                          className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs text-right font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </td>

                      {/* Unit Price */}
                      <td className="p-2">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₹</span>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            placeholder="0"
                            value={row.unitPrice}
                            onChange={(e) => updateItemField(idx, "unitPrice", e.target.value === "" ? "" : Math.max(0, parseFloat(e.target.value)))}
                            className="w-full pl-5 pr-2 py-1.5 border border-gray-200 rounded-lg text-xs text-right font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                      </td>

                      {/* GST */}
                      <td className="p-2">
                        <select
                          value={row.gstRate}
                          onChange={(e) => updateItemField(idx, "gstRate", e.target.value === "" ? "" : Number(e.target.value))}
                          className="w-full px-1.5 py-1.5 border border-gray-200 rounded-lg text-xs text-right bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                          <option value="">Select GST ▼</option>
                          <option value={0}>0%</option>
                          <option value={5}>5%</option>
                          <option value={12}>12%</option>
                          <option value={18}>18%</option>
                          <option value={28}>28%</option>
                        </select>
                      </td>

                      {/* Total */}
                      <td className="p-2 text-right font-bold text-gray-900 font-mono">
                        ₹{row.total.toLocaleString("en-IN")}
                      </td>

                      {/* Delete */}
                      <td className="p-2 text-center">
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            className="text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Delivery Instructions & Order Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-gray-700 mb-1">Delivery Instructions</label>
              <input
                type="text"
                placeholder="Optional..."
                value={deliveryInstructions}
                onChange={(e) => setDeliveryInstructions(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-700 mb-1">Order Notes</label>
              <input
                type="text"
                placeholder="Optional..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
              />
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Total Summary Section (Aligned to the Right) */}
          <div className="flex justify-end">
            <div className="w-64 space-y-1.5 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-semibold text-gray-900 font-mono">
                  ₹{subtotal.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>GST</span>
                <span className="font-semibold text-gray-900 font-mono">
                  ₹{totalGst.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-1.5 flex justify-between text-sm font-black text-gray-900">
                <span>Grand Total</span>
                <span className="font-mono text-emerald-700">
                  ₹{grandTotal.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              {loading ? "Processing..." : initialData ? "Update Purchase Order" : "Create Purchase Order"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
