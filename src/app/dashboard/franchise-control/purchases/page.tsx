"use client";
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any */

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  getVendors,
  deleteVendor,
  getPurchases,
  receivePurchaseGoods,
  payPurchaseOrder,
  deletePurchaseOrder,
} from "@/lib/api";
import { AddVendorDialog } from "@/components/vendors/AddVendorDialog";
import { CreatePurchaseOrderDialog } from "@/components/purchases/CreatePurchaseOrderDialog";
import { SimplePurchaseInvoiceDialog } from "@/modules/billing/components/SimplePurchaseInvoiceDialog";
import { usePermissions } from "@/lib/permissions";
import { ViewSwitcher } from "@/components/common/ViewSwitcher";
import {
  Building2,
  ShoppingCart,
  Plus,
  Search,
  CheckCircle2,
  PackageCheck,
  FileText,
  CreditCard,
  Trash2,
  Edit2,
  Eye,
  AlertCircle,
  Clock,
  X,
  Receipt,
  Calendar,
  Layers,
} from "lucide-react";

export default function PurchaseManagementPage() {
  const [activeTab, setActiveTab] = useState<"purchases" | "vendors">("purchases");
  const [viewMode, setViewMode] = useState<"tabs" | "table">("tabs");
  const [selectedStatusTab, setSelectedStatusTab] = useState<"ALL" | "PENDING_RECEIPT" | "GOODS_RECEIVED" | "PAID">("ALL");

  const [vendors, setVendors] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Dialog states
  const [vendorDialogOpen, setVendorDialogOpen] = useState(false);
  const [vendorToEdit, setVendorToEdit] = useState<any | null>(null);
  const [poDialogOpen, setPoDialogOpen] = useState(false);
  const [editPoData, setEditPoData] = useState<any | null>(null);

  // View PO Dialog state
  const [viewPoData, setViewPoData] = useState<any | null>(null);

  // In-page Purchase Invoice Dialog state
  const [invoiceModalPoId, setInvoiceModalPoId] = useState<string | null>(null);
  const [invoiceModalInvoiceId, setInvoiceModalInvoiceId] = useState<string | null>(null);

  const { role, isSuperAdmin, canAccess } = usePermissions();
  const isInventoryExecutive = role === "INVENTORY_EXECUTIVE" || role === "INVENTORY";

  // Custom Application Modals (Replacing browser confirm popups)
  const [receiptModalPo, setReceiptModalPo] = useState<any | null>(null);
  const [receivedQuantities, setReceivedQuantities] = useState<number[]>([]);

  const [paymentModalPo, setPaymentModalPo] = useState<any | null>(null);
  const [deletePoModal, setDeletePoModal] = useState<any | null>(null);
  const [deleteVendorModal, setDeleteVendorModal] = useState<any | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [vData, pData] = await Promise.all([getVendors(), getPurchases()]);
      setVendors(vData || []);
      setPurchases(pData || []);
    } catch (err) {
      console.error("Failed to load purchase management data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const formatDate = (dateStr?: string | Date) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const parseItems = (itemsStr: string | any) => {
    try {
      if (Array.isArray(itemsStr)) return itemsStr;
      const arr = JSON.parse(itemsStr);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  };

  const formatLineItemsText = (items: any[]) => {
    if (!items || items.length === 0) return "—";
    return items.map((i) => `${i.name || "Item"} × ${i.qty || 1}`).join(", ");
  };

  // Vendor handlers
  const handleEditVendor = (vendor: any) => {
    setVendorToEdit(vendor);
    setVendorDialogOpen(true);
  };

  const submitDeleteVendor = async () => {
    if (!deleteVendorModal) return;
    try {
      setActionLoading(true);
      await deleteVendor(deleteVendorModal.id);
      showToast(`Vendor "${deleteVendorModal.name}" deactivated successfully.`);
      setDeleteVendorModal(null);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to deactivate vendor");
    } finally {
      setActionLoading(false);
    }
  };

  // Step 2: Confirm Goods Received Modal
  const handleOpenReceiveModal = (po: any) => {
    const items = parseItems(po.items);
    setReceiptModalPo(po);
    setReceivedQuantities(items.map((it: any) => Number(it.qty) || 1));
  };

  const submitConfirmGoodsReceived = async () => {
    if (!receiptModalPo) return;
    try {
      setActionLoading(true);
      await receivePurchaseGoods(receiptModalPo.id);
      showToast(`Goods received for ${receiptModalPo.orderNumber}! HQ Inventory updated.`);
      setReceiptModalPo(null);
      await loadData();
    } catch (err: any) {
      console.error("Failed to process goods receipt:", err);
      alert(err.message || "Failed to process goods receipt");
    } finally {
      setActionLoading(false);
    }
  };

  // Step 3: Confirm Payment Modal
  const handleOpenPaymentModal = (po: any) => {
    setPaymentModalPo(po);
  };

  const submitConfirmPayment = async () => {
    if (!paymentModalPo) return;
    try {
      setActionLoading(true);
      await payPurchaseOrder(paymentModalPo.id, paymentModalPo.totalAmount);
      showToast(`Payment confirmed & Purchase Invoice generated for ${paymentModalPo.orderNumber}!`);
      setPaymentModalPo(null);
      await loadData();
    } catch (err: any) {
      console.error("Failed to confirm payment:", err);
      alert(err.message || "Failed to confirm payment");
    } finally {
      setActionLoading(false);
    }
  };

  // Delete PO Modal
  const submitDeletePo = async () => {
    if (!deletePoModal) return;
    try {
      setActionLoading(true);
      await deletePurchaseOrder(deletePoModal.id);
      showToast(`Purchase Order ${deletePoModal.orderNumber} deleted.`);
      setDeletePoModal(null);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to delete PO");
    } finally {
      setActionLoading(false);
    }
  };

  // Dynamic Status Counts (Authoritative, strictly computed from data)
  const countAll = purchases.length;
  const countPendingReceipt = purchases.filter(
    (po) =>
      po.stage === "PO_CREATED" ||
      po.stage === "ORDERED" ||
      po.stage === "REQUESTED" ||
      (!po.receivedAt && po.stage !== "PAID" && po.stage !== "GOODS_RECEIVED" && po.stage !== "RECEIVED")
  ).length;

  const countGoodsReceived = purchases.filter(
    (po) =>
      (po.stage === "GOODS_RECEIVED" || po.stage === "RECEIVED" || !!po.receivedAt) &&
      po.stage !== "PAID"
  ).length;

  const countPaid = purchases.filter((po) => po.stage === "PAID").length;

  // Filtered Purchases
  const filteredPurchases = purchases.filter((p) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      p.orderNumber?.toLowerCase().includes(q) ||
      p.vendorName?.toLowerCase().includes(q) ||
      p.vendorCode?.toLowerCase().includes(q) ||
      p.invoiceNumber?.toLowerCase().includes(q) ||
      p.createdBy?.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (viewMode === "tabs") {
      const isPaid = p.stage === "PAID";
      const isGoodsReceived = !isPaid && (p.stage === "GOODS_RECEIVED" || p.stage === "RECEIVED" || !!p.receivedAt);
      const isPoCreated = !isPaid && !isGoodsReceived;

      if (selectedStatusTab === "PENDING_RECEIPT") return isPoCreated;
      if (selectedStatusTab === "GOODS_RECEIVED") return isGoodsReceived;
      if (selectedStatusTab === "PAID") return isPaid;
    }

    return true;
  });

  const filteredVendors = vendors.filter(
    (v) =>
      v.name?.toLowerCase().includes(search.toLowerCase()) ||
      v.code?.toLowerCase().includes(search.toLowerCase()) ||
      v.gstNumber?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 sm:p-8 space-y-5 text-gray-900 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-emerald-600 text-white rounded-xl shadow-lg animate-in fade-in slide-in-from-top-5">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-gray-200/80 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wider">
              Procurement & Supply Chain
            </span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
            <ShoppingCart className="w-7 h-7 text-emerald-600" />
            {isInventoryExecutive ? "Purchase Orders" : "Vendor & Purchase Management"}
          </h1>
          <p className="text-xs text-gray-500 font-medium">
            {isInventoryExecutive
              ? "Manage centralized purchase orders, goods receipts, and track procurement updates."
              : "Manage purchase orders, goods receipts, supplier payments, and integrated billing documents."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {!isInventoryExecutive && canAccess("billing") && (
            <Link
              href="/dashboard/billing"
              className="px-4 py-2.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-bold transition-all shadow-xs flex items-center gap-2"
            >
              <Receipt className="w-4 h-4 text-purple-600" />
              Billing & Invoices
            </Link>
          )}
          {activeTab === "purchases" ? (
            <button
              onClick={() => {
                setEditPoData(null);
                setPoDialogOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Create Purchase Order
            </button>
          ) : isSuperAdmin ? (
            <button
              onClick={() => {
                setVendorToEdit(null);
                setVendorDialogOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Vendor
            </button>
          ) : null}
        </div>
      </div>

      {/* Main Module Tabs (Purchase Orders vs Vendor Directory) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3 bg-white border border-gray-200/80 rounded-2xl shadow-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab("purchases")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "purchases"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            Purchase Orders ({purchases.length})
          </button>
          <button
            onClick={() => setActiveTab("vendors")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "vendors"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <Building2 className="w-4 h-4" />
            Vendor Directory ({vendors.length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              activeTab === "purchases"
                ? "Search PO #, supplier, invoice..."
                : "Search vendor name, code, GST..."
            }
            className="w-full pl-10 pr-4 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-white"
          />
        </div>
      </div>

      {activeTab === "purchases" && (
        <div className="space-y-4">
          {/* SECTION 1: Status Metric Tabs (Matching Reference Inspection UI) */}
          {viewMode === "tabs" && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => setSelectedStatusTab("ALL")}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedStatusTab === "ALL"
                    ? "border-yellow-400 bg-yellow-50/25 ring-2 ring-yellow-400/40 shadow-xs"
                    : "border-gray-200/90 bg-white hover:border-gray-300 shadow-2xs"
                }`}
              >
                <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                  All Purchase Orders
                </div>
                <div className="text-2xl font-black text-gray-900">{countAll}</div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedStatusTab("PENDING_RECEIPT")}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedStatusTab === "PENDING_RECEIPT"
                    ? "border-yellow-400 bg-yellow-50/25 ring-2 ring-yellow-400/40 shadow-xs"
                    : "border-gray-200/90 bg-white hover:border-gray-300 shadow-2xs"
                }`}
              >
                <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                  Pending Receipt
                </div>
                <div className="text-2xl font-black text-amber-600">{countPendingReceipt}</div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedStatusTab("GOODS_RECEIVED")}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedStatusTab === "GOODS_RECEIVED"
                    ? "border-yellow-400 bg-yellow-50/25 ring-2 ring-yellow-400/40 shadow-xs"
                    : "border-gray-200/90 bg-white hover:border-gray-300 shadow-2xs"
                }`}
              >
                <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                  Goods Received
                </div>
                <div className="text-2xl font-black text-blue-600">{countGoodsReceived}</div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedStatusTab("PAID")}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedStatusTab === "PAID"
                    ? "border-yellow-400 bg-yellow-50/25 ring-2 ring-yellow-400/40 shadow-xs"
                    : "border-gray-200/90 bg-white hover:border-gray-300 shadow-2xs"
                }`}
              >
                <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                  Paid
                </div>
                <div className="text-2xl font-black text-emerald-600">{countPaid}</div>
              </button>
            </div>
          )}

          {/* VIEW SWITCHER: [ ▦ Tabs View ] [ ▦ Table View ] */}
          <ViewSwitcher
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            count={filteredPurchases.length}
            label={viewMode === "tabs" && selectedStatusTab !== "ALL" ? `${selectedStatusTab.toLowerCase().replace("_", " ")} orders` : "purchase orders"}
          />

          {/* SECTION 2: Responsive Table */}
          <div className="bg-white border border-gray-200/90 rounded-2xl overflow-hidden shadow-xs">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-3">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-medium">Loading procurement records...</p>
              </div>
            ) : filteredPurchases.length === 0 ? (
              <div className="py-20 text-center text-gray-500 space-y-2">
                <ShoppingCart className="w-12 h-12 mx-auto text-gray-300" />
                <p className="text-base font-bold text-gray-800">No Purchase Orders Found</p>
                <p className="text-xs text-gray-400">
                  {selectedStatusTab !== "ALL"
                    ? `No orders currently in "${selectedStatusTab.replace("_", " ")}" status.`
                    : "Click \"Create Purchase Order\" to start procurement."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50/80 text-[11px] text-gray-500 font-bold uppercase tracking-wider">
                      <th className="py-3.5 px-4">PO NUMBER</th>
                      <th className="py-3.5 px-4">DATE</th>
                      <th className="py-3.5 px-4">SUPPLIER</th>
                      <th className="py-3.5 px-4">ITEMS</th>
                      <th className="py-3.5 px-4">QUANTITY</th>
                      <th className="py-3.5 px-4">TOTAL AMOUNT</th>
                      <th className="py-3.5 px-4">STATUS</th>
                      <th className="py-3.5 px-4">CREATED BY</th>
                      <th className="py-3.5 px-4 text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {filteredPurchases.map((po) => {
                      const lineItems = parseItems(po.items);
                      const totalQty = lineItems.reduce((acc: number, it: any) => acc + (Number(it.qty) || 1), 0);

                      // Unified lifecycle states
                      const isPaid = po.stage === "PAID";
                      const isGoodsReceived = !isPaid && (po.stage === "GOODS_RECEIVED" || po.stage === "RECEIVED" || !!po.receivedAt);
                      const isPoCreated = !isPaid && !isGoodsReceived;

                      const invoiceId = po.invoiceId || po.invoice?.id || po.id;

                      const statusText = isPaid
                        ? "PAID"
                        : isGoodsReceived
                        ? "GOODS RECEIVED"
                        : "PO CREATED";

                      return (
                        <tr key={po.id} className="hover:bg-gray-50/70 transition-colors">
                          {/* PO NUMBER */}
                          <td className="py-3.5 px-4 font-mono font-bold text-emerald-700 whitespace-nowrap">
                            <button
                              onClick={() => setViewPoData(po)}
                              className="hover:underline flex items-center gap-1 text-left cursor-pointer"
                              title="View Purchase Order Details"
                            >
                              {po.orderNumber}
                            </button>
                          </td>

                          {/* DATE */}
                          <td className="py-3.5 px-4 text-gray-600 whitespace-nowrap">
                            {formatDate(po.createdAt)}
                          </td>

                          {/* SUPPLIER */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-gray-900">{po.vendorName}</div>
                            {po.vendorCode && (
                              <div className="text-[10px] font-mono text-gray-400">
                                {po.vendorCode}
                              </div>
                            )}
                          </td>

                          {/* ITEMS */}
                          <td className="py-3.5 px-4">
                            <div className="text-gray-900 font-medium max-w-xs truncate" title={formatLineItemsText(lineItems)}>
                              {lineItems.map((i: any) => i.name || "Item").join(", ") || "—"}
                            </div>
                          </td>

                          {/* QUANTITY */}
                          <td className="py-3.5 px-4 whitespace-nowrap text-gray-800">
                            <span className="font-bold text-gray-900">{totalQty}</span> units
                          </td>

                          {/* TOTAL AMOUNT */}
                          <td className="py-3.5 px-4 font-bold text-gray-900 whitespace-nowrap">
                            ₹{Number(po.totalAmount).toLocaleString("en-IN")}
                          </td>

                          {/* STATUS */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className={`px-2.5 py-1 text-[11px] rounded-full font-bold inline-flex items-center gap-1.5 ${
                                isPaid
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : isGoodsReceived
                                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}
                            >
                              {isPaid && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                              {isGoodsReceived && <PackageCheck className="w-3.5 h-3.5 text-blue-600" />}
                              {isPoCreated && <Clock className="w-3.5 h-3.5 text-amber-600" />}
                              {statusText}
                            </span>
                          </td>

                          {/* CREATED BY */}
                          <td className="py-3.5 px-4 text-gray-500 whitespace-nowrap">
                            {po.createdBy || "superadmin"}
                          </td>

                          {/* ACTIONS */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* PO_CREATED: [ Confirm Goods Received ] */}
                              {isPoCreated && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenReceiveModal(po)}
                                  className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                                  title="Confirm Goods Received and update HQ inventory stock"
                                >
                                  <PackageCheck className="w-3.5 h-3.5" />
                                  Confirm Goods Received
                                </button>
                              )}

                              {/* GOODS_RECEIVED: [ Confirm Payment ] */}
                              {isGoodsReceived && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenPaymentModal(po)}
                                  className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                                  title="Record payment and generate Purchase Invoice"
                                >
                                  <CreditCard className="w-3.5 h-3.5" />
                                  Confirm Payment
                                </button>
                              )}

                              {/* PAID: [ View Invoice ] [ View ] */}
                              {isPaid && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setInvoiceModalPoId(po.id);
                                      setInvoiceModalInvoiceId(invoiceId || po.invoiceId || null);
                                    }}
                                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                                    title="View Purchase Invoice document"
                                  >
                                    <FileText className="w-3.5 h-3.5 text-purple-600" />
                                    View Invoice
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setViewPoData(po)}
                                    className="px-2.5 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                    title="View Purchase Order Details"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-gray-500" />
                                    View
                                  </button>
                                </>
                              )}

                              {/* Auxiliary View details for PO_CREATED / GOODS_RECEIVED */}
                              {!isPaid && (
                                <button
                                  type="button"
                                  onClick={() => setViewPoData(po)}
                                  className="p-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-900 border border-gray-200 transition-colors cursor-pointer"
                                  title="View Purchase Order Details"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Edit only before goods received */}
                              {isPoCreated && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditPoData(po);
                                    setPoDialogOpen(true);
                                  }}
                                  className="p-1.5 rounded-lg bg-gray-50 hover:bg-amber-50 text-gray-500 hover:text-amber-700 border border-gray-200 transition-colors cursor-pointer"
                                  title="Edit Purchase Order"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Delete only before paid and if Super Admin */}
                              {!isPaid && isSuperAdmin && (
                                <button
                                  type="button"
                                  onClick={() => setDeletePoModal(po)}
                                  className="p-1.5 rounded-lg bg-gray-50 hover:bg-rose-50 text-gray-400 hover:text-rose-600 border border-gray-200 transition-colors cursor-pointer"
                                  title="Delete Purchase Order"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VENDOR DIRECTORY TAB */}
      {activeTab === "vendors" && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
          {filteredVendors.length === 0 ? (
            <div className="py-20 text-center text-gray-500 space-y-2">
              <Building2 className="w-12 h-12 mx-auto text-gray-300" />
              <p className="text-base font-bold text-gray-800">No Suppliers (Vendors) Found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-gray-500 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Vendor Code</th>
                    <th className="py-3 px-4">Vendor Name</th>
                    <th className="py-3 px-4">GST Number</th>
                    <th className="py-3 px-4">Contact & Mobile</th>
                    <th className="py-3 px-4">Email & Address</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredVendors.map((vendor) => (
                    <tr key={vendor.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                        {vendor.code}
                      </td>
                      <td className="py-3 px-4 font-bold text-gray-900">
                        {vendor.name}
                      </td>
                      <td className="py-3 px-4 font-mono uppercase font-semibold text-gray-600">
                        {vendor.gstNumber || "N/A"}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-gray-900 font-bold">{vendor.contact || "N/A"}</div>
                        <div className="text-gray-500">{vendor.phone}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-gray-800 font-medium">{vendor.email || "N/A"}</div>
                        <div className="text-gray-500 truncate max-w-xs">{vendor.address}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-1 text-[11px] rounded-full font-bold inline-flex items-center gap-1 ${
                            vendor.status === "Active"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-gray-100 text-gray-500 border border-gray-200"
                          }`}
                        >
                          {vendor.status === "Active" && <CheckCircle2 className="w-3 h-3" />}
                          {vendor.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isSuperAdmin ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleEditVendor(vendor)}
                              className="p-1.5 rounded-lg bg-gray-50 hover:bg-amber-50 text-gray-600 hover:text-amber-700 border border-gray-200 transition-colors cursor-pointer"
                              title="Edit Vendor"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteVendorModal(vendor)}
                              className="p-1.5 rounded-lg bg-gray-50 hover:bg-rose-50 text-gray-400 hover:text-rose-600 border border-gray-200 transition-colors cursor-pointer"
                              title="Deactivate Vendor"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: Confirm Goods Received Modal (Replaces browser confirm) */}
      {receiptModalPo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-xl bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden text-gray-900 p-6 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <PackageCheck className="w-5 h-5 text-emerald-600" />
                  Confirm Goods Received
                </h3>
                <p className="text-xs text-gray-500">
                  Verify the received items before updating HQ inventory.
                </p>
              </div>
              <button
                onClick={() => setReceiptModalPo(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* PO Summary Card */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl text-xs">
              <div>
                <span className="text-gray-500 block text-[10px]">PO Number:</span>
                <strong className="text-gray-900 font-mono text-sm font-bold">{receiptModalPo.orderNumber}</strong>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px]">Order Date:</span>
                <strong className="text-gray-900">{formatDate(receiptModalPo.createdAt)}</strong>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px]">Supplier:</span>
                <strong className="text-gray-900">{receiptModalPo.vendorName}</strong>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px]">Vendor ID:</span>
                <strong className="text-gray-900 font-mono">{receiptModalPo.vendorCode || receiptModalPo.vendorId || "VND-REF"}</strong>
              </div>
            </div>

            {/* RECEIVED ITEMS */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                RECEIVED ITEMS
              </span>
              <div className="border border-gray-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">ITEM</th>
                      <th className="py-2.5 px-3 text-right">QTY ORDERED</th>
                      <th className="py-2.5 px-3 text-right">QTY RECEIVED</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {parseItems(receiptModalPo.items).map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-gray-50/50">
                        <td className="py-2.5 px-3 font-semibold text-gray-900">{item.name}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-gray-600">{item.qty}</td>
                        <td className="py-2.5 px-3 text-right">
                          <input
                            type="number"
                            min="1"
                            max={item.qty}
                            value={receivedQuantities[idx] ?? item.qty}
                            onChange={(e) => {
                              const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                              setReceivedQuantities((prev) => {
                                const next = [...prev];
                                next[idx] = val;
                                return next;
                              });
                            }}
                            className="w-20 px-2 py-1 text-right font-bold border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Information Notice */}
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              <span>Confirming receipt will update Headquarters inventory with the received quantities.</span>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setReceiptModalPo(null)}
                className="px-4 py-2 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={submitConfirmGoodsReceived}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <PackageCheck className="w-4 h-4" />
                {actionLoading ? "Receiving..." : "Confirm Goods Received"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Confirm Payment Modal (Replaces browser confirm) */}
      {paymentModalPo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden text-gray-900 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                  Confirm Payment
                </h3>
                <p className="text-xs text-gray-500">Record supplier payment and generate purchase invoice.</p>
              </div>
              <button
                onClick={() => setPaymentModalPo(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">PO Number:</span>
                <span className="font-mono font-bold text-gray-900">{paymentModalPo.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Supplier:</span>
                <span className="font-bold text-gray-900">{paymentModalPo.vendorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Total Amount:</span>
                <span className="font-bold text-gray-900 font-mono">₹{Number(paymentModalPo.totalAmount).toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Amount Paid:</span>
                <span className="font-bold text-emerald-700 font-mono">₹{Number(paymentModalPo.totalAmount).toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-gray-200/80">
                <span className="text-gray-500 font-medium">Payment Status:</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  PAID
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs">
              <FileText className="w-4 h-4 shrink-0 text-purple-600 mt-0.5" />
              <span>Confirming payment will mark this order as PAID, generate the purchase invoice, and make it available in the Billing module.</span>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setPaymentModalPo(null)}
                className="px-4 py-2 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={submitConfirmPayment}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                {actionLoading ? "Processing..." : "Confirm Payment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Delete PO Confirmation */}
      {deletePoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-white border border-gray-200 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-base font-bold text-gray-900">Delete Purchase Order</h3>
            </div>
            <p className="text-xs text-gray-600">
              Are you sure you want to delete Purchase Order <strong>{deletePoModal.orderNumber}</strong>?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletePoModal(null)}
                className="px-4 py-2 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={submitDeletePo}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Deactivate Vendor Confirmation */}
      {deleteVendorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-white border border-gray-200 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-base font-bold text-gray-900">Deactivate Vendor</h3>
            </div>
            <p className="text-xs text-gray-600">
              Are you sure you want to deactivate vendor <strong>{deleteVendorModal.name}</strong>?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteVendorModal(null)}
                className="px-4 py-2 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={submitDeleteVendor}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs"
              >
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Vendor Modal */}
      <AddVendorDialog
        open={vendorDialogOpen}
        onOpenChange={setVendorDialogOpen}
        onSuccess={() => {
          showToast("Vendor Master updated successfully!");
          loadData();
        }}
        vendorToEdit={vendorToEdit}
      />

      {/* Create / Edit Purchase Order Modal */}
      <CreatePurchaseOrderDialog
        open={poDialogOpen}
        onOpenChange={(open) => {
          setPoDialogOpen(open);
          if (!open) setEditPoData(null);
        }}
        initialData={editPoData}
        onSuccess={() => {
          showToast(editPoData ? "Purchase Order updated successfully!" : "New Purchase Order created successfully!");
          setEditPoData(null);
          loadData();
        }}
      />

      {/* View Purchase Order Modal */}
      {viewPoData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden text-gray-900 p-6 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-gray-900">
                  Purchase Order: {viewPoData.orderNumber}
                </h3>
              </div>
              <button
                onClick={() => setViewPoData(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 p-4 rounded-xl">
              <div>
                <span className="text-gray-400 block text-[10px]">Vendor / Supplier</span>
                <strong className="text-gray-900 text-sm">{viewPoData.vendorName}</strong>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">Order Date</span>
                <strong className="text-gray-900">{formatDate(viewPoData.createdAt)}</strong>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">Workflow Status</span>
                <strong className="text-emerald-700 font-bold">{viewPoData.stage}</strong>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">Total Order Amount</span>
                <strong className="text-gray-900 text-sm font-bold">
                  ₹{Number(viewPoData.totalAmount).toLocaleString("en-IN")}
                </strong>
              </div>
            </div>

            {/* Line items list */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Line Items</span>
              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold">
                    <tr>
                      <th className="py-2 px-3">Item</th>
                      <th className="py-2 px-3 text-right">Qty</th>
                      <th className="py-2 px-3 text-right">Unit Price</th>
                      <th className="py-2 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {parseItems(viewPoData.items).map((it: any, idx: number) => (
                      <tr key={idx}>
                        <td className="py-2 px-3 font-medium text-gray-900">{it.name}</td>
                        <td className="py-2 px-3 text-right font-bold">{it.qty}</td>
                        <td className="py-2 px-3 text-right text-gray-600">₹{Number(it.unitPrice).toLocaleString("en-IN")}</td>
                        <td className="py-2 px-3 text-right font-bold text-gray-900">
                          ₹{Number(it.total || Number(it.qty) * Number(it.unitPrice)).toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {viewPoData.deliveryInstructions && (
              <div className="text-xs bg-gray-50 p-3 rounded-xl text-gray-600">
                <span className="font-bold text-gray-800 block text-[10px]">Delivery Instructions:</span>
                {viewPoData.deliveryInstructions}
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              {viewPoData.stage === "PAID" || viewPoData.invoiceNumber ? (
                <button
                  type="button"
                  onClick={() => {
                    setInvoiceModalPoId(viewPoData.id);
                    setInvoiceModalInvoiceId(viewPoData.invoiceId || viewPoData.id || null);
                  }}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  View Purchase Invoice ({viewPoData.invoiceNumber || "Attached"})
                </button>
              ) : (
                <div className="text-xs text-gray-500 italic">
                  {viewPoData.stage === "GOODS_RECEIVED"
                    ? "Ready for Payment Confirmation"
                    : "Awaiting Goods Receipt"}
                </div>
              )}

              <button
                onClick={() => setViewPoData(null)}
                className="px-4 py-2 border border-gray-200 text-gray-700 hover:bg-gray-100 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-page Purchase Invoice Modal */}
      {invoiceModalPoId && (
        <SimplePurchaseInvoiceDialog
          isOpen={!!invoiceModalPoId}
          onClose={() => {
            setInvoiceModalPoId(null);
            setInvoiceModalInvoiceId(null);
          }}
          purchaseOrderId={invoiceModalPoId}
          invoiceId={invoiceModalInvoiceId}
          mode="view"
        />
      )}
    </div>
  );
}
