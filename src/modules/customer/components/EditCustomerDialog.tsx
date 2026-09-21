"use client";
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any */

import { PhoneInput } from "@/components/common/PhoneInput";
import { useState, useEffect } from "react";
import { X, Pencil } from "lucide-react";
import { toast } from "react-hot-toast";
import { getVehicleType, formatVehicleNumber } from "@/utils/vehicleNumber";

interface EditCustomerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (customer: any) => void;
  customer: any | null;
  existingCustomers?: any[];
}

// Matches the backend's normalizeVehicleNo (strips all non-alphanumerics,
// uppercases) — see the same helper in AddCustomerDialog.tsx.
function normalizeVehicle(v?: string | null): string {
  return (v || "").replace(/[^A-Z0-9]/gi, "").toUpperCase();
}

export default function EditCustomerDialog({
  isOpen,
  onClose,
  onSubmit,
  customer,
  existingCustomers = [],
}: EditCustomerDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    vehicle: "",
    carModel: "",
  });

  useEffect(() => {
    if (customer && isOpen) {
      setFormData({
        name: customer.name || "",
        phone: customer.phone || "",
        email: customer.email || "",
        vehicle: customer.vehicle || "",
        carModel: customer.model || customer.carModel || "",
      });
    }
  }, [customer, isOpen]);


  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === "phone") {
      setFormData((prev) => ({ ...prev, [name]: value.replace(/\D/g, "").slice(0, 10) }));
    } else if (name === "vehicle") {
      setFormData((prev) => ({ ...prev, [name]: formatVehicleNumber(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Customer name is required");
      return;
    }
    if (!formData.phone.trim()) {
      // phone is the join key check-in/history matching uses throughout the
      // backend (findFirst({ where: { phone } })) — clearing it here would
      // silently orphan this customer from future visit auto-matching.
      toast.error("Phone number is required");
      return;
    }
    if (!formData.vehicle.trim()) {
      toast.error("Vehicle number is required");
      return;
    }
    if (!formData.carModel.trim()) {
      toast.error("Car model is required");
      return;
    }
    if (getVehicleType(formData.vehicle) === "INVALID") {
      toast.error("Vehicle number format: TN 04 AB 1234");
      return;
    }

    const isDuplicate = existingCustomers.some(
      (c) => c.id !== customer?.id && normalizeVehicle(c.vehicle) === normalizeVehicle(formData.vehicle)
    );
    if (isDuplicate) {
      toast.error("❌ This vehicle number already exists! Customer with this vehicle is already registered.");
      return;
    }

    const payload: Record<string, any> = {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      vehicle: formData.vehicle.trim(),
      model: formData.carModel.trim(),
    };
    if (formData.email && formData.email.trim()) {
      payload.email = formData.email.trim();
    }
    onSubmit(payload);
    onClose();
  };

  if (!isOpen || !customer) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-2xl p-4 sm:p-6 md:p-8 w-full max-w-xs sm:max-w-sm md:max-w-md shadow-2xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-blue-100 p-1.5 sm:p-2 rounded-lg">
              <Pencil className="w-5 sm:w-6 h-5 sm:h-6 text-blue-600" />
            </div>
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Edit Customer</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 sm:w-6 h-5 sm:h-6 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          {/* Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Full name"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-gray-50"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                Phone <span className="text-red-500">*</span>
              </label>
              <PhoneInput name="phone" value={formData.phone} onChange={handleChange} placeholder="XXXXX XXXXX" required />
            </div>
          </div>

          {/* Email & Vehicle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="email@example.com"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                Vehicle No. <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="vehicle"
                value={formData.vehicle}
                onChange={handleChange}
                placeholder="TN 04 XX 0000"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-gray-50 uppercase"
                required
              />
            </div>
          </div>

          {/* Car Model */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
              Car Model <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="carModel"
              value={formData.carModel}
              onChange={handleChange}
              placeholder="Toyota Fortuner"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-gray-50"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 sm:py-3 rounded-lg transition-colors flex items-center justify-center gap-2 mt-4 sm:mt-6 text-sm sm:text-base"
          >
            <Pencil className="w-4 h-4" />
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}
