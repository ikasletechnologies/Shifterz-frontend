"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { PhoneInput } from "@/components/common/PhoneInput";
import { useState, useEffect } from "react";
import { X, Ticket } from "lucide-react";
import { toast } from "react-hot-toast";
import { getVehicleType, formatVehicleNumber } from "@/utils/vehicleNumber";
import { getServices, getEmployees, getSettings } from "@/lib/api";

interface NewOutPassDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: any) => void;
  initialData?: any;
  // True when `initialData` only prefills a brand-new pass (e.g. from a Job
  // Card) rather than editing an existing rejected pass — without this, any
  // truthy `initialData` was treated as "editing" (wrong header/button label,
  // and customerConfirmation defaulted to true without the user actually
  // checking the box).
  isPrefillOnly?: boolean;
}

export default function NewOutPassDialog({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isPrefillOnly = false,
}: NewOutPassDialogProps) {
  const isEditingExisting = Boolean(initialData) && !isPrefillOnly;
  const [formData, setFormData] = useState({
    vehicleNumber: "",
    carModel: "",
    customerName: "",
    phone: "",
    service: "",
    technician: "",
    outTime: "",
    security: "",
    destination: "",
    reason: "",
    customerConfirmation: false,
  });

  // Real data instead of hardcoded fake names — technicians/services mirror
  // the exact fetch pattern CreateJobCardDialog.tsx already uses; security
  // guards come from the same backend-managed list Settings → Security
  // Guards manages (getSettings().securityGuards), not an invented list.
  const [serviceCatalog, setServiceCatalog] = useState<{ id: string; name: string }[]>([]);
  const [technicians, setTechnicians] = useState<{ id: string; name: string }[]>([]);
  const [securityGuards, setSecurityGuards] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    getServices()
      .then((list) => setServiceCatalog((list || []).filter((s: any) => (s.status || "Active") === "Active")))
      .catch((err) => console.error("Failed to load service catalog:", err));
    getEmployees()
      .then((emps) => setTechnicians(
        (emps || [])
          .filter((emp: any) => emp.role === "TECHNICIAN" && emp.status === "Active")
          .map((emp: any) => ({ id: emp.id, name: emp.name }))
      ))
      .catch((err) => console.error("Failed to load technicians:", err));
    getSettings()
      .then((data) => setSecurityGuards(data?.securityGuards || []))
      .catch((err) => console.error("Failed to load security guards:", err));
  }, [isOpen]);

  useEffect(() => {
    if (initialData && isOpen) {
      setFormData({
        vehicleNumber: initialData.vehicle || "",
        carModel: initialData.model || "",
        customerName: initialData.customer || "",
        phone: initialData.phone || "",
        service: initialData.service || "",
        technician: initialData.technicianName || initialData.technician || "",
        outTime: initialData.outTime ? new Date(initialData.outTime).toISOString().slice(0,16) : "",
        security: initialData.securityName || initialData.security || "",
        destination: initialData.destination || "",
        reason: initialData.remarks || initialData.reason || "",
        customerConfirmation: !isPrefillOnly,
      });
    } else if (!isOpen) {
      setFormData({
        vehicleNumber: "",
        carModel: "",
        customerName: "",
        phone: "",
        service: "",
        technician: "",
        outTime: "",
        security: "",
        destination: "",
        reason: "",
        customerConfirmation: false,
      });
    }
  }, [initialData, isOpen, isPrefillOnly]);


  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    if (name === "phone") {
      setFormData((prev) => ({ ...prev, [name]: value.replace(/\D/g, "").slice(0, 10) }));
    } else if (name === "vehicleNumber") {
      setFormData((prev) => ({ ...prev, [name]: formatVehicleNumber(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate vehicle number format: TN 04 AB 1234
    if (getVehicleType(formData.vehicleNumber) === "INVALID") {
      toast.error("Vehicle number format: TN 04 AB 1234 (State Code, RTO, Series, Number)");
      return;
    }

    if (!formData.customerConfirmation) {
      toast.error("Customer confirmation is required before generating an Outpass.");
      return;
    }

    if (onSubmit) {
      // Neither the backend's outpass schema nor its Prisma model has a
      // `destination` column — it was required in this form but silently
      // discarded on submit. Folding it into `remarks` (a real, persisted
      // field) instead of just deleting the input keeps that data from being
      // lost outright.
      const remarks = [
        formData.destination.trim() && `Destination: ${formData.destination.trim()}`,
        formData.reason.trim(),
      ].filter(Boolean).join(" — ");
      onSubmit({
        vehicle: formData.vehicleNumber,
        model: formData.carModel,
        customer: formData.customerName,
        phone: formData.phone,
        service: formData.service,
        outTime: formData.outTime || new Date().toISOString(),
        securityName: formData.security,
        technicianName: formData.technician,
        remarks,
        customerConfirmation: true,
      });
    }
    setFormData({
      vehicleNumber: "",
      carModel: "",
      customerName: "",
      phone: "",
      service: "",
      technician: "",
      outTime: "",
      security: "",
      destination: "",
      reason: "",
      customerConfirmation: false,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 sm:p-6 md:p-8 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Ticket className="w-6 h-6 text-yellow-500" />
            <h2 className="text-2xl font-bold text-gray-900">
              {isEditingExisting ? "Edit Out Pass" : "New Out Pass"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Row 1: Vehicle Number & Car Model */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Vehicle Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="vehicleNumber"
                value={formData.vehicleNumber}
                onChange={handleChange}
                placeholder="KL 01 CD 5678"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent uppercase"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Car Model <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="carModel"
                value={formData.carModel}
                onChange={handleChange}
                placeholder="Honda City"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Row 2: Customer Name & Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Customer Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
                placeholder="Full name"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Phone
              </label>
              <PhoneInput
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="XXXXX XXXXX"
              />
            </div>
          </div>

          {/* Row 3: Service & Technician */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Service <span className="text-red-500">*</span>
              </label>
              <select
                name="service"
                value={formData.service}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent bg-white"
                required
              >
                <option value="">Select service</option>
                {serviceCatalog.map((s) => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
              {serviceCatalog.length === 0 && (
                <p className="text-xs text-gray-400 mt-1">No active services in the catalog — add one under Dashboard → Services.</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Technician <span className="text-red-500">*</span>
              </label>
              <select
                name="technician"
                value={formData.technician}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent bg-white"
                required
              >
                <option value="">Select technician</option>
                {technicians.map((t) => (
                  <option key={t.id} value={t.name}>{t.name}</option>
                ))}
              </select>
              {technicians.length === 0 && (
                <p className="text-xs text-gray-400 mt-1">No active technicians found — add one under Dashboard → Technicians.</p>
              )}
            </div>
          </div>

          {/* Row 4: Out Time & Security */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Out Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                name="outTime"
                value={formData.outTime}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Security Guard <span className="text-red-500">*</span>
              </label>
              <select
                name="security"
                value={formData.security}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent bg-white"
                required
              >
                <option value="">Select security guard</option>
                {securityGuards.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              {securityGuards.length === 0 && (
                <p className="text-xs text-gray-400 mt-1">No security guards configured — add one under Settings → Security Guards.</p>
              )}
            </div>
          </div>

          {/* Row 5: Destination & Reason */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Destination <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="destination"
                value={formData.destination}
                onChange={handleChange}
                placeholder="Test drive location"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Reason <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                placeholder="Test drive / Delivery"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Customer Confirmation */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-[10px] font-bold text-yellow-700 uppercase tracking-wider mb-2">Customer Confirmation</p>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.customerConfirmation}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, customerConfirmation: e.target.checked }))
                }
                className="mt-0.5 h-4 w-4 rounded border-yellow-400 text-yellow-500 focus:ring-yellow-400 shrink-0"
              />
              <span className="text-xs font-semibold text-yellow-900 leading-tight">
                I confirm that the customer has been notified and has agreed to this vehicle leaving the premises.
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isEditingExisting ? "✓ Update Pass" : "✓ Generate Pass"}
          </button>
        </form>
      </div>
    </div>
  );
}
