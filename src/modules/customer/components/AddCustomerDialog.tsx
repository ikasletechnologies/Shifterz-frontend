"use client";
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any */

import { useState } from "react";
import { X, Users } from "lucide-react";
import { toast } from "react-hot-toast";

interface AddCustomerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (customer: any) => void;
  existingCustomers?: any[];
}

export default function AddCustomerDialog({
  isOpen,
  onClose,
  onSubmit,
  existingCustomers = [],
}: AddCustomerDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    vehicle: "",
    carModel: "",
  });

  const formatVehicleNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, "").toUpperCase();
    if (cleaned.length === 0) return "";

    let formatted = "";
    formatted += cleaned.substring(0, 2);
    if (cleaned.length > 2) formatted += " " + cleaned.substring(2, 4);
    if (cleaned.length > 4) formatted += " " + cleaned.substring(4, 6);
    if (cleaned.length > 6) formatted += " " + cleaned.substring(6, 10);

    return formatted;
  };

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

    // Validate vehicle number format if provided: TN 04 AB 1234
    if (formData.vehicle.trim()) {
      const vehicleRegex = /^[A-Z]{2}\s\d{2}\s[A-Z]{1,2}\s\d{1,4}$/;
      if (!vehicleRegex.test(formData.vehicle)) {
        toast.error("Vehicle number format: TN 04 AB 1234 (State Code, RTO, Series, Number)");
        return;
      }

      // Check for duplicate vehicle number
      const isDuplicate = existingCustomers.some(
        (customer) => customer.vehicle?.toUpperCase() === formData.vehicle.toUpperCase()
      );
      if (isDuplicate) {
        toast.error("❌ This vehicle number already exists! Customer with this vehicle is already registered.");
        return;
      }
    }

    if (onSubmit) {
      onSubmit(formData);
    }

    setFormData({
      name: "",
      phone: "",
      email: "",
      vehicle: "",
      carModel: "",
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-2xl p-4 sm:p-6 md:p-8 w-full max-w-xs sm:max-w-sm md:max-w-md shadow-2xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-yellow-400 p-1.5 sm:p-2 rounded-lg">
              <Users className="w-5 sm:w-6 h-5 sm:h-6 text-gray-900" />
            </div>
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Add Customer</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 sm:w-6 h-5 sm:h-6 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          {/* Row 1: Name & Phone */}
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
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent bg-gray-50"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 XXXXX XXXXX"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent bg-gray-50"
                minLength={10}
                maxLength={10}
                pattern="[0-9]{10}"
                onInvalid={(e) => {
                  e.preventDefault();
                  toast.error("Phone number must be exactly 10 digits");
                }}
              />
            </div>
          </div>

          {/* Row 2: Email & Vehicle No */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="email@example.com"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                Vehicle No.
              </label>
              <input
                type="text"
                name="vehicle"
                value={formData.vehicle}
                onChange={handleChange}
                placeholder="TN 04 XX 0000"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent bg-gray-50 uppercase"
              />
            </div>
          </div>

          {/* Row 3: Car Model */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
              Car Model
            </label>
            <input
              type="text"
              name="carModel"
              value={formData.carModel}
              onChange={handleChange}
              placeholder="Toyota Fortuner"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent bg-gray-50"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-2 sm:py-3 rounded-lg transition-colors flex items-center justify-center gap-2 mt-4 sm:mt-6 text-sm sm:text-base"
          >
            ✓ Save
          </button>
        </form>
      </div>
    </div>
  );
}
