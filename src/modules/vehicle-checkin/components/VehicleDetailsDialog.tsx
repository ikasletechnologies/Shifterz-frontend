"use client";

import { X, Car, Clock, Calendar, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

interface CarData {
  id?: string;
  vehicleNo?: string;
  vehicle?: string;
  vehicleNumber?: string;
  model: string;
  customer: string;
  phone: string;
  service: string;
  technician?: string;
  inTime: string;
  outTime: string | null;
  status: string;
  odometer?: string;
  notes?: string;
}

interface CarDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  carData?: CarData;
  onDeliver?: (car: CarData) => void;
  onDelete?: (car: CarData) => void;
}

function formatDateAndTime(dateStr?: string | null) {
  if (!dateStr) return { date: "—", time: "Pending" };
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    return { date: dateStr, time: "" };
  }
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
  return { date: dateFormatted, time: timeFormatted };
}

export default function CarDetailsDialog({ isOpen, onClose, carData, onDeliver, onDelete }: CarDetailsDialogProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isOpen || !carData) return null;

  const checkInParsed = formatDateAndTime(carData.inTime);
  const checkOutParsed = carData.outTime ? formatDateAndTime(carData.outTime) : { date: "—", time: "Pending" };
  const displayVehicleNo = carData.vehicleNo || carData.vehicle || carData.vehicleNumber || "—";

  const fields: { label: string; value: string }[] = [
    { label: "Vehicle Number", value: displayVehicleNo },
    { label: "Car Model", value: carData.model || "—" },
    { label: "Customer Name", value: carData.customer || "—" },
    { label: "Phone", value: carData.phone || "—" },
    { label: "Service", value: carData.service || "—" },
    { label: "Odometer (KM)", value: carData.odometer || "—" },
  ];

  const canDeliver = Boolean(onDeliver) && carData.status !== "Delivered" && carData.status !== "Out";
  // Read-only values use the same box as the Vehicle Details & Update form's disabled inputs.
  const valueBox = "w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 bg-white min-h-[46px] break-words";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-lg p-4 sm:p-6 md:p-8 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3 min-w-0">
            <Car className="w-6 h-6 text-yellow-500 shrink-0" />
            <h2 className="text-xl font-bold text-gray-900 truncate">Vehicle Details</h2>
          </div>

          <div className="flex items-center gap-2">
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(carData)}
                className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors cursor-pointer"
                title="Delete Entry"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 cursor-pointer"
              title="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Vehicle, customer and service fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {fields.map((field) => (
              <div key={field.label}>
                <p className="block text-sm font-semibold text-gray-700 mb-2">{field.label}</p>
                <p className={`${valueBox} ${field.label === "Vehicle Number" ? "uppercase" : ""}`}>{field.value}</p>
              </div>
            ))}
          </div>

          {/* Check-In & Check-Out */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs">
            <div>
              <p className="font-bold text-gray-500 uppercase tracking-wider mb-1">Check-In Date</p>
              <p className="font-semibold text-gray-900 flex items-center gap-1.5 text-sm">
                <Calendar className="w-4 h-4 text-emerald-600" />
                {checkInParsed.date}
              </p>
            </div>
            <div>
              <p className="font-bold text-gray-500 uppercase tracking-wider mb-1">Check-In Time</p>
              <p className="font-semibold text-gray-900 flex items-center gap-1.5 text-sm">
                <Clock className="w-4 h-4 text-emerald-600" />
                {checkInParsed.time || "—"}
              </p>
            </div>
            <div>
              <p className="font-bold text-gray-500 uppercase tracking-wider mb-1">Check-Out Date</p>
              <p className="font-semibold text-gray-900 flex items-center gap-1.5 text-sm">
                <Calendar className="w-4 h-4 text-emerald-600" />
                {checkOutParsed.date}
              </p>
            </div>
            <div>
              <p className="font-bold text-gray-500 uppercase tracking-wider mb-1">Check-Out Time</p>
              <p className="font-semibold text-gray-900 flex items-center gap-1.5 text-sm">
                <Clock className="w-4 h-4 text-emerald-600" />
                {checkOutParsed.time || "—"}
              </p>
            </div>
          </div>

          {/* Notes */}
          <div>
            <p className="block text-sm font-semibold text-gray-700 mb-2">Notes / Condition</p>
            <p className={`${valueBox} min-h-[110px] whitespace-pre-wrap`}>{carData.notes || "—"}</p>
          </div>

          {/* Action */}
          {canDeliver && onDeliver ? (
            <button
              type="button"
              onClick={() => onDeliver(carData)}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-3.5 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md text-base cursor-pointer"
            >
              Deliver / Check Out
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-lg transition-colors border border-gray-300 flex items-center justify-center gap-2 cursor-pointer"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
