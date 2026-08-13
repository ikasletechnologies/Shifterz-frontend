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
    <div className="min-h-screen bg-[#0f172a] text-slate-100 p-6 space-y-6">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-emerald-600 text-white rounded-xl shadow-2xl animate-in fade-in slide-in-from-top-5">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-[#1e293b]/70 border border-slate-800 shadow-xl backdrop-blur-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
              PRD Module 10
            </span>
            <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              HQ Exclusive Authority
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            Vendor & Purchase Management
          </h1>
          <p className="text-sm text-slate-400">
            Manage Headquarters suppliers, purchase orders, automated inventory goods receipt, and supplier billing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setVendorToEdit(null);
              setVendorDialogOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 transition-all"
          >
            <Building2 className="w-4 h-4 text-emerald-400" />
            Add Supplier (Vendor)
          </button>
          <button
            onClick={() => setPoDialogOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium shadow-lg shadow-emerald-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            New Purchase Order
          </button>
        </div>
      </div>

      {/* Workflow Reference Banner */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
        <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/50">
          <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">1</span>
          <div>
            <div className="font-semibold text-slate-200">Purchase Order</div>
            <div className="text-[10px] text-slate-400">HQ Authorized</div>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">2</span>
          <div>
            <div className="font-semibold text-emerald-300">Goods Received</div>
            <div className="text-[10px] text-emerald-400 font-bold">Auto-adds Stock</div>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/50">
          <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">3</span>
          <div>
            <div className="font-semibold text-slate-200">Purchase Invoice</div>
            <div className="text-[10px] text-slate-400">Bill Linked</div>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/50">
          <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">4</span>
          <div>
            <div className="font-semibold text-slate-200">Stock Updated</div>
            <div className="text-[10px] text-slate-400">HQ Warehouse</div>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/50">
          <span className="w-6 h-6 rounded-full bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold">5</span>
          <div>
            <div className="font-semibold text-slate-200">Supplier Payment</div>
            <div className="text-[10px] text-slate-400">Paid & Audited</div>
          </div>
        </div>
      </div>

      {/* Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-900 border border-slate-800">
          <button
            onClick={() => setActiveTab("purchases")}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "purchases"
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            Purchase Orders ({purchases.length})
          </button>
          <button
            onClick={() => setActiveTab("vendors")}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "vendors"
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Building2 className="w-4 h-4" />
            Vendor Master ({vendors.length})
          </button>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${activeTab === "purchases" ? "PO Number or Supplier" : "Vendor Name, Code, or GST"}...`}
            className="w-full h-10 pl-9 pr-8 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content Body */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Loading procurement database...</p>
        </div>
      ) : activeTab === "purchases" ? (
        /* PURCHASE ORDERS TAB */
        <div className="bg-[#1e293b]/50 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          {filteredPurchases.length === 0 ? (
            <div className="py-20 text-center text-slate-400 space-y-2">
              <ShoppingCart className="w-12 h-12 mx-auto text-slate-600 opacity-50" />
              <p className="text-base font-medium">No Purchase Orders Found</p>
              <p className="text-xs text-slate-500">
                Click &quot;+ New Purchase Order&quot; above to initiate a procurement order with suppliers.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-xs text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Order Number</th>
                    <th className="py-3 px-4">Supplier (Vendor)</th>
                    <th className="py-3 px-4">Line Items</th>
                    <th className="py-3 px-4">Amount (₹)</th>
                    <th className="py-3 px-4">Workflow Stage</th>
                    <th className="py-3 px-4">Invoice / Payment</th>
                    <th className="py-3 px-4 text-right">Procurement Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-sm">
                  {filteredPurchases.map((po) => {
                    const lineItems = parseItems(po.items);
                    const isReceived = po.stage === "RECEIVED" || po.stage === "INVOICED" || po.stage === "PAID" || !!po.receivedAt;
                    return (
                      <tr key={po.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                          {po.orderNumber}
                          <div className="text-[10px] text-slate-400 font-sans font-normal">
                            {new Date(po.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-200">
                          {po.vendorName}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-xs text-slate-300 font-medium">
                            {lineItems.length} item(s)
                          </div>
                          <div className="text-[11px] text-slate-400 truncate max-w-xs">
                            {lineItems.map((i: any) => `${i.qty}x ${i.name}`).join(", ")}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-100">
                          ₹{Number(po.totalAmount).toLocaleString("en-IN")}
                          {po.paidAmount > 0 && (
                            <div className="text-[10px] font-normal text-emerald-400">
                              Paid: ₹{Number(po.paidAmount).toLocaleString("en-IN")}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 text-xs rounded-full font-semibold inline-flex items-center gap-1 ${
                              po.stage === "PAID"
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                : po.stage === "INVOICED"
                                ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                : po.stage === "RECEIVED"
                                ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            }`}
                          >
                            {po.stage === "PAID" && <CheckCircle2 className="w-3.5 h-3.5" />}
                            {po.stage === "RECEIVED" && <PackageCheck className="w-3.5 h-3.5" />}
                            {po.stage}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-300">
                          {po.invoiceNumber ? (
                            <div className="flex items-center gap-1 text-purple-300">
                              <FileText className="w-3.5 h-3.5" />
                              <span>{po.invoiceNumber}</span>
                            </div>
                          ) : (
                            <span className="text-slate-500 italic">No Invoice Linked</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {!isReceived && (
                              <button
                                onClick={() => handleReceiveGoods(po)}
                                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-sm transition-all"
                                title="Goods Receipt: Automatically update HQ Inventory Stock"
                              >
                                <PackageCheck className="w-3.5 h-3.5" />
                                Receive Goods (+Stock)
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenInvoiceModal(po)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                              title="Attach Purchase Invoice"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenPaymentModal(po)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                              title="Record Supplier Payment"
                            >
                              <CreditCard className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEditPo(po)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-900/50 text-slate-300 hover:text-amber-400 transition-colors cursor-pointer"
                              title="Edit Purchase Order"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeletePo(po)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
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
        <div className="bg-[#1e293b]/50 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          {filteredVendors.length === 0 ? (
            <div className="py-20 text-center text-slate-400 space-y-2">
              <Building2 className="w-12 h-12 mx-auto text-slate-600 opacity-50" />
              <p className="text-base font-medium">No Suppliers (Vendors) Found</p>
              <p className="text-xs text-slate-500">
                Click &quot;Add Supplier (Vendor)&quot; above to add suppliers to the Headquarters Vendor Master repository.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-xs text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Vendor Code</th>
                    <th className="py-3 px-4">Vendor Name</th>
                    <th className="py-3 px-4">GST Number</th>
                    <th className="py-3 px-4">Contact & Mobile</th>
                    <th className="py-3 px-4">Email & Address</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-sm">
                  {filteredVendors.map((vendor) => (
                    <tr key={vendor.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                        {vendor.code}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-white">
                        {vendor.name}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-300 uppercase">
                        {vendor.gstNumber || "N/A"}
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <div className="text-slate-200 font-medium">{vendor.contact || "N/A"}</div>
                        <div className="text-slate-400">{vendor.phone}</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <div className="text-slate-300">{vendor.email || "N/A"}</div>
                        <div className="text-slate-400 truncate max-w-xs">{vendor.address}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 text-xs rounded-full font-semibold inline-flex items-center gap-1 ${
                            vendor.status === "Active"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : "bg-slate-700/50 text-slate-400 border border-slate-700"
                          }`}
                        >
                          {vendor.status === "Active" && <CheckCircle2 className="w-3 h-3" />}
                          {vendor.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditVendor(vendor)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                            title="Edit Vendor"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteVendor(vendor.id, vendor.name)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 text-slate-500 hover:text-rose-400 transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#1e293b] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-slate-100 p-6 space-y-4">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-400" />
              Attach Purchase Invoice
            </h3>
            <p className="text-xs text-slate-400">
              Link the supplier invoice number to PO <strong>{invoiceModalPo.orderNumber}</strong>.
            </p>
            <form onSubmit={handleSubmitInvoice} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Purchase Invoice Number *
                </label>
                <input
                  type="text"
                  value={invoiceNumberInput}
                  onChange={(e) => setInvoiceNumberInput(e.target.value)}
                  required
                  placeholder="INV-2026-089"
                  className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-sm"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setInvoiceModalPo(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-500 rounded-lg"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#1e293b] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-slate-100 p-6 space-y-4">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-400" />
              Record Supplier Payment
            </h3>
            <p className="text-xs text-slate-400">
              Record total payment made to supplier for PO <strong>{paymentModalPo.orderNumber}</strong>.
            </p>
            <form onSubmit={handleSubmitPayment} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Amount Paid (₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  value={paidAmountInput}
                  onChange={(e) => setPaidAmountInput(e.target.value)}
                  required
                  className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-sm"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPaymentModalPo(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg"
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
