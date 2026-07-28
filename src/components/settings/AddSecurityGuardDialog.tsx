"use client";

import { PhoneInput } from "@/components/common/PhoneInput";
import { useState } from "react";
import { X, Shield } from "lucide-react";

interface AddSecurityGuardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (guardData: {
    name: string;
    phone: string;
    shift: string;
  }) => void;
}

export default function AddSecurityGuardDialog({
  isOpen,
  onClose,
  onSubmit,
}: AddSecurityGuardDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    shift: "Day",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === "phone") {
      setFormData((prev) => ({ ...prev, [name]: value.replace(/\D/g, "").slice(0, 10) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("Please enter guard name");
      return;
    }
    if (onSubmit) {
      onSubmit(formData);
    }
    setFormData({
      name: "",
      phone: "",
      shift: "Day",
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-red-500" />
            <h2 className="text-2xl font-bold text-gray-900">Add Security Guard</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
              Guard Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter guard name"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
              required
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
              Phone Number
            </label>
            <PhoneInput
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="XXXXX XXXXX"
            />
          </div>

          {/* Shift */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
              Shift
            </label>
            <select
              name="shift"
              value={formData.shift}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent bg-white"
            >
              <option>Day</option>
              <option>Night</option>
              <option>Both</option>
            </select>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 mt-6"
          >
            ✓ Add Security Guard
          </button>
        </form>
      </div>
    </div>
  );
}
