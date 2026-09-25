"use client";

import { useState } from "react";
import { SummaryCard } from "@/components/common/SummaryCard";
import { ListHeader } from "@/components/common/ListHeader";
import { useVehicleCheckin } from "../hooks/useVehicleCheckin";
import { CarEntry, hasCompletedInspection } from "../types/vehicle-checkin.types";
import VehicleInspectionDialog from "../components/VehicleInspectionDialog";
import { formatDate, formatTime } from "@/lib/timeUtils";
import { StatusText } from "@/components/common/StatusText";

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

  const FILTERS = [
    { id: "All", label: "All Vehicles", count: cars.length },
    { id: "Pending", label: "Inspection Pending", count: pendingCount },
    { id: "Complete", label: "Inspection Complete", count: completeCount, tone: "good" as const },
  ] as const;

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      {/* Summary cards — also the list filter */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {FILTERS.map((f) => (
          <SummaryCard
            key={f.id}
            label={f.label}
            value={f.count}
            tone={"tone" in f ? f.tone : undefined}
            active={statusFilter === f.id}
            onClick={() => setStatusFilter(f.id)}
          />
        ))}
      </div>

      <section className="space-y-3">
        <ListHeader
          title="Vehicle Inspection"
          count={filtered.length}
          hint=""
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search vehicle, customer, phone..."
        />

        {filtered.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-lg p-10 text-center text-slate-500 text-sm">
            {query
              ? `No vehicles match "${searchQuery}".`
              : statusFilter === "Pending"
                ? "All caught up — no vehicles are waiting for inspection."
                : statusFilter === "Complete"
                  ? "No inspections have been completed yet."
                  : "No checked-in vehicles yet."}
          </div>
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
                      <td className="whitespace-nowrap"><StatusText status={complete ? "Complete" : "Pending"} /></td>
                      <td className="whitespace-nowrap text-right">
                        {complete ? (
                          <button type="button" onClick={() => openInspection(car)}>
                            View / Edit
                          </button>
                        ) : (
                          // The one thing to do on this page — make it stand out.
                          <button
                            type="button"
                            onClick={() => openInspection(car)}
                            className="keep-color bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold text-xs px-3 py-1.5 rounded-md transition-colors cursor-pointer"
                          >
                            Complete Inspection
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

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
