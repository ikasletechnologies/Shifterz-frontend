"use client";

import { X, Car, User, Phone, Wrench, Clock, FileText, Gauge, CalendarCheck2, Calendar } from "lucide-react";
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-gray-50 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-200">

        {/* Banner Header */}
        <div className="relative bg-white p-6 sm:p-8 text-gray-900 border-b border-gray-100 overflow-hidden">
          <div className="absolute top-4 right-4 flex items-center gap-2 z-50">
            <button
              onClick={onClose}
              className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 rounded-full transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-3.5 relative z-10">
            {/* Standalone Car Icon */}
            <Car className="w-6 h-6 sm:w-7 sm:h-7 text-gray-800 shrink-0" />

            {/* Plain Text Info */}
            <div>
              {/* Vehicle Number - Reduced size */}
              <h2 className="text-lg sm:text-sm font-bold text-gray-900 tracking-tight font-mono leading-none">
                {displayVehicleNo}
              </h2>
              {/* Vehicle Model - Directly Below */}
              <p className="text-xs sm:text-sm font-semibold text-gray-500 mt-1 leading-tight">
                {carData.model || "Unknown Model"}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 relative">

          {/* Customer Card */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 text-gray-800 font-bold border-b border-gray-50 pb-3">
              <User className="w-4 h-4 text-blue-500" /> Customer Details
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Name</p>
              <p className="font-bold text-gray-900">{carData.customer}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Phone</p>
              <p className="font-bold text-gray-900 flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-gray-400" />
                {carData.phone}
              </p>
            </div>
          </div>

          {/* Service Card */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 text-gray-800 font-bold border-b border-gray-50 pb-3">
              <Wrench className="w-4 h-4 text-orange-500" /> Service Info
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Service Required</p>
              <p className="font-bold text-gray-900">{carData.service}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Odometer</p>
              <p className="font-bold text-gray-900 flex items-center gap-1">
                <Gauge className="w-3 h-3 text-gray-400" />
                {carData.odometer || "42,500 km"}
              </p>
            </div>
          </div>

          {/* Check-In Date Card */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 text-gray-800 font-bold border-b border-gray-50 pb-3 mb-1">
              <Calendar className="w-4 h-4 text-emerald-600" /> Check-In Date
            </div>
            <div>
              <p className="font-extrabold text-gray-900 text-base">{checkInParsed.date}</p>
            </div>
          </div>

          {/* Check-In Time Card */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 text-gray-800 font-bold border-b border-gray-50 pb-3 mb-1">
              <Clock className="w-4 h-4 text-emerald-600" /> Check-In Time
            </div>
            <div>
              <p className="font-extrabold text-gray-900 text-base font-mono">{checkInParsed.time || "—"}</p>
            </div>
          </div>

          {/* Check-Out Date Card */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 text-gray-800 font-bold border-b border-gray-50 pb-3 mb-1">
              <CalendarCheck2 className="w-4 h-4 text-purple-600" /> Check-Out Date
            </div>
            <div>
              <p className="font-extrabold text-gray-900 text-base">{checkOutParsed.date}</p>
            </div>
          </div>

          {/* Check-Out Time Card */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 text-gray-800 font-bold border-b border-gray-50 pb-3 mb-1">
              <Clock className="w-4 h-4 text-purple-600" /> Check-Out Time
            </div>
            <div>
              <p className="font-extrabold text-gray-900 text-base font-mono">{checkOutParsed.time || "—"}</p>
            </div>
          </div>

          {/* Notes */}
          <div className="md:col-span-2 bg-gradient-to-r from-yellow-50 to-amber-50 p-5 rounded-2xl border border-yellow-200/50 shadow-sm relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#f59e0b 1px, transparent 1px)', backgroundSize: '16px 16px' }} />

            <div className="relative z-10">
              <div className="flex items-center gap-2 text-yellow-800 font-bold mb-3">
                <FileText className="w-4 h-4 text-yellow-600" /> Notes
              </div>
              <p className="text-sm font-semibold text-yellow-900 leading-relaxed">
                {carData.notes || "No notes provided."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
