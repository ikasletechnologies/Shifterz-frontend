"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Eye, Circle, Edit, Download, Check, Briefcase, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import CarCheckInDialog from "@/components/carin/CarCheckInDialog";
import PassCarDialog from "@/components/carin/PassCarDialog";
import CarDetailsDialog from "@/components/carin/CarDetailsDialog";

interface CarEntry {
  id: string;
  entryId: string;
  vehicleNo?: string;
  vehicle?: string;
  vehicleNumber?: string;
  model: string;
  customer: string;
  phone: string;
  service: string;
  technician?: string;
  technicianIn?: string;
  inTime: string;
  outTime: string | null;
  duration: string | null;
  status: string;
}

import { getCarInRecords, updateCarIn, createCarIn, editCarIn, deleteCarIn } from "@/lib/api";
import { useEffect } from "react";
import { calculateDuration, formatTime } from "@/lib/timeUtils";

export default function CarInOutPage() {
  const router = useRouter();
  const [filter, setFilter] = useState("All");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPassDialogOpen, setIsPassDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState<CarEntry | null>(null);
  const [cars, setCars] = useState<CarEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [successCar, setSuccessCar] = useState<CarEntry | null>(null);

  const fetchCars = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getCarInRecords();
      setCars(data || []);
    } catch (err) {
      console.error("Failed to fetch cars:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCars();
  }, [fetchCars]);

  const handleCheckInSubmit = async (carData: any) => {
    try {
      if (selectedCar && isDialogOpen) {
        // Edit Mode
        await editCarIn(selectedCar.id, carData);
        await fetchCars();
      } else {
        // Create Mode
        const newCar = await createCarIn(carData);
        setCars([...cars, newCar]);
        setSuccessCar(newCar);
      }
      setIsDialogOpen(false);
      setSelectedCar(null);
    } catch (err) {
      console.error("Failed to save car:", err);
      alert("Failed to save car. Please try again.");
    }
  };

  const handleEditCar = (car: CarEntry) => {
    setSelectedCar(car);
    setIsDialogOpen(true);
  };

  const handleDeleteCar = async (car: CarEntry) => {
    if (!confirm(`Are you sure you want to delete entry for ${car.vehicleNo || car.vehicle || "this car"}?`)) return;
    try {
      await deleteCarIn(car.id);
      setCars(cars.filter(c => c.id !== car.id));
      toast.success(`Car ${car.entryId || car.id} deleted successfully`);
    } catch (err) {
      console.error("Failed to delete car:", err);
      toast.error("Failed to delete car entry. Please try again.");
    }
  };

  const handlePassCar = (car: CarEntry) => {
    setSelectedCar(car);
    setIsPassDialogOpen(true);
  };

  const handleViewCar = (car: CarEntry) => {
    setSelectedCar(car);
    setIsDetailsDialogOpen(true);
  };

  const handlePassSubmit = async (passData: any) => {
    if (!selectedCar) return;
    try {
      // Optimistic update
      setCars(
        cars.map((car) =>
          car.id === selectedCar.id
            ? {
              ...car,
              status: "Out" as const,
              outTime: passData.outTime,
            }
            : car
        )
      );
      setIsPassDialogOpen(false);

      await updateCarIn(selectedCar.id, {
        status: "Out",
        outTime: passData.outTime,
      });

      router.push("/dashboard/outpass");
      setTimeout(() => {
        router.push("/dashboard/outpass");
      }, 500);
    } catch (err) {
      console.error("Failed to update car:", err);
      alert("Failed to pass car out. Please try again.");
      fetchCars(); // Revert optimistic update
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

  const getStatusIcon = (status: string) => {
    if (status === "Ongoing" || status === "In Workshop") return <Circle className="w-3 h-3 fill-current" />;
    if (status === "Out" || status === "Delivered") return <Circle className="w-3 h-3 fill-current" />;
    return <Circle className="w-3 h-3 fill-current" />;
  };

  const downloadReport = (format: "csv" | "pdf") => {
    try {
      const dataToExport = filteredCars.length > 0 ? filteredCars : cars;

      if (format === "csv") {
        // CSV Download
        const headers = [
          "Entry ID",
          "Vehicle No",
          "Model",
          "Customer",
          "Phone",
          "Service",
          "Technician",
          "In Time",
          "Out Time",
          "Duration",
          "Status",
        ];

        const rows = dataToExport.map((car) => [
          car.entryId,
          car.vehicleNo || car.vehicle || car.vehicleNumber || "",
          car.model,
          car.customer,
          car.phone,
          car.service,
          car.technician || car.technicianIn || "",
          car.inTime,
          car.outTime || "-",
          car.duration || "-",
          car.status,
        ]);

        const csvContent = [
          headers.join(","),
          ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `car-in-report-${new Date().toISOString().split("T")[0]}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);

        toast.success("Report downloaded as CSV");
      } else if (format === "pdf") {
        // PDF Download (simple HTML-based)
        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Car In/Out Report</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { color: #333; text-align: center; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
              th { background-color: #f8f9fa; font-weight: bold; }
              tr:nth-child(even) { background-color: #f9f9f9; }
              .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <h1>Car In/Out Report</h1>
            <p style="text-align: center; color: #666;">Generated on ${new Date().toLocaleString()}</p>
            <p style="text-align: center; color: #666;">Filter: ${filter}</p>
            <table>
              <thead>
                <tr>
                  <th>Entry ID</th>
                  <th>Vehicle No</th>
                  <th>Model</th>
                  <th>Customer</th>
                  <th>Service</th>
                  <th>Technician</th>
                  <th>In Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${dataToExport
            .map(
              (car) => `
                  <tr>
                    <td>${car.entryId}</td>
                    <td>${car.vehicleNo || car.vehicle || car.vehicleNumber || ""}</td>
                    <td>${car.model}</td>
                    <td>${car.customer}</td>
                    <td>${car.service}</td>
                    <td>${car.technician || car.technicianIn || ""}</td>
                    <td>${car.inTime}</td>
                    <td>${car.status}</td>
                  </tr>
                `
            )
            .join("")}
              </tbody>
            </table>
            <div class="footer">
              <p>© Shifterz ERP System - ${new Date().getFullYear()}</p>
            </div>
          </body>
          </html>
        `;

        const blob = new Blob([htmlContent], { type: "text/html" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `car-in-report-${new Date().toISOString().split("T")[0]}.html`;
        link.click();
        window.URL.revokeObjectURL(url);

        toast.success("Report downloaded as HTML (can be printed as PDF)");
      }
    } catch (err) {
      toast.error("Failed to download report");
      console.error(err);
    }
  };

  const filteredCars = cars.filter((car) => {
    if (filter === "All") return true;
    if (filter === "In Workshop") return car.status === "Ongoing" || car.status === "In Workshop";
    if (filter === "Delivered") return car.status === "Out" || car.status === "Delivered";
    return true;
  });

  return (
    <div className="p-4 sm:p-6 md:p-8">
      {/* Stats Bar */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 mb-6">
        <div className="flex flex-wrap items-center gap-4 md:gap-6">
          <div className="flex items-center gap-2">
            <span className="text-green-600 font-semibold text-sm md:text-base">● In Workshop: {inWorkshop}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-blue-600 font-semibold text-sm md:text-base">Total Today: {totalToday}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-purple-600 font-semibold text-sm md:text-base">Delivered: {delivered}</span>
          </div>
        </div>
        
        <div className="md:ml-auto flex flex-col sm:flex-row w-full md:w-auto gap-3">
          <div className="relative group w-full sm:w-auto">
            <button
              className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <Download className="w-5 h-5" />
              Download
            </button>
            <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg hidden group-hover:block z-50">
              <button
                onClick={() => downloadReport("csv")}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 border-b border-gray-100"
              >
                <Download className="w-4 h-4" />
                Download as CSV
              </button>
              <button
                onClick={() => downloadReport("pdf")}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download as PDF
              </button>
            </div>
          </div>
          <button
            onClick={() => { setSelectedCar(null); setIsDialogOpen(true); }}
            className="w-full sm:w-auto bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Car Check-In
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex overflow-x-auto gap-2 sm:gap-4 border-b border-gray-200 scrollbar-hide">
        {["All", "In Workshop", "Delivered"].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 sm:px-4 py-3 font-medium transition-colors whitespace-nowrap text-sm sm:text-base ${filter === tab
              ? "text-gray-900 border-b-2 border-gray-900"
              : "text-gray-600 hover:text-gray-900"
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Entry ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Vehicle No.
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Model
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Service
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Technician
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  In Time
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Out Time
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCars.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-xs font-mono font-bold" style={{ color: "#F0B100" }}>
                    {entry.entryId || entry.id}
                  </td>
                  <td className="px-6 py-4 text-xs font-semibold text-gray-900 text-left whitespace-nowrap">
                    {entry.vehicleNo || entry.vehicle || entry.vehicleNumber || ""}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{entry.model}</td>
                  <td className="px-6 py-4 text-sm">
                    <div className="font-semibold text-gray-900">{entry.customer}</div>
                    <div className="text-xs text-gray-500">{entry.phone}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{entry.service}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{entry.technician || entry.technicianIn || ""}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-700 whitespace-nowrap">{formatTime(entry.inTime)}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                    {entry.outTime ? formatTime(entry.outTime) : "—"}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-green-600">
                    {entry.outTime ? calculateDuration(entry.inTime, entry.outTime) : "—"}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                        entry.status
                      )}`}
                    >
                      {getStatusIcon(entry.status)} {entry.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-2">
                      {entry.status === "Ongoing" || entry.status === "In Workshop" ? (
                        <button
                          onClick={() => handlePassCar(entry)}
                          className="bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1 rounded font-semibold text-xs transition-colors flex items-center gap-1"
                          title="Mark car as Out and create pass"
                        >
                          → Out
                        </button>
                      ) : null}
                      <button
                        onClick={() => handleEditCar(entry)}
                        className="p-1.5 hover:bg-blue-50 rounded transition-colors text-blue-500"
                        title="Edit details"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleViewCar(entry)}
                        className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                        title="View details"
                      >
                        <Eye className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleDeleteCar(entry)}
                        className="p-1.5 hover:bg-red-50 rounded transition-colors text-red-400"
                        title="Delete entry"
                      >
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
      <CarCheckInDialog
        isOpen={isDialogOpen}
        onClose={() => { setIsDialogOpen(false); setSelectedCar(null); }}
        onSubmit={handleCheckInSubmit}
        initialData={selectedCar}
      />
      <PassCarDialog
        isOpen={isPassDialogOpen}
        onClose={() => setIsPassDialogOpen(false)}
        carData={
          selectedCar
            ? {
              vehicleNo: selectedCar.vehicleNo || "",
              model: selectedCar.model,
              customer: selectedCar.customer,
              phone: selectedCar.phone,
              service: selectedCar.service,
              technician: selectedCar.technician || "",
            }
            : undefined
        }
        onSubmit={handlePassSubmit}
      />
      <CarDetailsDialog
        isOpen={isDetailsDialogOpen}
        onClose={() => setIsDetailsDialogOpen(false)}
        carData={selectedCar ? { ...selectedCar, vehicleNo: selectedCar.vehicleNo || "", technician: selectedCar.technician || "" } : undefined}
      />

      {/* Success Popup */}
      {successCar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl p-8 max-w-sm w-full text-center shadow-2xl">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600 stroke-3" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Car Registered!</h3>
            <p className="text-gray-500 mb-6 text-sm">
              {successCar.vehicleNo} has been checked in. Would you like to create a Job Card now?
            </p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  router.push(`/dashboard/jobs?vehicle=${successCar.vehicleNo}&customer=${successCar.customer}`);
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
