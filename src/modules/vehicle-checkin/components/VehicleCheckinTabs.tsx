"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Car,
  User,
  Phone,
  Clock,
  Calendar,
  Wrench,
  ShieldCheck,
  ShieldAlert,
  Eye,
  Edit,
  Trash2,
  FileSpreadsheet,
  FileText,
  Briefcase,
  CheckCircle2,
} from "lucide-react";
import { CarEntry, hasCompletedInspection } from "../types/vehicle-checkin.types";
import { calculateDuration, formatDate, formatTime, formatCarId } from "@/lib/timeUtils";
import { StatusText } from "@/components/common/StatusText";

interface VehicleCheckinTabsProps {
  cars: CarEntry[];
  onViewDetails: (car: CarEntry) => void;
  onEdit: (car: CarEntry) => void;
  onDelivery: (car: CarEntry) => void;
  onInspection: (car: CarEntry) => void;
  onDownloadExcel: (car: CarEntry) => void;
  onDownloadPdf: (car: CarEntry) => void;
  onDelete?: (car: CarEntry) => void;
  showFranchise?: boolean;
}

export function VehicleCheckinTabs({
  cars,
  onViewDetails,
  onEdit,
  onDelivery,
  onInspection,
  onDownloadExcel,
  onDownloadPdf,
  onDelete,
  showFranchise = false,
}: VehicleCheckinTabsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"All" | "In Workshop" | "Delivered">("All");

  const inWorkshopCars = useMemo(
    () => cars.filter((c) => c.status === "Ongoing" || c.status === "In Workshop"),
    [cars]
  );
  const deliveredCars = useMemo(
    () => cars.filter((c) => c.status === "Delivered" || c.status === "Out" || c.status === "Completed"),
    [cars]
  );

  const displayedCars = useMemo(() => {
    if (activeTab === "In Workshop") return inWorkshopCars;
    if (activeTab === "Delivered") return deliveredCars;
    return cars;
  }, [activeTab, cars, inWorkshopCars, deliveredCars]);

  if (cars.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 shadow-xs">
        <Car className="w-10 h-10 mx-auto text-slate-300 mb-3" />
        <p className="text-sm font-medium text-slate-700">No vehicle check-in records found</p>
        <p className="text-xs text-slate-400 mt-1">Check-in records appear here once vehicles are registered at the gate.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Category sub-tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200/80 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("All")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === "All"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <span>All Check-Ins</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">{cars.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("In Workshop")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === "In Workshop"
              ? "bg-amber-500 text-white shadow-xs"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>In Workshop</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">{inWorkshopCars.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("Delivered")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === "Delivered"
              ? "bg-emerald-600 text-white shadow-xs"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Checked Out / Delivered</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">{deliveredCars.length}</span>
        </button>
      </div>

      {/* Cards Grid */}
      {displayedCars.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-500 text-sm">
          No vehicles in this status category.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {displayedCars.map((entry) => {
            const inWorkshop = entry.status === "Ongoing" || entry.status === "In Workshop";
            const vehicleNo = entry.vehicleNo || entry.vehicle || entry.vehicleNumber || "";
            const isInspected = hasCompletedInspection(entry);

            return (
              <div
                key={entry.id}
                className="bg-white rounded-xl border border-gray-200/90 shadow-xs hover:shadow-md hover:border-yellow-400 transition-all p-4 flex flex-col justify-between gap-3"
              >
                {/* Header: ID + Vehicle + Status */}
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                      {formatCarId(entry.id, entry.entryId)}
                    </span>
                    <StatusText status={entry.status === "Ongoing" ? "In Workshop" : entry.status} />
                  </div>

                  {/* Vehicle Number & Model */}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm uppercase tracking-wider text-gray-900 bg-slate-50 border border-slate-200/90 px-2.5 py-1 rounded-md">
                        {vehicleNo || "—"}
                      </span>
                      {entry.model && (
                        <span className="text-xs text-gray-600 font-medium truncate" title={entry.model}>
                          {entry.model}
                        </span>
                      )}
                    </div>
                    {entry.service && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-700 mt-1.5 font-medium truncate" title={entry.service}>
                        <Wrench className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate">{entry.service}</span>
                      </div>
                    )}
                  </div>

                  {/* Customer & Contact */}
                  <div className="pt-2 border-t border-gray-100 space-y-1 text-xs">
                    <div className="flex items-center gap-1.5 text-gray-800 font-semibold truncate">
                      <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="truncate">{entry.customer || "—"}</span>
                    </div>
                    {entry.phone && (
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>{entry.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Timing & Inspection Status */}
                  <div className="pt-2 border-t border-gray-100 space-y-1.5 text-[11px] text-gray-500">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        In: <strong className="text-gray-700 font-medium">{formatDate(entry.inTime)} {formatTime(entry.inTime)}</strong>
                      </span>
                    </div>

                    {entry.outTime && (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          Out: <strong className="text-gray-700 font-medium">{formatDate(entry.outTime)}</strong>
                        </span>
                        <span>
                          Dur: <strong className="text-gray-700 font-medium">{calculateDuration(entry.inTime, entry.outTime)}</strong>
                        </span>
                      </div>
                    )}

                    {/* Inspection Badge */}
                    <div className="pt-1 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => onInspection(entry)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border cursor-pointer transition-colors ${
                          isInspected
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                        }`}
                        title={isInspected ? "Inspection Completed — click to view" : "Inspection Pending — click to inspect"}
                      >
                        {isInspected ? <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> : <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />}
                        <span>{isInspected ? "Inspection Done" : "Inspection Needed"}</span>
                      </button>

                      {showFranchise && (entry.franchiseName || entry.franchiseId) && (
                        <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded truncate max-w-[100px]" title={entry.franchiseName || entry.franchiseId}>
                          {entry.franchiseName || entry.franchiseId}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="pt-2.5 border-t border-gray-100 flex items-center justify-between gap-1.5 mt-auto">
                  <div className="flex items-center gap-1.5 flex-1">
                    {inWorkshop ? (
                      <>
                        <button
                          type="button"
                          onClick={() => onDelivery(entry)}
                          className="flex-1 px-2.5 py-1.5 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-gray-950 font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          Check Out
                        </button>
                        <button
                          type="button"
                          onClick={() => router.push(`/dashboard/jobs?search=${encodeURIComponent(vehicleNo)}`)}
                          className="px-2 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-semibold text-xs shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                          title="Open Job Card"
                        >
                          <Briefcase className="w-3.5 h-3.5 text-gray-500" />
                          <span className="hidden sm:inline">Job</span>
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onViewDetails(entry)}
                        className="flex-1 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 font-semibold text-xs shadow-2xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-gray-500" />
                        View Record
                      </button>
                    )}
                  </div>

                  {/* Secondary Icon Actions */}
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => onViewDetails(entry)}
                      className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                      title="View Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onEdit(entry)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                      title="Edit"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDownloadExcel(entry)}
                      className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                      title="Download CSV"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDownloadPdf(entry)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Download PDF"
                    >
                      <FileText className="w-3.5 h-3.5" />
                    </button>
                    {onDelete && (
                      <button
                        type="button"
                        onClick={() => onDelete(entry)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default VehicleCheckinTabs;
