"use client";

import { useState, useEffect } from "react";
import { X, Car, Calendar, User, CheckCircle2 } from "lucide-react";
import { formatVehicleNumber } from "@/utils/vehicleNumber";

interface VehicleDeliveryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  carData?: {
    id?: string;
    vehicleNo: string;
    model: string;
    customer: string;
    phone: string;
    service: string;
    odometer?: string;
    inTime?: string;
    outTime?: string;
    technician?: string;
  };
  cars?: any[];
  onSubmit?: (data: any) => void;
}

export default function VehicleDeliveryDialog({
  isOpen,
  onClose,
  carData,
  cars,
  onSubmit,
}: VehicleDeliveryDialogProps) {
  const [formData, setFormData] = useState({
    vehicleNo: "",
    model: "",
    customer: "",
    phone: "",
    service: "PPF Full Body",
    odometer: "",
    inTime: new Date().toISOString(),
    outTime: new Date().toISOString().slice(0, 16),
    technician: "",
    security: "",
    remarks: "",
  });

  useEffect(() => {
    if (isOpen) {
      if (carData) {
        setFormData({
          vehicleNo: carData.vehicleNo || "",
          model: carData.model || "",
          customer: carData.customer || "",
          phone: carData.phone || "",
          service: carData.service || "PPF Full Body",
          odometer: carData.odometer || "",
          inTime: carData.inTime || new Date().toISOString(),
          outTime: carData.outTime ? new Date(carData.outTime).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
          technician: carData.technician || "",
          security: "",
          remarks: "",
        });
      } else {
        setFormData({
          vehicleNo: "",
          model: "",
          customer: "",
          phone: "",
          service: "PPF Full Body",
          odometer: "",
          inTime: new Date().toISOString(),
          outTime: new Date().toISOString().slice(0, 16),
          technician: "",
          security: "",
          remarks: "",
        });
      }
    }
  }, [carData, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === "phone") {
      setFormData((prev) => ({ ...prev, [name]: value.replace(/\D/g, "").slice(0, 10) }));
    } else if (name === "vehicleNo") {
      const formatted = formatVehicleNumber(value);
      const cleanNorm = formatted.replace(/\s+/g, "").toUpperCase();
      const matched = cars?.find((c) => {
        const v = (c.vehicleNo || c.vehicle || c.vehicleNumber || "").replace(/\s+/g, "").toUpperCase();
        return cleanNorm.length >= 4 && v === cleanNorm;
      });

      if (matched) {
        setFormData((prev) => ({
          ...prev,
          vehicleNo: formatted,
          model: matched.model || prev.model,
          customer: matched.customer || prev.customer,
          phone: matched.phone || prev.phone,
          service: matched.service || prev.service,
          odometer: matched.odometer || prev.odometer,
          inTime: matched.inTime || prev.inTime,
          technician: matched.technician || prev.technician,
        }));
      } else {
        setFormData((prev) => ({ ...prev, vehicleNo: formatted }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit({
        ...carData,
        ...formData,
      });
    }
    onClose();
  };

  const formatDateTimeStr = (input?: string) => {
    if (!input) return "—";
    const d = new Date(input);
    if (isNaN(d.getTime())) return input;
    const dateFormatted = d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const timeFormatted = d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    return `${dateFormatted}, ${timeFormatted}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 text-amber-500 rounded-xl">
              <Car className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Vehicle Check-Out</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Row 1: Vehicle Number & Car Model */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Vehicle Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="vehicleNo"
                value={formData.vehicleNo}
                onChange={handleChange}
                placeholder="TN 04 XX 0000"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm text-gray-900 placeholder:text-gray-300 uppercase bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Car Model <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleChange}
                placeholder="Toyota Fortuner"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm text-gray-900 placeholder:text-gray-300 bg-white"
                required
              />
            </div>
          </div>

          {/* Row 2: Customer Name & Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Customer Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="customer"
                value={formData.customer}
                onChange={handleChange}
                placeholder="Full name"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm text-gray-900 placeholder:text-gray-300 bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Phone <span className="text-red-500">*</span>
              </label>
              <div className="flex border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-amber-400 bg-white">
                <span className="px-3.5 py-3 bg-gray-50/80 text-gray-600 text-sm font-medium border-r border-gray-200 flex items-center shrink-0">
                  +91
                </span>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="XXXXX XXXXX"
                  className="w-full px-3.5 py-3 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none bg-transparent"
                  required
                />
              </div>
            </div>
          </div>

          {/* Row 3: Service & Odometer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Service <span className="text-red-500">*</span>
              </label>
              <select
                name="service"
                value={formData.service}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm text-gray-900 bg-white cursor-pointer"
                required
              >
                <option value="PPF Full Body">PPF Full Body</option>
                <option value="PPF Bonnet">PPF Bonnet</option>
                <option value="C3 Coating">C3 Coating</option>
                <option value="Graphene Coating">Graphene Coating</option>
                <option value="Interior Detailing">Interior Detailing</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Odometer (KM) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="odometer"
                value={formData.odometer}
                onChange={handleChange}
                placeholder="42500"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm text-gray-900 placeholder:text-gray-300 bg-white"
                required
              />
            </div>
          </div>

          {/* Section 4: Inner Bordered Box for Check-In, Check-Out, Technician, Security Guard */}
          <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-200/80 grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-2">
            {/* Check-In Date & Time */}
            <div className="bg-white p-3.5 rounded-xl border border-gray-200/60 shadow-2xs">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">CHECK-IN DATE & TIME</p>
              <p className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                {formatDateTimeStr(formData.inTime)}
              </p>
            </div>

            {/* Check-Out Date & Time */}
            <div className="bg-white p-3.5 rounded-xl border border-gray-200/60 shadow-2xs">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                CHECK-OUT DATE & TIME <span className="text-red-500">*</span>
              </p>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                <input
                  type="datetime-local"
                  name="outTime"
                  value={formData.outTime}
                  onChange={handleChange}
                  className="w-full text-xs font-bold text-gray-900 bg-transparent border-none p-0 focus:outline-none cursor-pointer"
                  required
                />
              </div>
            </div>

            {/* Technician (Assigned) - Rendered ONLY when a technician is assigned */}
            {Boolean(formData.technician && formData.technician.trim() !== "" && formData.technician !== "Unassigned" && formData.technician !== "None") && (
              <div className="bg-white p-3.5 rounded-xl border border-gray-200/60 shadow-2xs flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 font-bold">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">TECHNICIAN (ASSIGNED)</p>
                  <p className="text-xs font-bold text-gray-900">{formData.technician}</p>
                  <p className="text-[10px] text-gray-400 font-medium">(Assigned from Job Card)</p>
                </div>
              </div>
            )}

            {/* Checked By (Security Guard) */}
            <div className={`bg-white p-3.5 rounded-xl border border-gray-200/60 shadow-2xs flex flex-col justify-center ${
              !formData.technician || formData.technician.trim() === "" || formData.technician === "Unassigned" || formData.technician === "None" ? "md:col-span-2" : ""
            }`}>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                CHECKED BY (SECURITY GUARD) <span className="text-red-500">*</span>
              </p>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400 shrink-0" />
                <input
                  type="text"
                  name="security"
                  value={formData.security}
                  onChange={handleChange}
                  placeholder="Enter security guard name"
                  className="w-full text-xs font-semibold text-gray-900 placeholder:text-gray-400 bg-transparent border-none p-0 focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* Row 5: Remarks */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
              REMARKS
            </label>
            <textarea
              name="remarks"
              value={formData.remarks}
              onChange={handleChange}
              placeholder="All clear. Washed and ready."
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none text-xs font-medium bg-white"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-base cursor-pointer shadow-md"
          >
            <CheckCircle2 className="w-5 h-5" />
            Mark as Delivered
          </button>
        </form>
      </div>
    </div>
  );
}
