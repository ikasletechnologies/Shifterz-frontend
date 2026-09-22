"use client";
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any */

import React, { useState, useEffect } from "react";
import { createVendor, updateVendor } from "@/lib/api";
import { Building2, X, ShieldAlert } from "lucide-react";

interface AddVendorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  vendorToEdit?: any | null;
}

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
    gstNumber: "",
    contact: "",
    phone: "",
    email: "",
    address: "",
    status: "Active",
  });

  useEffect(() => {
    if (vendorToEdit) {
      setFormData({
        code: vendorToEdit.code || "",
        name: vendorToEdit.name || "",
        gstNumber: vendorToEdit.gstNumber || "",
        contact: vendorToEdit.contact || "",
        phone: vendorToEdit.phone || "",
        email: vendorToEdit.email || "",
        address: vendorToEdit.address || "",
        status: vendorToEdit.status || "Active",
      });
    } else {
      setFormData({
        code: `VND-${Math.floor(100 + Math.random() * 900)}`,
        name: "",
        gstNumber: "",
        contact: "",
        phone: "",
        email: "",
        address: "",
        status: "Active",
      });
    }
    setError(null);
  }, [vendorToEdit, open]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.name) {
      setError("Vendor Code and Name are required.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (isEditing) {
        await updateVendor(vendorToEdit.id, formData);
      } else {
        await createVendor(formData);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden text-gray-900">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                {isEditing ? "Edit Vendor Master" : "Add Vendor Master"}
              </h3>
              <p className="text-xs text-gray-500">
                Headquarters centralized supplier & vendor directory.
              </p>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">
                Vendor Code *
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => handleChange("code", e.target.value)}
                placeholder="VND-001"
                disabled={isEditing}
                className="w-full h-9 px-3 rounded-xl bg-gray-50/80 border border-gray-200 text-gray-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100 disabled:text-gray-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">
                Vendor Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Apex Automotive Supplies Ltd."
                required
                className="w-full h-9 px-3 rounded-xl bg-gray-50/80 border border-gray-200 text-gray-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">
                GST Number
              </label>
              <input
                type="text"
                value={formData.gstNumber}
                onChange={(e) => handleChange("gstNumber", e.target.value)}
                placeholder="27ABCDE1234F1Z5"
                className="w-full h-9 px-3 rounded-xl bg-gray-50/80 border border-gray-200 text-gray-900 text-sm uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">
                Contact Person
              </label>
              <input
                type="text"
                value={formData.contact}
                onChange={(e) => handleChange("contact", e.target.value)}
                placeholder="Rajesh Kumar"
                className="w-full h-9 px-3 rounded-xl bg-gray-50/80 border border-gray-200 text-gray-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">
                Mobile Number
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full h-9 px-3 rounded-xl bg-gray-50/80 border border-gray-200 text-gray-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                placeholder="orders@apexauto.com"
                className="w-full h-9 px-3 rounded-xl bg-gray-50/80 border border-gray-200 text-gray-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700">
              Address
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
              placeholder="Plot 42, MIDC Industrial Area, Mumbai, MH"
              className="w-full h-9 px-3 rounded-xl bg-gray-50/80 border border-gray-200 text-gray-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleChange("status", e.target.value)}
              className="w-full h-9 px-3 rounded-xl bg-gray-50/80 border border-gray-200 text-gray-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all disabled:opacity-50"
            >
              {loading ? "Saving..." : isEditing ? "Update Vendor" : "Create Vendor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
