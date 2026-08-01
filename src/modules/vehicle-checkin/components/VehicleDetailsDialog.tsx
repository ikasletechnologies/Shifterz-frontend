"use client";

import { X, Car, User, Phone, Wrench, Clock, FileText, Gauge, CalendarCheck2, Calendar, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

interface CarData {
  id?: string;
  vehicleNo: string;
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
        <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8 text-white overflow-hidden">
          {/* Decorative background circle */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/5 blur-3xl pointer-events-none" />

          <div className="absolute top-4 right-4 flex items-center gap-2 z-50">
            {onDelete && carData && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDelete(carData);
                }}
                className="p-2 bg-red-500/20 hover:bg-red-500/40 text-red-300 hover:text-white rounded-full transition-colors backdrop-blur-md cursor-pointer"
                title="Delete Entry"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-md cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="flex items-center gap-5 relative z-10">
            <div className="p-4 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl shadow-[0_0_30px_rgba(250,204,21,0.3)]">
              <Car className="w-8 h-8 text-yellow-950" />
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tight">{carData.model || "Unknown Model"}</h2>
              <div className="flex items-center gap-3 mt-2">
                <span className="px-3 py-1 rounded-lg bg-white/10 text-yellow-400 font-mono text-sm font-bold border border-white/10 shadow-inner">
                  {carData.vehicleNo}
                </span>
              </div>
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

          {/* Check-In Date Card (Left) */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 text-gray-800 font-bold border-b border-gray-50 pb-3 mb-1">
              <Calendar className="w-4 h-4 text-emerald-600" /> Check-In Date
            </div>
            <div>
              <p className="font-extrabold text-gray-900 text-base">{checkInParsed.date}</p>
            </div>
          </div>

          {/* Check-In Time Card (Right) */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 text-gray-800 font-bold border-b border-gray-50 pb-3 mb-1">
              <Clock className="w-4 h-4 text-emerald-600" /> Check-In Time
            </div>
            <div>
              <p className="font-extrabold text-gray-900 text-base font-mono">{checkInParsed.time || "—"}</p>
            </div>
          </div>

          {/* Notes */}
          <div className="md:col-span-2 bg-gradient-to-r from-yellow-50 to-amber-50 p-5 rounded-2xl border border-yellow-200/50 shadow-sm relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#f59e0b 1px, transparent 1px)', backgroundSize: '16px 16px' }} />

            <div className="relative z-10">
              <div className="flex items-center gap-2 text-yellow-800 font-bold mb-3">
                <FileText className="w-4 h-4 text-yellow-600" /> Special Notes
              </div>
              <p className="text-sm font-semibold text-yellow-900 leading-relaxed">
                {carData.notes || "No special notes provided."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
