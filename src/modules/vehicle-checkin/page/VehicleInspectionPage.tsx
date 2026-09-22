"use client";

import { useState } from "react";
import { Car, Search, Phone, Calendar, ShieldCheck, ShieldAlert } from "lucide-react";
import { useVehicleCheckin } from "../hooks/useVehicleCheckin";
import { CarEntry, hasCompletedInspection } from "../types/vehicle-checkin.types";
import VehicleInspectionDialog from "../components/VehicleInspectionDialog";
import { formatDate, formatTime } from "@/lib/timeUtils";

export function VehicleInspectionPage() {
  const { cars, isLoading, handleUpdateVehicleCheckIn } = useVehicleCheckin();
  const [selectedCar, setSelectedCar] = useState<CarEntry | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Pending" | "Complete">("Pending");

  const openInspection = (car: CarEntry) => {
    setSelectedCar(car);
    setIsDialogOpen(true);
  };

  const query = searchQuery.trim().toLowerCase();
  const filtered = cars.filter((car) => {
    const complete = hasCompletedInspection(car);
    const statusMatch =
      statusFilter === "All" ||
      (statusFilter === "Pending" && !complete) ||
      (statusFilter === "Complete" && complete);

    if (!statusMatch) return false;
    if (!query) return true;

    const vehicleNum = (car.vehicleNo || car.vehicle || car.vehicleNumber || "").toLowerCase();
    return (
      vehicleNum.includes(query) ||
      (car.customer || "").toLowerCase().includes(query) ||
      (car.phone || "").toLowerCase().includes(query)
    );
  });

  const pendingCount = cars.filter((c) => !hasCompletedInspection(c)).length;
  const completeCount = cars.length - pendingCount;

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading vehicle inspections...</div>;

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <button
          type="button"
          onClick={() => setStatusFilter("Pending")}
          className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${statusFilter === "Pending"
            ? "bg-amber-50/70 border-amber-400 ring-2 ring-amber-400/20 shadow-sm"
            : "bg-white border-gray-200 hover:border-amber-300 hover:bg-gray-50/60"
            }`}
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-600">Inspection Pending</p>
            <p className="text-2xl font-black text-amber-700 mt-1">{pendingCount}</p>
          </div>
          <div className={`p-3 rounded-xl transition-colors ${statusFilter === "Pending" ? "bg-amber-400 text-gray-900 shadow-xs" : "bg-amber-50 text-amber-600"}`}>
            <ShieldAlert className="w-6 h-6" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("Complete")}
          className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${statusFilter === "Complete"
            ? "bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm"
            : "bg-white border-gray-200 hover:border-emerald-300 hover:bg-gray-50/60"
            }`}
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Inspection Complete</p>
            <p className="text-2xl font-black text-emerald-700 mt-1">{completeCount}</p>
          </div>
          <div className={`p-3 rounded-xl transition-colors ${statusFilter === "Complete" ? "bg-emerald-600 text-white shadow-xs" : "bg-emerald-50 text-emerald-600"}`}>
            <ShieldCheck className="w-6 h-6" />
          </div>
        </button>
      </div>

      {/* Toolbar */}
      <div className="mb-6 bg-white px-4 py-3 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by vehicle, customer, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm"
          />
        </div>
        <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-1 shrink-0">
          {(["All", "Pending", "Complete"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`text-sm px-3 py-1 rounded-md font-medium transition-all whitespace-nowrap ${statusFilter === s ? "bg-white text-gray-900 font-semibold shadow-sm" : "text-gray-500 hover:text-gray-800"
                }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-10 text-center text-gray-500 text-sm">
          <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3">
            <Search className="w-5 h-5" />
          </div>
          <p className="font-bold text-gray-800 text-base mb-1">No vehicles found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((car) => {
            const complete = hasCompletedInspection(car);
            return (
              <div
                key={car.id}
                className={`bg-white border rounded-2xl p-4 shadow-xs transition-all flex flex-col justify-between ${complete ? "border-emerald-200" : "border-amber-300"
                  }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${complete ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}>
                      <Car className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-gray-900 tracking-tight">
                        {car.vehicleNo || car.vehicle || car.vehicleNumber || "—"}
                      </h3>
                      <p className="text-xs text-gray-500 font-medium">{car.model || "—"}</p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${complete ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      }`}
                  >
                    {complete ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                    {complete ? "Complete" : "Pending"}
                  </span>
                </div>

                <div className="border-t border-gray-100 my-3" />

                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs mb-3">
                  <div>
                    <p className="text-[10px] uppercase font-semibold text-gray-400">Customer</p>
                    <p className="font-bold text-gray-900 mt-0.5">{car.customer || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-semibold text-gray-400">Mobile</p>
                    <p className="font-medium text-gray-700 mt-0.5 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      {car.phone || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-semibold text-gray-400">Check-In</p>
                    <p className="font-medium text-gray-700 mt-0.5 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      {formatDate(car.inTime)} {formatTime(car.inTime)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-semibold text-gray-400">Service</p>
                    <p className="font-bold text-gray-900 mt-0.5">{car.service || "—"}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => openInspection(car)}
                  className={`w-full flex items-center justify-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-colors cursor-pointer ${complete ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-amber-400 text-gray-900 hover:bg-amber-500"
                    }`}
                >
                  {complete ? "View / Edit Inspection" : "Complete Inspection"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <VehicleInspectionDialog
        isOpen={isDialogOpen}
        onClose={() => { setIsDialogOpen(false); setSelectedCar(null); }}
        car={selectedCar}
        onSubmit={handleUpdateVehicleCheckIn}
      />
    </div>
  );
}

export default VehicleInspectionPage;
