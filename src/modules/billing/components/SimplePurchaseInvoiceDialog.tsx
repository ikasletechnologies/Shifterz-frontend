"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect } from "react";
import {
  FileText,
  Printer,
  X,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  Save,
  Eye,
  Clock,
} from "lucide-react";
import { getPurchaseOrderById, getPurchaseInvoiceById, createPurchaseInvoice } from "@/lib/api";
import { toast } from "react-hot-toast";

interface SimplePurchaseInvoiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrderId?: string | null;
  invoiceId?: string | null;
  mode?: "create" | "view";
  onSuccess?: () => void;
}

export function SimplePurchaseInvoiceDialog({
  isOpen,
  onClose,
  purchaseOrderId,
  invoiceId,
  mode = "view",
  onSuccess,
}: SimplePurchaseInvoiceDialogProps) {
  const [currentMode, setCurrentMode] = useState<"create" | "view">(mode);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [poData, setPoData] = useState<any | null>(null);
  const [invoiceData, setInvoiceData] = useState<any | null>(null);

  // Editable fields for create mode
  const [invoiceNo, setInvoiceNo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  });
  const [notes, setNotes] = useState("");

  useEffect(() => {
    setCurrentMode(mode);
  }, [mode]);

  useEffect(() => {
    if (!isOpen) {
      setPoData(null);
      setInvoiceData(null);
      return;
    }

    async function loadData() {
      try {
        setLoading(true);
        if (invoiceId) {
          const inv = await getPurchaseInvoiceById(invoiceId);
          setInvoiceData(inv);
          if (inv?.purchaseOrder) {
            setPoData(inv.purchaseOrder);
          }
          setCurrentMode("view");
        } else if (purchaseOrderId) {
          const po = await getPurchaseOrderById(purchaseOrderId);
          setPoData(po);
          setInvoiceNo(po?.invoiceNumber || `INV-${po?.orderNumber || "PO"}`);
          if (po?.deliveryInstructions) {
            setNotes(po.deliveryInstructions);
          }

          if (po?.hasInvoice || po?.invoiceId || po?.stage === "INVOICED" || po?.stage === "PAID") {
            if (po.invoiceId) {
              const inv = await getPurchaseInvoiceById(po.invoiceId);
              setInvoiceData(inv);
            }
          }
        }
      } catch (err: any) {
        console.error("Failed to load invoice/PO data:", err);
        toast.error(err.message || "Failed to load Purchase Order details");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [isOpen, purchaseOrderId, invoiceId]);

  if (!isOpen) return null;

  const vendor = invoiceData?.vendor || poData?.vendor || {
    name: poData?.vendorName || "Supplier",
    code: poData?.vendorCode || "",
    phone: "",
    email: "",
    address: "",
  };

  const parsedItems: any[] = (() => {
    const source = invoiceData?.items || poData?.items;
    if (!source) return [];
    try {
      return typeof source === "string" ? JSON.parse(source) : source;
    } catch {
      return [];
    }
  })();

  const poNumber = poData?.orderNumber || invoiceData?.purchaseOrder?.orderNumber || "PO-REF";
  const subtotal = Number(invoiceData?.subtotal ?? (poData?.subtotal || poData?.totalAmount || 0));
  const discount = Number(invoiceData?.discount ?? (poData?.discount || 0));
  const tax = Number(invoiceData?.tax ?? (poData?.taxAmount || 0));
  const grandTotal = Number(invoiceData?.total ?? (poData?.totalAmount || 0));

  const isAlreadyInvoiced = Boolean(
    invoiceData || poData?.hasInvoice || poData?.stage === "INVOICED" || poData?.stage === "PAID"
  );

  const paymentStatus = (() => {
    if (invoiceData?.status) return invoiceData.status;
    if (poData?.stage === "PAID") return "Paid";
    if (poData?.paidAmount && poData.paidAmount > 0) return "Partially Paid";
    return "Pending";
  })();

  const receiptDateFormatted = poData?.receivedAt
    ? new Date(poData.receivedAt).toLocaleDateString("en-IN")
    : poData?.stage === "RECEIVED" || poData?.stage === "INVOICED" || poData?.stage === "PAID"
    ? "Goods Received"
    : "Pending Receipt";

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poData) return;

    if (!invoiceNo.trim()) {
      toast.error("Please enter an Invoice Number");
      return;
    }

    try {
      setSubmitting(true);
      const res = await createPurchaseInvoice({
        purchaseOrderId: poData.id,
        invoiceNumber: invoiceNo.trim(),
        invoiceDate,
        dueDate,
        paymentTerms: "Net 30",
        notes,
      });

      toast.success(`Purchase Invoice ${res.invoiceNumber || invoiceNo} created successfully!`);
      setInvoiceData(res);
      setCurrentMode("view");
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error("Failed to create purchase invoice:", err);
      toast.error(err.message || "Failed to create invoice");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-2xl bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Bar (Screen Only) */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-gray-100 bg-gray-50/80 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            <h3 className="text-sm font-bold text-gray-900">
              {currentMode === "create" ? "Create Purchase Invoice" : "Purchase Invoice"}
            </h3>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-700 font-bold">
              {poNumber}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {currentMode === "view" && (
              <button
                type="button"
                onClick={handlePrint}
                className="px-3 py-1.5 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors flex items-center gap-1.5 shadow-2xs"
                title="Print Invoice"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Invoice
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="py-16 text-center text-gray-500 space-y-2">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-medium">Fetching Purchase Order & Invoice details...</p>
            </div>
          ) : (
            <>
              {/* Duplicate Notice */}
              {currentMode === "create" && isAlreadyInvoiced && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-800">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      <strong>Invoice Already Created:</strong> This Purchase Order already has an invoice linked (
                      {invoiceData?.invoiceNumber || poData?.invoiceNumber || "Attached"}).
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentMode("view")}
                    className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs shrink-0 transition-colors flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View Invoice
                  </button>
                </div>
              )}

              {/* ══════════════════════════════════════════════════════════
                  SIMPLE PURCHASE INVOICE TEMPLATE
                  Matches Section 5 of Prompt
              ══════════════════════════════════════════════════════════ */}
              <div
                id="simple-purchase-invoice-print"
                className="bg-white border border-gray-200 rounded-xl p-6 font-mono text-xs text-gray-800 space-y-4 shadow-2xs print:border-none print:shadow-none print:p-0"
              >
                {/* Header */}
                <div className="text-center pb-3 border-b border-dashed border-gray-300 space-y-0.5">
                  <div className="text-base font-black tracking-wider text-gray-900">
                    SHIFTERS ERP
                  </div>
                  <div className="text-xs font-bold uppercase tracking-widest text-purple-700">
                    PURCHASE INVOICE
                  </div>
                </div>

                {/* Invoice Meta */}
                <div className="grid grid-cols-2 gap-4 pb-3 border-b border-dashed border-gray-300">
                  <div className="space-y-1">
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-bold">Invoice No:</span>
                      <strong className="text-gray-900 font-bold text-sm">
                        {currentMode === "view"
                          ? invoiceData?.invoiceNumber || poData?.invoiceNumber || invoiceNo
                          : invoiceNo || "Auto-Generated"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-bold">PO No:</span>
                      <strong className="text-blue-700">{poNumber}</strong>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-bold">Invoice Date:</span>
                      <strong className="text-gray-900">
                        {invoiceData?.invoiceDate
                          ? new Date(invoiceData.invoiceDate).toLocaleDateString("en-IN")
                          : new Date(invoiceDate).toLocaleDateString("en-IN")}
                      </strong>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-bold">Payment Status:</span>
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          paymentStatus === "Paid"
                            ? "bg-emerald-100 text-emerald-800"
                            : paymentStatus === "Partially Paid"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {paymentStatus}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Supplier Section */}
                <div className="pb-3 border-b border-dashed border-gray-300 space-y-1">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">SUPPLIER</div>
                  <div className="text-sm font-bold text-gray-900">{vendor.name}</div>
                  <div className="text-[11px] text-gray-500">
                    Vendor ID: <span className="font-bold text-gray-700">{vendor.code || "VND-REF"}</span>
                  </div>
                  {(vendor.phone || vendor.email) && (
                    <div className="text-[11px] text-gray-600">
                      {[vendor.phone, vendor.email].filter(Boolean).join(" | ")}
                    </div>
                  )}
                  {vendor.address && <div className="text-[11px] text-gray-600">{vendor.address}</div>}
                  {vendor.gstNumber && (
                    <div className="text-[11px] text-gray-700 font-semibold">
                      GSTIN: {vendor.gstNumber}
                    </div>
                  )}
                </div>

                {/* Items Table */}
                <div className="overflow-x-auto pb-3 border-b border-dashed border-gray-300">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-500 text-[10px] uppercase font-bold">
                        <th className="py-1.5 px-2">Item</th>
                        <th className="py-1.5 px-2">SKU</th>
                        <th className="py-1.5 px-2 text-right">Qty</th>
                        <th className="py-1.5 px-2 text-right">Unit Price</th>
                        <th className="py-1.5 px-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {parsedItems.map((it: any, idx: number) => {
                        const qty = Number(it.qty) || 0;
                        const unitPrice = Number(it.unitPrice) || 0;
                        const lineTotal = Number(it.total) || qty * unitPrice;
                        return (
                          <tr key={idx}>
                            <td className="py-1.5 px-2 font-medium text-gray-900">{it.name}</td>
                            <td className="py-1.5 px-2 text-gray-500">{it.sku || "—"}</td>
                            <td className="py-1.5 px-2 text-right font-bold">{qty}</td>
                            <td className="py-1.5 px-2 text-right">₹{unitPrice.toLocaleString("en-IN")}</td>
                            <td className="py-1.5 px-2 text-right font-bold text-gray-900">
                              ₹{lineTotal.toLocaleString("en-IN")}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Summary */}
                <div className="flex justify-end pb-3 border-b border-dashed border-gray-300">
                  <div className="w-56 space-y-1 text-right">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Subtotal:</span>
                      <strong className="text-gray-900">₹{subtotal.toLocaleString("en-IN")}</strong>
                    </div>
                    {tax > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Tax:</span>
                        <span>+₹{tax.toLocaleString("en-IN")}</span>
                      </div>
                    )}
                    {discount > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Discount:</span>
                        <span>-₹{discount.toLocaleString("en-IN")}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-bold text-gray-900 pt-1 border-t border-gray-200">
                      <span>Grand Total:</span>
                      <span className="text-purple-700 font-black">₹{grandTotal.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {(notes || invoiceData?.notes || poData?.deliveryInstructions) && (
                  <div className="text-[11px] text-gray-600 space-y-0.5 pb-2">
                    <span className="font-bold text-gray-700 block">Notes:</span>
                    <p>{invoiceData?.notes || notes || poData?.deliveryInstructions}</p>
                  </div>
                )}

                {/* Footer */}
                <div className="pt-2 text-[10px] text-gray-500 space-y-1 border-t border-dashed border-gray-200">
                  <div className="flex justify-between">
                    <span>Linked Purchase Order:</span>
                    <strong className="font-bold text-gray-800">{poNumber}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Linked Purchase Receipt:</span>
                    <strong className="font-bold text-emerald-700">
                      {poData?.stage === "RECEIVED" || poData?.stage === "INVOICED" || poData?.stage === "PAID"
                        ? `Goods Received (${receiptDateFormatted})`
                        : "Waiting for Receipt"}
                    </strong>
                  </div>
                  <div className="pt-2 text-center text-gray-400 font-bold tracking-widest text-[9px]">
                    SHIFTERS ERP
                  </div>
                </div>
              </div>

              {/* Editable Fields Form (Only in Create Mode and when NOT already invoiced) */}
              {currentMode === "create" && !isAlreadyInvoiced && (
                <form onSubmit={handleCreateInvoice} className="space-y-3 pt-2 print:hidden">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">
                        Invoice Number <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={invoiceNo}
                        onChange={(e) => setInvoiceNo(e.target.value)}
                        placeholder="INV-PO-2026-XXXX"
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Invoice Date</label>
                      <input
                        type="date"
                        required
                        value={invoiceDate}
                        onChange={(e) => setInvoiceDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  <div className="text-xs">
                    <label className="block font-bold text-gray-700 mb-1">Notes / Instructions</label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Optional remarks..."
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:bg-gray-200 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {submitting ? "Saving Invoice..." : "Save & Create Invoice"}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
