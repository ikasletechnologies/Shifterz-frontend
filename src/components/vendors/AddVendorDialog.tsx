"use client";
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any */

import React, { useState, useEffect } from "react";
import { createVendor, updateVendor } from "@/lib/api";
import { Building2, X, ShieldAlert, CheckCircle2 } from "lucide-react";

interface AddVendorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  vendorToEdit?: any | null;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9+\s-]{7,15}$/;
const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i;

export function AddVendorDialog({
  open,
  onOpenChange,
  onSuccess,
  vendorToEdit = null,
}: AddVendorDialogProps) {
  const isEditing = !!vendorToEdit;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    companyName: "",
    contact: "",
    phone: "",
    email: "",
    address: "",
    state: "",
    gstNumber: "",
    panNumber: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    notes: "",
    status: "Active",
  });

  useEffect(() => {
    if (vendorToEdit) {
      setFormData({
        code: vendorToEdit.code || "",
        name: vendorToEdit.name || "",
        companyName: vendorToEdit.companyName || "",
        contact: vendorToEdit.contact || "",
        phone: vendorToEdit.phone || "",
        email: vendorToEdit.email || "",
        address: vendorToEdit.address || "",
        state: vendorToEdit.state || "",
        gstNumber: vendorToEdit.gstNumber || "",
        panNumber: vendorToEdit.panNumber || "",
        bankName: vendorToEdit.bankName || "",
        accountNumber: vendorToEdit.accountNumber || "",
        ifscCode: vendorToEdit.ifscCode || "",
        notes: vendorToEdit.notes || "",
        status: vendorToEdit.status || "Active",
      });
    } else {
      setFormData({
        code: "",
        name: "",
        companyName: "",
        contact: "",
        phone: "",
        email: "",
        address: "",
        state: "",
        gstNumber: "",
        panNumber: "",
        bankName: "",
        accountNumber: "",
        ifscCode: "",
        notes: "",
        status: "Active",
      });
    }
    setError(null);
  }, [vendorToEdit, open]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validate = (): string | null => {
    if (!formData.name.trim()) {
      return "Vendor Name is required.";
    }

    if (formData.email.trim() && !EMAIL_REGEX.test(formData.email.trim())) {
      return "Please enter a valid email address.";
    }

    if (formData.phone.trim() && !PHONE_REGEX.test(formData.phone.trim())) {
      return "Please enter a valid phone number (7 to 15 digits).";
    }

    if (formData.gstNumber.trim()) {
      const cleanGst = formData.gstNumber.trim().toUpperCase();
      if (!GST_REGEX.test(cleanGst)) {
        return "Invalid GST format. Must be 15 alphanumeric characters (e.g., 27ABCDE1234F1Z5).";
      }
    }

    if (formData.panNumber.trim()) {
      const cleanPan = formData.panNumber.trim().toUpperCase();
      if (!PAN_REGEX.test(cleanPan)) {
        return "Invalid PAN format. Must be 10 characters (e.g., ABCDE1234F).";
      }
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        ...formData,
        name: formData.name.trim(),
        code: formData.code.trim() || undefined,
        companyName: formData.companyName.trim() || undefined,
        contact: formData.contact.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
        address: formData.address.trim() || undefined,
        state: formData.state.trim() || undefined,
        gstNumber: formData.gstNumber.trim().toUpperCase() || undefined,
        panNumber: formData.panNumber.trim().toUpperCase() || undefined,
        bankName: formData.bankName.trim() || undefined,
        accountNumber: formData.accountNumber.trim() || undefined,
        ifscCode: formData.ifscCode.trim().toUpperCase() || undefined,
        notes: formData.notes.trim() || undefined,
        status: formData.status === "Inactive" ? "Inactive" : "Active",
      };

      if (isEditing) {
        await updateVendor(vendorToEdit.id, payload);
      } else {
        await createVendor(payload);
      }

      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || "Failed to save vendor.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-2xl bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden text-gray-900 my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                {isEditing ? "Edit Vendor Details" : "Add New Vendor"}
              </h3>
              <p className="text-xs text-gray-500">
                Super Admin centralized vendor & procurement master.
              </p>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          {/* Section: Basic Info */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-700 border-b border-gray-100 pb-1 flex items-center gap-1.5">
              <span>Basic & Company Information</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">
                  Vendor Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Apex Automotive Supplies"
                  required
                  className="w-full h-9 px-3 rounded-xl bg-gray-50/80 border border-gray-200 text-gray-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">
                  Company Name
                </label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => handleChange("companyName", e.target.value)}
                  placeholder="Apex Auto Enterprises Pvt Ltd"
                  className="w-full h-9 px-3 rounded-xl bg-gray-50/80 border border-gray-200 text-gray-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 flex items-center justify-between">
                  <span>Vendor Code</span>
                  {!isEditing && <span className="text-[10px] text-gray-400 font-normal">Auto-generated if empty</span>}
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => handleChange("code", e.target.value)}
                  placeholder={isEditing ? "VND-001" : "Auto-generated (e.g. VND-002)"}
                  className="w-full h-9 px-3 rounded-xl bg-gray-50/80 border border-gray-200 text-gray-900 text-sm uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">
                  Status <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleChange("status", e.target.value)}
                  className="w-full h-9 px-3 rounded-xl bg-gray-50/80 border border-gray-200 text-gray-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs font-semibold cursor-pointer"
                >
                  <option value="Active">ACTIVE</option>
                  <option value="Inactive">INACTIVE</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section: Contact & Address */}
          <div className="space-y-3 pt-2">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-700 border-b border-gray-100 pb-1">
              Contact & Address
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">
                  Contact Person
                </label>
                <input
                  type="text"
                  value={formData.contact}
                  onChange={(e) => handleChange("contact", e.target.value)}
                  placeholder="Rajesh Kumar"
                  className="w-full h-9 px-3 rounded-xl bg-gray-50/80 border border-gray-200 text-gray-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="9876543210"
                  className="w-full h-9 px-3 rounded-xl bg-gray-50/80 border border-gray-200 text-gray-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="vendor@company.com"
                  className="w-full h-9 px-3 rounded-xl bg-gray-50/80 border border-gray-200 text-gray-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">
                  State / Region
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => handleChange("state", e.target.value)}
                  placeholder="Maharashtra, Tamil Nadu, etc."
                  className="w-full h-9 px-3 rounded-xl bg-gray-50/80 border border-gray-200 text-gray-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-gray-700">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  placeholder="Plot 42, Industrial Area, Phase II"
                  className="w-full h-9 px-3 rounded-xl bg-gray-50/80 border border-gray-200 text-gray-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Section: Tax & Registration Details */}
          <div className="space-y-3 pt-2">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-700 border-b border-gray-100 pb-1">
              Tax & Registration Details
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">
                  GST Number
                </label>
                <input
                  type="text"
                  value={formData.gstNumber}
                  onChange={(e) => handleChange("gstNumber", e.target.value.toUpperCase())}
                  placeholder="27ABCDE1234F1Z5"
                  maxLength={15}
                  className="w-full h-9 px-3 rounded-xl bg-gray-50/80 border border-gray-200 text-gray-900 text-sm uppercase font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">
                  PAN Number
                </label>
                <input
                  type="text"
                  value={formData.panNumber}
                  onChange={(e) => handleChange("panNumber", e.target.value.toUpperCase())}
                  placeholder="ABCDE1234F"
                  maxLength={10}
                  className="w-full h-9 px-3 rounded-xl bg-gray-50/80 border border-gray-200 text-gray-900 text-sm uppercase font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Section: Bank & Payment Details */}
          <div className="space-y-3 pt-2">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-700 border-b border-gray-100 pb-1">
              Bank & Payment Details
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={formData.bankName}
                  onChange={(e) => handleChange("bankName", e.target.value)}
                  placeholder="HDFC Bank"
                  className="w-full h-9 px-3 rounded-xl bg-gray-50/80 border border-gray-200 text-gray-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">
                  Account Number
                </label>
                <input
                  type="text"
                  value={formData.accountNumber}
                  onChange={(e) => handleChange("accountNumber", e.target.value)}
                  placeholder="50200012345678"
                  className="w-full h-9 px-3 rounded-xl bg-gray-50/80 border border-gray-200 text-gray-900 text-sm font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">
                  IFSC Code
                </label>
                <input
                  type="text"
                  value={formData.ifscCode}
                  onChange={(e) => handleChange("ifscCode", e.target.value.toUpperCase())}
                  placeholder="HDFC0001234"
                  maxLength={11}
                  className="w-full h-9 px-3 rounded-xl bg-gray-50/80 border border-gray-200 text-gray-900 text-sm uppercase font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Section: Notes */}
          <div className="space-y-1.5 pt-2">
            <label className="text-xs font-bold text-gray-700">
              Notes & Remarks
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Primary supplier for synthetic engine oils and consumables. Payment terms: Net 30."
              className="w-full px-3 py-2 rounded-xl bg-gray-50/80 border border-gray-200 text-gray-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs resize-none"
            />
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {loading ? (
                <span>Saving...</span>
              ) : isEditing ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Update Vendor</span>
                </>
              ) : (
                <>
                  <Building2 className="w-4 h-4" />
                  <span>Create Vendor</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
