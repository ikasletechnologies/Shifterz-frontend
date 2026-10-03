"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect } from "react";
import {
  FileText,
  Eye,
  Printer,
  Search,
  CheckCircle2,
  Clock,
  RefreshCw,
  Building2,
  Package,
} from "lucide-react";
import { getPurchases } from "@/lib/api";

interface PurchaseOrderFlowSectionProps {
  onOpenInvoiceModal: (poId: string, invoiceId?: string, mode?: "create" | "view") => void;
  refreshKey?: number;
  highlightPo?: string | null;
}

export function PurchaseOrderFlowSection({
  onOpenInvoiceModal,
  refreshKey,
  highlightPo,
}: PurchaseOrderFlowSectionProps) {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getPurchases();
      setPurchases(data || []);
    } catch (err) {
      console.error("Failed to load purchase orders for billing:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [refreshKey]);

  const parseItems = (itemsStr: any) => {
    try {
      if (Array.isArray(itemsStr)) return itemsStr;
      const parsed = JSON.parse(itemsStr);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const filtered = purchases.filter((po) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      po.orderNumber?.toLowerCase().includes(q) ||
      po.vendorName?.toLowerCase().includes(q) ||
      po.vendorCode?.toLowerCase().includes(q) ||
      po.invoiceNumber?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Header and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 pb-1 border-b border-gray-200/80">
        <div>
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-600" />
            Purchase Invoices (PO Invoices)
          </h3>
          <p className="text-xs text-gray-500">
            Supplier purchase invoices generated from the Purchase Order lifecycle
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search PO #, vendor, invoice..."
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>
          <button
            onClick={loadData}
            className="p-1.5 text-gray-500 hover:text-gray-900 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
            title="Refresh Invoices"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div className="py-12 text-center text-gray-400 text-xs">
          Loading purchase invoices...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-400 text-xs">
          No purchase invoices found.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((po) => {
            const isPaid = po.stage === "PAID" || po.invoice?.status === "Paid";
            const invoiceId = po.invoiceId || po.invoice?.id || po.id;
            const invoiceNumber = po.invoiceNumber || po.invoice?.invoiceNumber || (isPaid ? `INV-${po.orderNumber}` : "INV-PENDING");

            const items = parseItems(po.items);
            const totalQty = items.reduce((acc: number, it: any) => acc + (Number(it.qty) || 0), 0);

            const total = Number(po.totalAmount) || 0;
            const paid = Number(po.paidAmount || (isPaid ? total : 0));
            const pending = Math.max(0, total - paid);
            const subtotal = Number(po.subtotal || (total - (Number(po.taxAmount) || 0)));
            const gst = Number(po.taxAmount) || 0;

            const invoiceDateStr = po.invoicedAt || po.invoice?.invoiceDate || po.createdAt;
            const formattedInvoiceDate = invoiceDateStr
              ? new Date(invoiceDateStr).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "—";

            const isHighlighted = highlightPo && (po.orderNumber === highlightPo || po.invoiceNumber === highlightPo);

            return (
              <div
                key={po.id}
                className={`bg-white rounded-xl border transition-all p-4 flex flex-col justify-between gap-3 text-xs shadow-xs hover:shadow-md ${
                  isHighlighted
                    ? "border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-50/10"
                    : "border-gray-200/90 hover:border-purple-300"
                }`}
              >
                {/* 1. Header: Invoice Number + PO Number + Payment Status */}
                <div className="flex items-start justify-between gap-2 border-b border-gray-100 pb-2.5">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-xs font-black text-purple-900 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                        {invoiceNumber}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-gray-500 font-semibold">
                      PO: <span className="text-gray-800">{po.orderNumber}</span>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full inline-flex items-center gap-1 shrink-0 ${
                      isPaid
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {isPaid ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Clock className="w-3 h-3 text-amber-600" />}
                    {isPaid ? "Paid" : "Pending"}
                  </span>
                </div>

                {/* 2. Vendor Name / Vendor ID */}
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-gray-900 font-bold text-xs truncate">
                    <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="truncate">{po.vendorName || "Supplier"}</span>
                  </div>
                  <div className="text-[11px] font-mono text-gray-400 pl-5">
                    ID: {po.vendorCode || po.vendorId || "VND-REF"}
                  </div>
                </div>

                {/* 3. Invoice Date */}
                <div className="flex justify-between text-[11px] text-gray-500 bg-gray-50/80 px-2.5 py-1 rounded-lg">
                  <span>Invoice Date:</span>
                  <span className="font-semibold text-gray-700">{formattedInvoiceDate}</span>
                </div>

                {/* 4. Item(s) & Quantity */}
                <div className="space-y-1 bg-gray-50/50 p-2 rounded-lg border border-gray-100 text-[11px]">
                  <div className="flex items-center justify-between font-semibold text-gray-700">
                    <span className="flex items-center gap-1">
                      <Package className="w-3 h-3 text-gray-400" />
                      Items ({items.length})
                    </span>
                    <span className="text-gray-500 font-normal">Qty: {totalQty}</span>
                  </div>
                  <div className="text-[11px] text-gray-600 truncate">
                    {items.map((it: any) => `${it.qty}x ${it.name}`).join(", ") || "Purchase items"}
                  </div>
                </div>

                {/* 5. Subtotal, GST, Grand Total, Paid & Pending */}
                <div className="space-y-1 border-t border-gray-100 pt-2 text-[11px] text-gray-600">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-medium text-gray-800">₹{subtotal.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST (Tax):</span>
                    <span className="font-medium text-gray-800">₹{gst.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between font-bold text-gray-900 text-xs pt-0.5 border-t border-gray-100">
                    <span>Grand Total:</span>
                    <span className="text-purple-900">₹{total.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-semibold pt-1">
                    <span>Paid Amount:</span>
                    <span>₹{paid.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Pending Amount:</span>
                    <span className={pending > 0 ? "text-amber-600 font-semibold" : "text-gray-500"}>
                      ₹{pending.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* 6. Action Buttons: [ View Invoice ] [ Print ] */}
                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => onOpenInvoiceModal(po.id, invoiceId, "view")}
                    className="flex-1 py-1.5 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 hover:border-purple-300 rounded-lg border border-purple-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View Invoice
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onOpenInvoiceModal(po.id, invoiceId, "view");
                      setTimeout(() => window.print(), 350);
                    }}
                    className="py-1.5 px-3 text-xs font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    title="Print Invoice"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
