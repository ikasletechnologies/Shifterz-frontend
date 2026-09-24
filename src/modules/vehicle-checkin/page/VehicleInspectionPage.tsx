"use client";

import { useState } from "react";
import { Search, ShieldCheck, ShieldAlert } from "lucide-react";
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
        <div className="bg-white border border-slate-200 rounded-lg p-10 text-center text-slate-500 text-sm">No vehicles found</div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
          <table className="data-table w-full min-w-[950px] text-left">
            <thead>
              <tr>
                <th>Vehicle Number</th>
                <th>Model</th>
                <th>Customer</th>
                <th>Mobile</th>
                <th>Service</th>
                <th>Check-In</th>
                <th>Inspection</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((car) => {
                const complete = hasCompletedInspection(car);
                return (
                  <tr key={car.id}>
                    <td className="whitespace-nowrap uppercase">{car.vehicleNo || car.vehicle || car.vehicleNumber || "—"}</td>
                    <td className="max-w-[140px] truncate">{car.model || "—"}</td>
                    <td className="max-w-[180px] truncate">{car.customer || "—"}</td>
                    <td className="whitespace-nowrap">{car.phone || "—"}</td>
                    <td className="max-w-[160px] truncate">{car.service || "—"}</td>
                    <td className="whitespace-nowrap">{formatDate(car.inTime)} {formatTime(car.inTime)}</td>
                    <td className="whitespace-nowrap">{complete ? "Complete" : "Pending"}</td>
                    <td className="whitespace-nowrap text-right">
                      <button type="button" onClick={() => openInspection(car)}>
                        {complete ? "View / Edit Inspection" : "Complete Inspection"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
