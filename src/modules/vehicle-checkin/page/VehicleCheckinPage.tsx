"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Eye, Circle, Edit, Download, Check, Briefcase, Trash2, Search, X } from "lucide-react";
import { toast } from "react-hot-toast";
import VehicleCheckInDialog from "../components/VehicleCheckInDialog";
import VehicleDeliveryDialog from "../components/VehicleDeliveryDialog";
import VehicleDetailsDialog from "../components/VehicleDetailsDialog";
import { useVehicleCheckin } from "../hooks/useVehicleCheckin";
import { CarEntry } from "../types/vehicle-checkin.types";
import { calculateDuration, formatTime, formatDate, formatDateTime } from "@/lib/timeUtils";

export function VehicleCheckinPage() {
  const router = useRouter();
  const {
    cars,
    isLoading,
    handleCreateVehicleCheckIn,
    handleUpdateVehicleCheckIn,
    handleDeleteVehicleCheckIn,
    handleVehicleCheckOut,
  } = useVehicleCheckin();

  const [filter, setFilter] = useState("All");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeliveryDialogOpen, setIsDeliveryDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState<CarEntry | null>(null);
  const [successCar, setSuccessCar] = useState<CarEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleCheckInSubmit = async (carData: any) => {
    if (selectedCar && isDialogOpen) {
      await handleUpdateVehicleCheckIn(selectedCar.id, carData);
    } else {
      const newCar = await handleCreateVehicleCheckIn(carData);
      if (newCar) setSuccessCar(newCar);
    }
    setIsDialogOpen(false);
    setSelectedCar(null);
  };

  const handleEditClick = (car: CarEntry) => {
    setSelectedCar(car);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = async (car: CarEntry) => {
    if (!confirm(`Are you sure you want to delete entry for ${car.vehicleNo || car.vehicle || "this car"}?`)) return;
    await handleDeleteVehicleCheckIn(car);
  };

  const handleDeliveryClick = (car: CarEntry) => {
    setSelectedCar(car);
    setIsDeliveryDialogOpen(true);
  };

  const handleViewDetailsClick = (car: CarEntry) => {
    setSelectedCar(car);
    setIsDetailsDialogOpen(true);
  };

  const handleDeliverySubmit = async (outData: any) => {
    if (!selectedCar) return;
    const success = await handleVehicleCheckOut(selectedCar, outData);
    if (success) {
      setIsDeliveryDialogOpen(false);
      router.push("/dashboard/outpass");
    }
  };

  const inWorkshop = cars.filter((c) => c.status === "Ongoing" || c.status === "In Workshop").length;
  const totalToday = cars.length;
  const delivered = cars.filter((c) => c.status === "Out" || c.status === "Delivered").length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Ongoing":
      case "In Workshop":
        return "bg-green-100 text-green-700";
      case "Out":
      case "Delivered":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const downloadReport = (format: "csv" | "pdf") => {
    try {
      const dataToExport = filteredCars.length > 0 ? filteredCars : cars;

      if (format === "csv") {
        const headers = ["Entry ID", "Vehicle No", "Model", "Customer", "Phone", "Service", "Technician", "In Date", "In Time", "Out Date", "Out Time", "Duration", "Status"];
        const rows = dataToExport.map((car) => [
          car.entryId || car.id,
          car.vehicleNo || car.vehicle || car.vehicleNumber || "",
          car.model,
          car.customer,
          car.phone || "-",
          car.service,
          car.technician || "Unassigned",
          formatDate(car.inTime),
          formatTime(car.inTime),
          car.outTime ? formatDate(car.outTime) : "-",
          car.outTime ? formatTime(car.outTime) : "-",
          car.outTime ? calculateDuration(car.inTime, car.outTime) : "-",
          car.status,
        ]);
        const csvContent = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `vehicle-checkin-report-${new Date().toISOString().split("T")[0]}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
        toast.success("Report downloaded as CSV");
      } else {
        const htmlContent = `<!DOCTYPE html><html><head><title>Vehicle Check-In Report</title><style>body{font-family:Arial,sans-serif;margin:20px}h1{color:#333;text-align:center}table{width:100%;border-collapse:collapse;margin-top:20px;font-size:12px}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background-color:#f8f9fa;font-weight:bold}tr:nth-child(even){background-color:#f9f9f9}</style></head><body><h1>Vehicle Check-In Report</h1><p style="text-align:center;color:#666">Generated on ${new Date().toLocaleString()}</p><table><thead><tr><th>Entry ID</th><th>Vehicle No</th><th>Model</th><th>Customer</th><th>Service</th><th>Technician</th><th>In Date</th><th>In Time</th><th>Out Date</th><th>Out Time</th><th>Duration</th><th>Status</th></tr></thead><tbody>${dataToExport.map((car) => `<tr><td>${car.entryId || car.id}</td><td>${car.vehicleNo || car.vehicle || ""}</td><td>${car.model}</td><td>${car.customer}</td><td>${car.service}</td><td>${car.technician || "Unassigned"}</td><td>${formatDate(car.inTime)}</td><td>${formatTime(car.inTime)}</td><td>${car.outTime ? formatDate(car.outTime) : "—"}</td><td>${car.outTime ? formatTime(car.outTime) : "—"}</td><td>${car.outTime ? calculateDuration(car.inTime, car.outTime) : "—"}</td><td>${car.status}</td></tr>`).join("")}</tbody></table></body></html>`;
        const blob = new Blob([htmlContent], { type: "text/html" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `vehicle-checkin-report-${new Date().toISOString().split("T")[0]}.html`;
        link.click();
        window.URL.revokeObjectURL(url);
        toast.success("Report downloaded as HTML (printable as PDF)");
      }
    } catch (err) {
      toast.error("Failed to download report");
      console.error(err);
    }
  };

  const filteredCars = cars.filter((car) => {
    const statusMatch =
      filter === "All" ||
      (filter === "In Workshop" && (car.status === "Ongoing" || car.status === "In Workshop")) ||
      (filter === "Delivered" && (car.status === "Out" || car.status === "Delivered"));
    const searchMatch =
      (car.vehicleNo || car.vehicle || car.vehicleNumber || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      car.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      car.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      car.phone.includes(searchQuery);
    return statusMatch && searchMatch;
  });

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading vehicle check-ins...</div>;

  return (
    <div className="p-4 sm:p-6 md:p-8">
      {/* Stats Bar */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 mb-6">
        <div className="flex flex-wrap items-center gap-4 md:gap-6">
          <span className="text-green-600 font-semibold text-sm md:text-base">● In Workshop: {inWorkshop}</span>
          <span className="text-blue-600 font-semibold text-sm md:text-base">Total Today: {totalToday}</span>
          <span className="text-purple-600 font-semibold text-sm md:text-base">Delivered: {delivered}</span>
        </div>
        <div className="md:ml-auto flex flex-col sm:flex-row w-full md:w-auto gap-3">
          <div className="relative group w-full sm:w-auto">
            <button className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors">
              <Download className="w-5 h-5" />
              Download
            </button>
            <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg hidden group-hover:block z-50">
              <button onClick={() => downloadReport("csv")} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 border-b border-gray-100">
                <Download className="w-4 h-4" /> Download as CSV
              </button>
              <button onClick={() => downloadReport("pdf")} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                <Download className="w-4 h-4" /> Download as PDF
              </button>
            </div>
          </div>
          <button
            onClick={() => { setSelectedCar(null); setIsDialogOpen(true); }}
            className="w-full sm:w-auto bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Vehicle Check-In
          </button>
        </div>
      </div>

      {/* Filter Tabs + Search */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between border-b border-gray-200 pb-2 md:pb-0">
        <div className="flex overflow-x-auto gap-2 sm:gap-4">
          {["All", "In Workshop", "Delivered"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 sm:px-4 py-3 font-medium transition-colors whitespace-nowrap text-sm sm:text-base ${filter === tab ? "text-gray-900 border-b-2 border-gray-900" : "text-gray-600 hover:text-gray-900"}`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="relative w-full max-w-md md:mb-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by vehicle, customer, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-9 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/75">
                {["Entry ID", "Vehicle No.", "Model", "Customer", "Mobile No.", "Service", "In Date", "In Time", "Out Date", "Out Time", "Duration", "Status", "Actions"].map(h => (
                  <th key={h} className="px-6 py-4 text-left text-xs font-bold text-gray-800 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCars.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-xs font-mono font-bold" style={{ color: "#F0B100" }}>{entry.entryId || entry.id}</td>
                  <td className="px-6 py-4 text-xs font-semibold text-gray-900 whitespace-nowrap">{entry.vehicleNo || entry.vehicle || entry.vehicleNumber || ""}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{entry.model}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900 whitespace-nowrap">{entry.customer}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{entry.phone || "—"}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{entry.service}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">{formatDate(entry.inTime)}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-700 whitespace-nowrap">{formatTime(entry.inTime)}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">{entry.outTime ? formatDate(entry.outTime) : "—"}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-700 whitespace-nowrap">{entry.outTime ? formatTime(entry.outTime) : "—"}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-green-600">{entry.outTime ? calculateDuration(entry.inTime, entry.outTime) : "—"}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(entry.status)}`}>
                      <Circle className="w-3 h-3 fill-current" /> {entry.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-2">
                      {(entry.status === "Ongoing" || entry.status === "In Workshop") ? (
                        <button
                          onClick={() => handleDeliveryClick(entry)}
                          className="bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1 rounded font-semibold text-xs transition-colors flex items-center gap-1 w-[58px] justify-center"
                          title="Check Out Vehicle"
                        >
                          → Out
                        </button>
                      ) : (
                        <div className="w-[58px]" />
                      )}
                      <button onClick={() => handleEditClick(entry)} className="p-1.5 hover:bg-blue-50 rounded transition-colors text-blue-500" title="Edit">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleViewDetailsClick(entry)} className="p-1.5 hover:bg-gray-100 rounded transition-colors" title="View Details">
                        <Eye className="w-4 h-4 text-gray-600" />
                      </button>
                      <button onClick={() => handleDeleteClick(entry)} className="p-1.5 hover:bg-red-50 rounded transition-colors text-red-400" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialogs */}
      <VehicleCheckInDialog
        isOpen={isDialogOpen}
        onClose={() => { setIsDialogOpen(false); setSelectedCar(null); }}
        onSubmit={handleCheckInSubmit}
        initialData={selectedCar}
      />
      <VehicleDeliveryDialog
        isOpen={isDeliveryDialogOpen}
        onClose={() => setIsDeliveryDialogOpen(false)}
        carData={selectedCar ? {
          vehicleNo: selectedCar.vehicleNo || "",
          model: selectedCar.model,
          customer: selectedCar.customer,
          phone: selectedCar.phone,
          service: selectedCar.service,
        } : undefined}
        onSubmit={handleDeliverySubmit}
      />
      <VehicleDetailsDialog
        isOpen={isDetailsDialogOpen}
        onClose={() => setIsDetailsDialogOpen(false)}
        carData={selectedCar ? { ...selectedCar, vehicleNo: selectedCar.vehicleNo || "" } : undefined}
      />

      {/* Success Popup */}
      {successCar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl p-8 max-w-sm w-full text-center shadow-2xl">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600 stroke-3" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Vehicle Checked In!</h3>
            <p className="text-gray-500 mb-6 text-sm">
              {successCar.vehicleNo} has been registered. Would you like to create a Job Card now?
            </p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  router.push(`/dashboard/jobs`);
                  setSuccessCar(null);
                }}
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <Briefcase className="w-5 h-5" />
                Go to Job Card
              </button>
              <button
                onClick={() => setSuccessCar(null)}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
