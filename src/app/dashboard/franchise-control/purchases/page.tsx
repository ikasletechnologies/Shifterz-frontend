"use client";
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any */

import React, { useState, useEffect } from "react";
import {
  getVendors,
  deleteVendor,
  getPurchases,
  receivePurchaseGoods,
  invoicePurchaseOrder,
  payPurchaseOrder,
  deletePurchaseOrder,
} from "@/lib/api";
import { AddVendorDialog } from "@/components/vendors/AddVendorDialog";
import { CreatePurchaseOrderDialog } from "@/components/purchases/CreatePurchaseOrderDialog";
import {
  Building2,
  ShoppingCart,
  Plus,
  Search,
  CheckCircle2,
  ShieldCheck,
  PackageCheck,
  FileText,
  CreditCard,
  Trash2,
  Edit2,
  AlertCircle,
  Truck,
  ArrowRight, X,
} from "lucide-react";

export default function PurchaseManagementPage() {
  const [activeTab, setActiveTab] = useState<"purchases" | "vendors">("purchases");

  const [vendors, setVendors] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Dialog states
  const [vendorDialogOpen, setVendorDialogOpen] = useState(false);
  const [vendorToEdit, setVendorToEdit] = useState<any | null>(null);
  const [poDialogOpen, setPoDialogOpen] = useState(false);
  const [editPoData, setEditPoData] = useState<any | null>(null);

  const handleEditPo = (po: any) => {
    setEditPoData(po);
    setPoDialogOpen(true);
  };

  // Invoice & Payment modal states
  const [invoiceModalPo, setInvoiceModalPo] = useState<any | null>(null);
  const [invoiceNumberInput, setInvoiceNumberInput] = useState("");
  const [paymentModalPo, setPaymentModalPo] = useState<any | null>(null);
  const [paidAmountInput, setPaidAmountInput] = useState("");

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

  // Vendor handlers
  const handleEditVendor = (vendor: any) => {
    setVendorToEdit(vendor);
    setVendorDialogOpen(true);
  };

  const handleDeleteVendor = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to deactivate vendor "${name}"? (PRD: Soft-deleted to preserve financial records)`)) {
      return;
    }
    try {
      await deleteVendor(id);
      showToast(`Vendor "${name}" deactivated successfully.`);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to deactivate vendor");
    }
  };

  // Purchase handlers
  const handleReceiveGoods = async (po: any) => {
    if (!confirm(`Confirm Goods Receipt for ${po.orderNumber}?\n\nThis will AUTOMATICALLY add all ordered line items to Headquarters Inventory (db.inventory) and create a PURCHASE_RECEIPT movement.`)) {
      return;
    }
    try {
      await receivePurchaseGoods(po.id);
      showToast(`✅ Goods Received for ${po.orderNumber}! HQ Inventory quantities automatically updated.`);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to process goods receipt");
    }
  };

  const handleOpenInvoiceModal = (po: any) => {
    setInvoiceModalPo(po);
    setInvoiceNumberInput(po.invoiceNumber || `INV-${po.orderNumber}`);
  };

  const handleSubmitInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceModalPo || !invoiceNumberInput) return;
    try {
      await invoicePurchaseOrder(invoiceModalPo.id, invoiceNumberInput);
      showToast(`Purchase Invoice "${invoiceNumberInput}" linked to ${invoiceModalPo.orderNumber}.`);
      setInvoiceModalPo(null);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to attach purchase invoice");
    }
  };

  const handleOpenPaymentModal = (po: any) => {
    setPaymentModalPo(po);
    setPaidAmountInput(String(po.totalAmount));
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalPo) return;
    try {
      await payPurchaseOrder(paymentModalPo.id, Number(paidAmountInput) || 0);
      showToast(`Supplier payment of ₹${Number(paidAmountInput).toLocaleString("en-IN")} recorded for ${paymentModalPo.orderNumber}.`);
      setPaymentModalPo(null);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to record payment");
    }
  };

  const handleDeletePo = async (po: any) => {
    if (!confirm(`Soft-delete Purchase Order ${po.orderNumber}? (PRD Rule: Purchase records shall not be permanently deleted)`)) {
      return;
    }
    try {
      await deletePurchaseOrder(po.id);
      showToast(`Purchase Order ${po.orderNumber} soft-deleted.`);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to delete PO");
    }
  };

  // Filtering
  const filteredVendors = vendors.filter(
    (v) =>
      v.name?.toLowerCase().includes(search.toLowerCase()) ||
      v.code?.toLowerCase().includes(search.toLowerCase()) ||
      v.gstNumber?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredPurchases = purchases.filter(
    (p) =>
      p.orderNumber?.toLowerCase().includes(search.toLowerCase()) ||
      p.vendorName?.toLowerCase().includes(search.toLowerCase()) ||
      p.invoiceNumber?.toLowerCase().includes(search.toLowerCase())
  );

  const parseItems = (itemsStr: string) => {
    try {
      const arr = JSON.parse(itemsStr);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 sm:p-8 space-y-6 text-gray-900 max-w-7xl mx-auto">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-emerald-600 text-white rounded-xl shadow-lg animate-in fade-in slide-in-from-top-5">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
              PRD Module 10
            </span>
            <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              HQ Exclusive Authority
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
            Vendor & Purchase Management
          </h1>

        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => {
              setVendorToEdit(null);
              setVendorDialogOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-gray-50 text-gray-700 text-xs sm:text-sm font-bold border border-gray-200 shadow-xs transition-all"
          >
            <Building2 className="w-4 h-4 text-emerald-600" />
            Add Supplier (Vendor)
          </button>
          <button
            onClick={() => setPoDialogOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            New Purchase Order
          </button>
        </div>
      </div>

      {/* Workflow Reference Banner */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-4 rounded-2xl bg-white border border-gray-200 shadow-sm text-xs">
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-blue-50/60 border border-blue-100">
          <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0 text-xs">1</span>
          <div>
            <div className="font-bold text-gray-800">Purchase Order</div>
          </div>
        </div>
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 shadow-2xs">
          <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0 text-xs">2</span>
          <div>
            <div className="font-bold text-emerald-900">Goods Received</div>
          </div>
        </div>
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-purple-50/60 border border-purple-100">
          <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold shrink-0 text-xs">3</span>
          <div>
            <div className="font-bold text-gray-800">Purchase Invoice</div>
          </div>
        </div>
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-50/60 border border-amber-100">
          <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold shrink-0 text-xs">4</span>
          <div>
            <div className="font-bold text-gray-800">Stock Updated</div>
          </div>
        </div>
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
          <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0 text-xs">5</span>
          <div>
            <div className="font-bold text-gray-800">Supplier Payment</div>
          </div>
        </div>
      </div>

      {/* Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-gray-100 border border-gray-200">
          <button
            onClick={() => setActiveTab("purchases")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${activeTab === "purchases"
              ? "bg-emerald-600 text-white shadow-xs"
              : "text-gray-600 hover:text-gray-900"
              }`}
          >
            <ShoppingCart className="w-4 h-4" />
            Purchase Orders ({purchases.length})
          </button>
          <button
            onClick={() => setActiveTab("vendors")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${activeTab === "vendors"
              ? "bg-emerald-600 text-white shadow-xs"
              : "text-gray-600 hover:text-gray-900"
              }`}
          >
            <Building2 className="w-4 h-4" />
            Vendor Master ({vendors.length})
          </button>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${activeTab === "purchases" ? "PO Number or Supplier" : "Vendor Name, Code, or GST"}...`}
            className="w-full h-10 pl-9 pr-8 rounded-xl bg-white border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content Body */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium">Loading procurement database...</p>
        </div>
      ) : activeTab === "purchases" ? (
        /* PURCHASE ORDERS TAB */
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          {filteredPurchases.length === 0 ? (
            <div className="py-20 text-center text-gray-500 space-y-2">
              <ShoppingCart className="w-12 h-12 mx-auto text-gray-300" />
              <p className="text-base font-bold text-gray-800">No Purchase Orders Found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-xs text-gray-500 font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Order Number</th>
                    <th className="py-3.5 px-4">Supplier (Vendor)</th>
                    <th className="py-3.5 px-4">Line Items</th>
                    <th className="py-3.5 px-4">Amount (₹)</th>
                    <th className="py-3.5 px-4">Workflow Stage</th>
                    <th className="py-3.5 px-4">Invoice / Payment</th>
                    <th className="py-3.5 px-4 text-right">Procurement Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {filteredPurchases.map((po) => {
                    const lineItems = parseItems(po.items);
                    const isReceived = po.stage === "RECEIVED" || po.stage === "INVOICED" || po.stage === "PAID" || !!po.receivedAt;
                    return (
                      <tr key={po.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                          {po.orderNumber}
                          <div className="text-[11px] text-gray-400 font-sans font-normal">
                            {new Date(po.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-gray-900">
                          {po.vendorName}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-xs text-gray-800 font-semibold">
                            {lineItems.length} item(s)
                          </div>
                          <div className="text-[11px] text-gray-500 truncate max-w-xs">
                            {lineItems.map((i: any) => `${i.qty}x ${i.name}`).join(", ")}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-gray-900">
                          ₹{Number(po.totalAmount).toLocaleString("en-IN")}
                          {po.paidAmount > 0 && (
                            <div className="text-[11px] font-semibold text-emerald-600">
                              Paid: ₹{Number(po.paidAmount).toLocaleString("en-IN")}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 text-xs rounded-full font-bold inline-flex items-center gap-1 ${po.stage === "PAID"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : po.stage === "INVOICED"
                                ? "bg-purple-50 text-purple-700 border border-purple-200"
                                : po.stage === "RECEIVED"
                                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}
                          >
                            {po.stage === "PAID" && <CheckCircle2 className="w-3.5 h-3.5" />}
                            {po.stage === "RECEIVED" && <PackageCheck className="w-3.5 h-3.5" />}
                            {po.stage}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          {po.invoiceNumber ? (
                            <div className="flex items-center gap-1 text-purple-700 font-semibold">
                              <FileText className="w-3.5 h-3.5" />
                              <span>{po.invoiceNumber}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">No Invoice Linked</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {!isReceived && (
                              <button
                                onClick={() => handleReceiveGoods(po)}
                                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-xs transition-all"
                                title="Goods Receipt: Automatically update HQ Inventory Stock"
                              >
                                <PackageCheck className="w-3.5 h-3.5" />
                                Receive Goods (+Stock)
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenInvoiceModal(po)}
                              className="p-1.5 rounded-lg bg-gray-50 hover:bg-purple-50 text-gray-600 hover:text-purple-700 border border-gray-200 transition-colors"
                              title="Attach Purchase Invoice"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenPaymentModal(po)}
                              className="p-1.5 rounded-lg bg-gray-50 hover:bg-emerald-50 text-gray-600 hover:text-emerald-700 border border-gray-200 transition-colors cursor-pointer"
                              title="Record Supplier Payment"
                            >
                              <CreditCard className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEditPo(po)}
                              className="p-1.5 rounded-lg bg-gray-50 hover:bg-amber-50 text-gray-600 hover:text-amber-700 border border-gray-200 transition-colors cursor-pointer"
                              title="Edit Purchase Order"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeletePo(po)}
                              className="p-1.5 rounded-lg bg-gray-50 hover:bg-rose-50 text-gray-400 hover:text-rose-600 border border-gray-200 transition-colors cursor-pointer"
                              title="Soft-delete Purchase Order"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
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
      ) : (
        /* VENDOR MASTER TAB */
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          {filteredVendors.length === 0 ? (
            <div className="py-20 text-center text-gray-500 space-y-2">
              <Building2 className="w-12 h-12 mx-auto text-gray-300" />
              <p className="text-base font-bold text-gray-800">No Suppliers (Vendors) Found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-xs text-gray-500 font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Vendor Code</th>
                    <th className="py-3.5 px-4">Vendor Name</th>
                    <th className="py-3.5 px-4">GST Number</th>
                    <th className="py-3.5 px-4">Contact & Mobile</th>
                    <th className="py-3.5 px-4">Email & Address</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {filteredVendors.map((vendor) => (
                    <tr key={vendor.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                        {vendor.code}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-gray-900">
                        {vendor.name}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-gray-600 uppercase font-semibold">
                        {vendor.gstNumber || "N/A"}
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <div className="text-gray-900 font-bold">{vendor.contact || "N/A"}</div>
                        <div className="text-gray-500">{vendor.phone}</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <div className="text-gray-800 font-medium">{vendor.email || "N/A"}</div>
                        <div className="text-gray-500 truncate max-w-xs">{vendor.address}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 text-xs rounded-full font-bold inline-flex items-center gap-1 ${vendor.status === "Active"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-gray-100 text-gray-500 border border-gray-200"
                            }`}
                        >
                          {vendor.status === "Active" && <CheckCircle2 className="w-3 h-3" />}
                          {vendor.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleEditVendor(vendor)}
                            className="p-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-900 border border-gray-200 transition-colors"
                            title="Edit Vendor"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteVendor(vendor.id, vendor.name)}
                            className="p-1.5 rounded-lg bg-gray-50 hover:bg-rose-50 text-gray-400 hover:text-rose-600 border border-gray-200 transition-colors"
                            title="Deactivate Vendor"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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

      {/* Attach Invoice Modal */}
      {invoiceModalPo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden text-gray-900 p-6 space-y-4">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              Attach Purchase Invoice
            </h3>
            <p className="text-xs text-gray-500">
              Link the supplier invoice number to PO <strong>{invoiceModalPo.orderNumber}</strong>.
            </p>
            <form onSubmit={handleSubmitInvoice} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">
                  Purchase Invoice Number *
                </label>
                <input
                  type="text"
                  value={invoiceNumberInput}
                  onChange={(e) => setInvoiceNumberInput(e.target.value)}
                  required
                  placeholder="INV-2026-089"
                  className="w-full h-9 px-3 rounded-xl bg-gray-50/80 border border-gray-200 text-gray-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setInvoiceModalPo(null)}
                  className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs transition-all"
                >
                  Save Invoice Number
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {paymentModalPo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden text-gray-900 p-6 space-y-4">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              Record Supplier Payment
            </h3>
            <p className="text-xs text-gray-500">
              Record total payment made to supplier for PO <strong>{paymentModalPo.orderNumber}</strong>.
            </p>
            <form onSubmit={handleSubmitPayment} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">
                  Amount Paid (₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  value={paidAmountInput}
                  onChange={(e) => setPaidAmountInput(e.target.value)}
                  required
                  className="w-full h-9 px-3 rounded-xl bg-gray-50/80 border border-gray-200 text-gray-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPaymentModalPo(null)}
                  className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all"
                >
                  Save Supplier Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
