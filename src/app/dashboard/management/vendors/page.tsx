"use client";
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any */

import React, { useState, useEffect, useMemo } from "react";
import {
  getVendors,
  patchVendorStatus,
  deleteVendor,
} from "@/lib/api";
import { AddVendorDialog } from "@/components/vendors/AddVendorDialog";
import { usePermissions } from "@/lib/permissions";
import {
  Building2,
  Plus,
  Search,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  Edit2,
  Trash2,
  X,
  RefreshCw,
  Power,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  FileCheck,
  ShieldAlert,
  ArrowUpDown,
  Building,
  Calendar,
} from "lucide-react";

export default function VendorManagementPage() {
  const { isSuperAdmin, loading: permsLoading } = usePermissions();

  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Modal states
  const [vendorDialogOpen, setVendorDialogOpen] = useState(false);
  const [vendorToEdit, setVendorToEdit] = useState<any | null>(null);

  // Status toggle confirmation modal
  const [statusModalVendor, setStatusModalVendor] = useState<any | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // View details modal
  const [viewVendor, setViewVendor] = useState<any | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch all vendors (the API endpoint returns non-deleted vendors)
      const data = await getVendors({ status: "ALL" });
      setVendors(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Failed to load vendors:", err);
      setError(err.message || "Failed to load vendors list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!permsLoading) {
      loadData();
    }
  }, [permsLoading]);

  // Summary counts
  const stats = useMemo(() => {
    const total = vendors.length;
    const active = vendors.filter(
      (v) => (v.status || "").toUpperCase() === "ACTIVE"
    ).length;
    const inactive = vendors.filter(
      (v) => (v.status || "").toUpperCase() === "INACTIVE"
    ).length;
    return { total, active, inactive };
  }, [vendors]);

  // Filtering
  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      // 1. Status Filter
      const vStatus = (v.status || "").toUpperCase();
      if (statusFilter === "ACTIVE" && vStatus !== "ACTIVE") return false;
      if (statusFilter === "INACTIVE" && vStatus !== "INACTIVE") return false;

      // 2. Search Filter
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        (v.name && v.name.toLowerCase().includes(q)) ||
        (v.code && v.code.toLowerCase().includes(q)) ||
        (v.companyName && v.companyName.toLowerCase().includes(q)) ||
        (v.contact && v.contact.toLowerCase().includes(q)) ||
        (v.phone && v.phone.toLowerCase().includes(q)) ||
        (v.email && v.email.toLowerCase().includes(q)) ||
        (v.gstNumber && v.gstNumber.toLowerCase().includes(q)) ||
        (v.panNumber && v.panNumber.toLowerCase().includes(q)) ||
        (v.address && v.address.toLowerCase().includes(q))
      );
    });
  }, [vendors, statusFilter, search]);

  // Edit handler
  const handleEditVendor = (vendor: any) => {
    setVendorToEdit(vendor);
    setVendorDialogOpen(true);
  };

  // Status toggle handler
  const handleConfirmStatusToggle = async () => {
    if (!statusModalVendor) return;
    const currentIsActive = (statusModalVendor.status || "").toUpperCase() === "ACTIVE";
    const newStatus = currentIsActive ? "Inactive" : "Active";

    try {
      setUpdatingStatus(true);
      await patchVendorStatus(statusModalVendor.id, newStatus);
      showToast(
        `Vendor "${statusModalVendor.name}" has been marked as ${newStatus.toUpperCase()}.${
          newStatus === "Inactive"
            ? " They will no longer appear in new Purchase Orders."
            : " They are now available for Purchase Orders."
        }`
      );
      setStatusModalVendor(null);
      await loadData();
    } catch (err: any) {
      showToast(err.message || "Failed to update vendor status.", "error");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Super Admin Role Gate
  if (!permsLoading && !isSuperAdmin) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Access Restricted</h2>
        <p className="text-sm text-gray-500 max-w-md mb-6">
          Vendor Management is restricted to Super Admin authority. Your current role does not have permission to view or manage vendors.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 sm:p-6 lg:p-8 space-y-6 text-gray-900 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border animate-in fade-in slide-in-from-top-4 transition-all ${
            toastMessage.type === "success"
              ? "bg-emerald-600 text-white border-emerald-700"
              : "bg-rose-600 text-white border-rose-700"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span className="text-sm font-semibold">{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="p-1 hover:bg-white/20 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              SUPER ADMIN • MANAGEMENT
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
            Vendor Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-500">
            Centralized supplier registry, contact directory, and procurement status governance.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2.5 rounded-xl bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh Vendor List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-600" : ""}`} />
          </button>
          <button
            onClick={() => {
              setVendorToEdit(null);
              setVendorDialogOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Vendor</span>
          </button>
        </div>
      </div>

      {/* KPI Cards: Total, Active, Inactive */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Vendors */}
        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Total Vendors
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              {stats.total}
            </div>
            <p className="text-[11px] text-gray-400">All registered vendors</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        {/* Active Vendors */}
        <div
          onClick={() => setStatusFilter(statusFilter === "ACTIVE" ? "ALL" : "ACTIVE")}
          className={`p-5 rounded-2xl bg-white border shadow-sm flex items-center justify-between transition-all cursor-pointer ${
            statusFilter === "ACTIVE"
              ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-md"
              : "border-gray-200 hover:border-emerald-300"
          }`}
        >
          <div className="space-y-1">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Active Vendors
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
              {stats.active}
            </div>
            <p className="text-[11px] text-emerald-600/80">Available in Purchase Orders</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Inactive Vendors */}
        <div
          onClick={() => setStatusFilter(statusFilter === "INACTIVE" ? "ALL" : "INACTIVE")}
          className={`p-5 rounded-2xl bg-white border shadow-sm flex items-center justify-between transition-all cursor-pointer ${
            statusFilter === "INACTIVE"
              ? "border-amber-500 ring-2 ring-amber-500/20 shadow-md"
              : "border-gray-200 hover:border-amber-300"
          }`}
        >
          <div className="space-y-1">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Inactive Vendors
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-600">
              {stats.inactive}
            </div>
            <p className="text-[11px] text-amber-600/80">Hidden from PO supplier selection</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <Power className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-gray-200 shadow-sm">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-gray-100 border border-gray-200">
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === "ALL"
                ? "bg-white text-gray-900 shadow-2xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            All ({stats.total})
          </button>
          <button
            onClick={() => setStatusFilter("ACTIVE")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === "ACTIVE"
                ? "bg-emerald-600 text-white shadow-2xs"
                : "text-gray-600 hover:text-emerald-700"
            }`}
          >
            Active ({stats.active})
          </button>
          <button
            onClick={() => setStatusFilter("INACTIVE")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === "INACTIVE"
                ? "bg-amber-600 text-white shadow-2xs"
                : "text-gray-600 hover:text-amber-700"
            }`}
          >
            Inactive ({stats.inactive})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search code, name, phone, GST, PAN..."
            className="w-full h-10 pl-9 pr-8 rounded-xl bg-gray-50/80 border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
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

      {/* Vendor Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-3">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-semibold">Loading Vendor Register...</p>
          </div>
        ) : error ? (
          <div className="py-16 text-center text-rose-600 space-y-3 px-4">
            <AlertCircle className="w-10 h-10 mx-auto text-rose-500" />
            <p className="text-sm font-bold">{error}</p>
            <button
              onClick={loadData}
              className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : filteredVendors.length === 0 ? (
          <div className="py-20 text-center text-gray-500 space-y-3 px-4">
            <Building2 className="w-12 h-12 mx-auto text-gray-300" />
            <div className="space-y-1">
              <p className="text-base font-bold text-gray-800">No Vendors Found</p>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                {search
                  ? `No vendor matching "${search}". Try searching with a different keyword.`
                  : statusFilter !== "ALL"
                  ? `There are currently no ${statusFilter.toLowerCase()} vendors.`
                  : "No vendors registered yet. Click 'Add Vendor' to register your first supplier."}
              </p>
            </div>
            {search && (
              <button
                onClick={() => setSearch("")}
                className="text-xs font-bold text-emerald-600 hover:underline cursor-pointer"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/70 text-[11px] text-gray-500 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Vendor Code</th>
                  <th className="py-3.5 px-4">Vendor & Company</th>
                  <th className="py-3.5 px-4">Contact Person</th>
                  <th className="py-3.5 px-4">Tax IDs (GST / PAN)</th>
                  <th className="py-3.5 px-4">Bank Details</th>
                  <th className="py-3.5 px-4">Created Date</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredVendors.map((vendor) => {
                  const isActive = (vendor.status || "").toUpperCase() === "ACTIVE";
                  return (
                    <tr
                      key={vendor.id}
                      className="hover:bg-gray-50/80 transition-colors group"
                    >
                      {/* Vendor Code */}
                      <td className="py-3.5 px-4 align-top">
                        <span className="font-mono text-xs font-bold px-2 py-1 rounded-md bg-gray-100 text-emerald-800 border border-gray-200">
                          {vendor.code}
                        </span>
                      </td>

                      {/* Vendor & Company Name */}
                      <td className="py-3.5 px-4 align-top max-w-xs">
                        <div className="font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
                          {vendor.name}
                        </div>
                        {vendor.companyName && (
                          <div className="text-xs text-gray-500 font-medium truncate">
                            {vendor.companyName}
                          </div>
                        )}
                        {vendor.address && (
                          <div className="text-[11px] text-gray-400 truncate flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span>
                              {vendor.address}
                              {vendor.state ? `, ${vendor.state}` : ""}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Contact Person */}
                      <td className="py-3.5 px-4 align-top text-xs">
                        <div className="font-semibold text-gray-800">
                          {vendor.contact || "—"}
                        </div>
                        {vendor.phone && (
                          <div className="text-gray-500 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 shrink-0 text-gray-400" />
                            <span>{vendor.phone}</span>
                          </div>
                        )}
                        {vendor.email && (
                          <div className="text-gray-500 flex items-center gap-1 mt-0.5 truncate max-w-[180px]">
                            <Mail className="w-3 h-3 shrink-0 text-gray-400" />
                            <span className="truncate">{vendor.email}</span>
                          </div>
                        )}
                      </td>

                      {/* Tax IDs: GST & PAN */}
                      <td className="py-3.5 px-4 align-top text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 font-mono">
                            <span className="text-[10px] font-bold text-gray-400 uppercase">GST:</span>
                            <span className="font-semibold text-gray-800">
                              {vendor.gstNumber || "N/A"}
                            </span>
                          </div>
                          {vendor.panNumber && (
                            <div className="flex items-center gap-1.5 font-mono">
                              <span className="text-[10px] font-bold text-gray-400 uppercase">PAN:</span>
                              <span className="font-semibold text-gray-700">
                                {vendor.panNumber}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Bank Details */}
                      <td className="py-3.5 px-4 align-top text-xs">
                        {vendor.bankName || vendor.accountNumber ? (
                          <div className="space-y-0.5">
                            <div className="font-semibold text-gray-800">
                              {vendor.bankName || "Bank Account"}
                            </div>
                            {vendor.accountNumber && (
                              <div className="text-gray-500 font-mono text-[11px]">
                                A/C: {vendor.accountNumber}
                              </div>
                            )}
                            {vendor.ifscCode && (
                              <div className="text-gray-400 font-mono text-[10px]">
                                IFSC: {vendor.ifscCode}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic text-[11px]">Not provided</span>
                        )}
                      </td>

                      {/* Created Date */}
                      <td className="py-3.5 px-4 align-top text-xs text-gray-500 font-medium">
                        {vendor.createdAt ? (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            <span>{new Date(vendor.createdAt).toLocaleDateString()}</span>
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4 align-top text-center">
                        <span
                          className={`px-3 py-1 text-xs rounded-full font-bold inline-flex items-center gap-1.5 shadow-2xs ${
                            isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isActive ? "bg-emerald-500" : "bg-rose-500"
                            }`}
                          />
                          {isActive ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 align-top text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Toggle Status Button */}
                          <button
                            onClick={() => setStatusModalVendor(vendor)}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                              isActive
                                ? "bg-gray-50 hover:bg-amber-50 text-gray-500 hover:text-amber-700 border-gray-200 hover:border-amber-200"
                                : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                            }`}
                            title={
                              isActive
                                ? "Deactivate Vendor (Remove from PO selection)"
                                : "Activate Vendor (Make available in PO selection)"
                            }
                          >
                            <Power className="w-4 h-4" />
                          </button>

                          {/* Edit Vendor Button */}
                          <button
                            onClick={() => handleEditVendor(vendor)}
                            className="p-1.5 rounded-lg bg-gray-50 hover:bg-emerald-50 text-gray-600 hover:text-emerald-700 border border-gray-200 hover:border-emerald-200 transition-colors cursor-pointer"
                            title="Edit Vendor Details"
                          >
                            <Edit2 className="w-4 h-4" />
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

      {/* Add / Edit Vendor Dialog */}
      <AddVendorDialog
        open={vendorDialogOpen}
        onOpenChange={setVendorDialogOpen}
        onSuccess={() => {
          showToast(
            vendorToEdit
              ? "Vendor details updated successfully!"
              : "New vendor registered successfully!"
          );
          loadData();
        }}
        vendorToEdit={vendorToEdit}
      />

      {/* Status Change Confirmation Modal */}
      {statusModalVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-2xl p-6 text-gray-900 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl border ${
                  (statusModalVendor.status || "").toUpperCase() === "ACTIVE"
                    ? "bg-amber-50 text-amber-600 border-amber-200"
                    : "bg-emerald-50 text-emerald-600 border-emerald-200"
                }`}
              >
                <Power className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  {(statusModalVendor.status || "").toUpperCase() === "ACTIVE"
                    ? "Deactivate Vendor?"
                    : "Activate Vendor?"}
                </h3>
                <p className="text-xs text-gray-500">
                  Vendor: {statusModalVendor.name} ({statusModalVendor.code})
                </p>
              </div>
            </div>

            <p className="text-sm text-gray-600 leading-relaxed">
              {(statusModalVendor.status || "").toUpperCase() === "ACTIVE" ? (
                <>
                  Deactivating this vendor will <strong>exclude them</strong> from all new Purchase Order supplier dropdowns.
                  <br />
                  <span className="text-xs text-gray-500 mt-2 block">
                    Historical Purchase Orders using this vendor will remain completely intact.
                  </span>
                </>
              ) : (
                <>
                  Activating this vendor will make them <strong>immediately selectable</strong> in the Purchase Order "Select Supplier (Vendor)" dropdown.
                </>
              )}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStatusModalVendor(null)}
                disabled={updatingStatus}
                className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmStatusToggle}
                disabled={updatingStatus}
                className={`px-4 py-2 text-sm font-bold text-white rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2 ${
                  (statusModalVendor.status || "").toUpperCase() === "ACTIVE"
                    ? "bg-amber-600 hover:bg-amber-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {updatingStatus ? (
                  <span>Updating...</span>
                ) : (statusModalVendor.status || "").toUpperCase() === "ACTIVE" ? (
                  <span>Deactivate Vendor</span>
                ) : (
                  <span>Activate Vendor</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
