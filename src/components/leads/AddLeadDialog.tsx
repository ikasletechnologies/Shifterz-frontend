"use client";
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any */

import { useState } from "react";
import { X, User } from "lucide-react";
import { toast } from "react-hot-toast";
import { fetchVehicleDetails } from "@/lib/api";

interface AddLeadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (lead: any) => void;
}

export default function AddLeadDialog({
  isOpen,
  onClose,
  onSubmit,
}: AddLeadDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    vehicle: "",
    source: "JustDial",
    service: "PPF Full Body",
    assigned: "Arjun",
    budget: "",
    notes: "",
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
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
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

  const handleVehicleBlur = async () => {
    if (formData.vehicle.length > 4 && (!formData.name || !formData.phone)) {
      try {
        const details = await fetchVehicleDetails(formData.vehicle);
        if (details && details.name) {
          setFormData((prev) => ({
            ...prev,
            name: prev.name || details.name,
            phone: prev.phone || details.phone,
            email: prev.email || details.email || prev.email,
          }));
          toast.success("Customer details auto-filled!");
        }
      } catch (error) {
        // Ignore if vehicle not found
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate vehicle number format if provided: TN 04 AB 1234
    if (formData.vehicle.trim()) {
      const vehicleRegex = /^[A-Z]{2}\s\d{2}\s[A-Z]{1,2}\s\d{1,4}$/;
      if (!vehicleRegex.test(formData.vehicle)) {
        toast.error("Vehicle number format: TN 04 AB 1234 (State Code, RTO, Series, Number)");
        return;
      }
    }

    if (onSubmit) {
      const newLead = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        vehicle: formData.vehicle,
        source: formData.source,
        service: formData.service,
        assigned: formData.assigned,
        budget: `₹${formData.budget}`,
        status: "New",
        date: new Date().toISOString().split("T")[0],
      };
      onSubmit(newLead);
    }
    setFormData({
      name: "",
      email: "",
      phone: "",
      vehicle: "",
      source: "JustDial",
      service: "PPF Full Body",
      assigned: "Arjun",
      budget: "",
      notes: "",
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 sm:p-6 md:p-8 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <User className="w-6 h-6 text-yellow-500" />
            <h2 className="text-2xl font-bold text-gray-900">New Lead</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Name & Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Full name"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent bg-gray-50 text-gray-900"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 XXXXX XXXXX"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent bg-gray-50 text-gray-900"
                required
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

          {/* Row 2: Email & Vehicle No. */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="email@example.com"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent bg-gray-50 text-gray-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                Vehicle No.
              </label>
              <input
                type="text"
                name="vehicle"
                value={formData.vehicle}
                onChange={handleChange}
                onBlur={handleVehicleBlur}
                placeholder="TN 04 XX 0000"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent bg-gray-50 text-gray-900 uppercase"
              />
            </div>
          </div>

          {/* Row 3: Source & Service */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                Source <span className="text-red-500">*</span>
              </label>
              <select
                name="source"
                value={formData.source}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent bg-gray-50 text-gray-900"
                required
              >
                <option>JustDial</option>
                <option>Instagram</option>
                <option>Referral</option>
                <option>Facebook</option>
                <option>Walk-in</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                Service Interested
              </label>
              <select
                name="service"
                value={formData.service}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent bg-gray-50 text-gray-900"
              >
                <option>PPF Full Body</option>
                <option>PPF Bonnet + Roof</option>
                <option>PPF Partial (Hood)</option>
                <option>C3 Pro Coating</option>
                <option>Ceramic Coating</option>
                <option>Graphene Coating</option>
                <option>Interior Detailing</option>
                <option>Paint Correction (1-step)</option>
                <option>Full Paint Correction</option>
                <option>Window Tinting</option>
              </select>
            </div>
          </div>

          {/* Row 4: Assign To & Budget */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                Assign To
              </label>
              <select
                name="assigned"
                value={formData.assigned}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent bg-gray-50 text-gray-900"
              >
                <option>Arjun</option>
                <option>Sathish</option>
                <option>Kumar</option>
                <option>Rajesh</option>
                <option>Mani</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                Expected Budget (₹)
              </label>
              <input
                type="number"
                name="budget"
                value={formData.budget}
                onChange={handleChange}
                placeholder="00000"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent bg-gray-50 text-gray-900"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Additional notes..."
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent bg-gray-50 resize-none text-gray-900"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            ✓ Save Lead
          </button>
        </form>
      </div>
    </div>
  );
}
