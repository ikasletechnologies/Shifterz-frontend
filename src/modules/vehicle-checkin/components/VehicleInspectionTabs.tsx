"use client";

import React, { useMemo, useState } from "react";
import {
  Car,
  User,
  Phone,
  Clock,
  Wrench,
  ShieldCheck,
  ShieldAlert,
  ClipboardCheck,
  Eye,
  CheckCircle2,
} from "lucide-react";
import { CarEntry, hasCompletedInspection } from "../types/vehicle-checkin.types";
import { formatDate, formatTime } from "@/lib/timeUtils";
import { StatusText } from "@/components/common/StatusText";

interface VehicleInspectionTabsProps {
  cars: CarEntry[];
  onOpenInspection: (car: CarEntry) => void;
}

export function VehicleInspectionTabs({ cars, onOpenInspection }: VehicleInspectionTabsProps) {
  const [activeTab, setActiveTab] = useState<"All" | "Pending" | "Complete">("All");

  const pendingCars = useMemo(() => cars.filter((c) => !hasCompletedInspection(c)), [cars]);
  const completeCars = useMemo(() => cars.filter((c) => hasCompletedInspection(c)), [cars]);

  const displayedCars = useMemo(() => {
    if (activeTab === "Pending") return pendingCars;
    if (activeTab === "Complete") return completeCars;
    return cars;
  }, [activeTab, cars, pendingCars, completeCars]);

  if (cars.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 shadow-xs">
        <ClipboardCheck className="w-10 h-10 mx-auto text-slate-300 mb-3" />
        <p className="text-sm font-medium text-slate-700">No vehicle inspections found</p>
        <p className="text-xs text-slate-400 mt-1">Vehicles checked into the workshop will appear here for inspection.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Category Sub-Tabs */}
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
          <span>All Inspections</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">{cars.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("Pending")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === "Pending"
              ? "bg-amber-500 text-white shadow-xs"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-200 animate-pulse" />
          <span>Pending Inspection</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">{pendingCars.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("Complete")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === "Complete"
              ? "bg-emerald-600 text-white shadow-xs"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Completed</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">{completeCars.length}</span>
        </button>
      </div>

      {/* Cards Grid */}
      {displayedCars.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-500 text-sm">
          No vehicles in this inspection category.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {displayedCars.map((car) => {
            const isComplete = hasCompletedInspection(car);
            const vehicleNo = car.vehicleNo || car.vehicle || car.vehicleNumber || "";

            return (
              <div
                key={car.id}
                className="bg-white rounded-xl border border-gray-200/90 shadow-xs hover:shadow-md hover:border-yellow-400 transition-all p-4 flex flex-col justify-between gap-3"
              >
                {/* Header: Vehicle + Inspection Status Badge */}
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-sm uppercase tracking-wider text-gray-900 bg-slate-50 border border-slate-200/90 px-2.5 py-1 rounded-md">
                      {vehicleNo || "—"}
                    </span>
                    <StatusText status={isComplete ? "Complete" : "Pending"} />
                  </div>

                  {/* Model & Service */}
                  <div className="space-y-1">
                    {car.model && (
                      <div className="text-xs text-gray-600 font-medium truncate" title={car.model}>
                        Model: <strong className="text-gray-800">{car.model}</strong>
                      </div>
                    )}
                    {car.service && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-700 font-medium truncate" title={car.service}>
                        <Wrench className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate">{car.service}</span>
                      </div>
                    )}
                  </div>

                  {/* Customer Information */}
                  <div className="pt-2 border-t border-gray-100 space-y-1 text-xs">
                    <div className="flex items-center gap-1.5 text-gray-800 font-semibold truncate">
                      <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="truncate">{car.customer || "—"}</span>
                    </div>
                    {car.phone && (
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>{car.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Check-In Details */}
                  <div className="pt-2 border-t border-gray-100 text-[11px] text-gray-500 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      Check-in: <strong className="text-gray-700 font-medium">{formatDate(car.inTime)} {formatTime(car.inTime)}</strong>
                    </span>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="pt-2.5 border-t border-gray-100 mt-auto">
                  {isComplete ? (
                    <button
                      type="button"
                      onClick={() => onOpenInspection(car)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 font-semibold text-xs shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>View / Edit Inspection</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onOpenInspection(car)}
                      className="w-full px-3 py-2 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-gray-950 font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ShieldAlert className="w-4 h-4 text-amber-900" />
                      <span>Complete Inspection</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default VehicleInspectionTabs;
