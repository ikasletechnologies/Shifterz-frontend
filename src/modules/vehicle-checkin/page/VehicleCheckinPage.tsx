"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SummaryCard } from "@/components/common/SummaryCard";
import {
  Plus,
  Eye,
  Edit,
  Download,
  Check,
  Briefcase,
  Trash2,
  Search,
  X,
  Phone,
  ChevronDown,
  FileSpreadsheet,
  FileText,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { toast } from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import VehicleCheckInDialog from "../components/VehicleCheckInDialog";
import VehicleDeliveryDialog from "../components/VehicleDeliveryDialog";
import VehicleDetailsDialog from "../components/VehicleDetailsDialog";
import VehicleInspectionDialog from "../components/VehicleInspectionDialog";
import { useVehicleCheckin } from "../hooks/useVehicleCheckin";
import { CarEntry, hasCompletedInspection } from "../types/vehicle-checkin.types";
import { calculateDuration, formatTime, formatDate, formatDateTime, formatCarId } from "@/lib/timeUtils";
import { useOpenOnQuery } from "@/lib/useOpenOnQuery";
import { StatusText } from "@/components/common/StatusText";

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

  const [periodFilter, setPeriodFilter] = useState("All");
  const [customFromDate, setCustomFromDate] = useState("");
  const [customToDate, setCustomToDate] = useState("");

  const getTodayISO = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleCustomFromDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.value;
    const today = getTodayISO();
    if (selected && selected > today) {
      toast.error("Future dates are not allowed. Please select today or a past date.");
      setCustomFromDate(today);
      return;
    }
    setCustomFromDate(selected);
  };

  const handleCustomToDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.value;
    const today = getTodayISO();
    if (selected && selected > today) {
      toast.error("Future dates are not allowed. Please select today or a past date.");
      setCustomToDate(today);
      return;
    }
    setCustomToDate(selected);
  };

  const getDateRange = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (periodFilter === "Today") {
      return { from: today, to: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999) };
    }
    if (periodFilter === "Yesterday") {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return { from: yesterday, to: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999) };
    }
    if (periodFilter === "Custom") {
      const from = customFromDate ? new Date(customFromDate + "T00:00:00") : null;
      const to = customToDate ? new Date(customToDate + "T23:59:59.999") : null;
      return { from, to };
    }
    return { from: null, to: null };
  };
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeliveryDialogOpen, setIsDeliveryDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isInspectionDialogOpen, setIsInspectionDialogOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState<CarEntry | null>(null);
  // Dashboard "Car In" quick action links here with ?new=1.
  useOpenOnQuery(() => { setSelectedCar(null); setIsDialogOpen(true); });
  const [successCar, setSuccessCar] = useState<CarEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "In Workshop" | "Delivered">("All");
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);

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

  const handleInspectionClick = (car: CarEntry) => {
    setSelectedCar(car);
    setIsInspectionDialogOpen(true);
  };

  const handleDeliverySubmit = async (outData: any) => {
    let targetCar = selectedCar;
    if (!targetCar && outData.vehicleNo) {
      const normV = outData.vehicleNo.replace(/\s+/g, "").toUpperCase();
      targetCar = cars.find((c) => (c.vehicleNo || c.vehicle || c.vehicleNumber || "").replace(/\s+/g, "").toUpperCase() === normV) || null;
    }

    if (targetCar) {
      const success = await handleVehicleCheckOut(targetCar, outData);
      if (success) {
        setIsDeliveryDialogOpen(false);
        router.push("/dashboard/outpass");
      }
    } else if (outData.vehicleNo) {
      const mockCar: CarEntry = {
        id: `car-${Date.now()}`,
        entryId: `ENT-${Math.floor(1000 + Math.random() * 9000)}`,
        vehicleNo: outData.vehicleNo,
        model: outData.model || "",
        customer: outData.customer || "",
        phone: outData.phone || "",
        service: outData.service || "",
        odometer: outData.odometer || "",
        inTime: outData.inTime || new Date().toISOString(),
        outTime: outData.outTime || new Date().toISOString(),
        duration: null,
        status: "Out",
        technician: outData.technician || "",
        security: outData.security || "",
        remarks: outData.remarks || "",
      };
      const success = await handleVehicleCheckOut(mockCar, outData);
      if (success) {
        setIsDeliveryDialogOpen(false);
        router.push("/dashboard/outpass");
      }
    }
  };

  const handleCheckOutButtonClick = () => {
    setSelectedCar(null);
    setIsDeliveryDialogOpen(true);
  };

  const allCount = cars.length;
  const inWorkshopCount = cars.filter((c) => c.status !== "Out" && c.status !== "Delivered").length;
  const deliveredCount = cars.filter((c) => c.status === "Out" || c.status === "Delivered").length;

  const downloadReport = () => {
    try {
      const dataToExport = filteredCars.length > 0 ? filteredCars : cars;

      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      // Header title
      doc.setFontSize(16);
      doc.setTextColor(15, 23, 42);
      doc.text("Vehicle Check-In Report", 14, 15);

      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`Generated on ${new Date().toLocaleString()} | Shifterz Pro Suite`, 14, 21);

      const tableHeaders = [
        ["Entry ID", "Vehicle No.", "Model", "Customer", "Mobile No.", "Service", "In Date", "In Time", "Out Date", "Out Time", "Status"]
      ];

      const tableRows = dataToExport.map((car) => [
        car.entryId || car.id || "-",
        car.vehicleNo || car.vehicle || car.vehicleNumber || "-",
        car.model || "-",
        car.customer || "-",
        car.phone || "-",
        car.service || "-",
        formatDate(car.inTime),
        formatTime(car.inTime),
        car.outTime ? formatDate(car.outTime) : "-",
        car.outTime ? formatTime(car.outTime) : "-",
        car.status || "-",
      ]);

      autoTable(doc, {
        head: tableHeaders,
        body: tableRows,
        startY: 26,
        theme: "striped",
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontSize: 8.5,
          fontStyle: "bold",
        },
        bodyStyles: {
          fontSize: 8.5,
          textColor: [51, 65, 85],
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        margin: { top: 26, left: 14, right: 14, bottom: 14 },
      });

      const pdfBlob = doc.output("blob");
      const downloadBlob = new Blob([pdfBlob], { type: "application/octet-stream" });
      const url = URL.createObjectURL(downloadBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `vehicle-checkin-report-${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("PDF report downloaded directly");
    } catch (err) {
      toast.error("Failed to download PDF report");
      console.error(err);
    }
  };

  const downloadExcel = () => {
    try {
      const dataToExport = filteredCars.length > 0 ? filteredCars : cars;

      const formattedData = dataToExport.map((car) => ({
        "Entry ID": car.entryId || car.id || "-",
        "Vehicle No.": car.vehicleNo || car.vehicle || car.vehicleNumber || "-",
        "Model": car.model || "-",
        "Customer Name": car.customer || "-",
        "Mobile No.": car.phone || "-",
        "Service": car.service || "-",
        "In Date": formatDate(car.inTime),
        "In Time": formatTime(car.inTime),
        "Out Date": car.outTime ? formatDate(car.outTime) : "-",
        "Out Time": car.outTime ? formatTime(car.outTime) : "-",
        "Status": car.status || "-",
        "Notes": car.notes || "-",
      }));

      const worksheet = XLSX.utils.json_to_sheet(formattedData);

      // Auto-fit column widths
      worksheet["!cols"] = [
        { wch: 16 },
        { wch: 18 },
        { wch: 18 },
        { wch: 20 },
        { wch: 16 },
        { wch: 22 },
        { wch: 14 },
        { wch: 12 },
        { wch: 14 },
        { wch: 12 },
        { wch: 14 },
        { wch: 25 },
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Vehicle Check-In");

      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.style.display = "none";
      link.href = url;
      link.download = `Vehicle_Checkin_Report_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);

      toast.success("File (.xlsx) downloaded directly to your device");
      setIsDownloadOpen(false);
    } catch (err) {
      toast.error("Failed to download file");
      console.error(err);
    }
  };

  const downloadSingleCarExcel = (car: CarEntry) => {
    try {
      const vNum = car.vehicleNo || car.vehicle || car.vehicleNumber || car.id;
      const formattedData = [{
        "Entry ID": car.entryId || car.id || "-",
        "Vehicle No.": vNum,
        "Model": car.model || "-",
        "Customer Name": car.customer || "-",
        "Mobile No.": car.phone || "-",
        "Service": car.service || "-",
        "In Date": formatDate(car.inTime),
        "In Time": formatTime(car.inTime),
        "Out Date": car.outTime ? formatDate(car.outTime) : "-",
        "Out Time": car.outTime ? formatTime(car.outTime) : "-",
        "Status": car.status || "-",
        "Notes": car.notes || "-",
      }];

      const worksheet = XLSX.utils.json_to_sheet(formattedData);
      worksheet["!cols"] = [
        { wch: 16 }, { wch: 18 }, { wch: 18 }, { wch: 20 },
        { wch: 16 }, { wch: 22 }, { wch: 14 }, { wch: 12 },
        { wch: 14 }, { wch: 12 }, { wch: 14 }, { wch: 25 },
      ];
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Vehicle Details");

      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.style.display = "none";
      link.href = url;
      link.download = `Vehicle_${vNum}_Details.xlsx`;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);

      toast.success("Vehicle details (.xlsx) downloaded");
    } catch (err) {
      toast.error("Failed to download vehicle details");
      console.error(err);
    }
  };

  const downloadSingleCarPDF = (car: CarEntry) => {
    try {
      const vNum = car.vehicleNo || car.vehicle || car.vehicleNumber || car.id;
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      doc.setFillColor(30, 41, 59);
      doc.rect(0, 0, 210, 24, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(`VEHICLE DETAILS - ${vNum}`, 14, 16);

      const tableData = [
        ["Entry ID", car.entryId || car.id || "-"],
        ["Vehicle No.", vNum],
        ["Model", car.model || "-"],
        ["Customer Name", car.customer || "-"],
        ["Phone Number", car.phone || "-"],
        ["Service", car.service || "-"],
        ["In Date & Time", `${formatDate(car.inTime)} ${formatTime(car.inTime)}`],
        ["Out Date & Time", car.outTime ? `${formatDate(car.outTime)} ${formatTime(car.outTime)}` : "Pending"],
        ["Status", car.status || "-"],
        ["Notes", car.notes || "-"],
      ];

      autoTable(doc, {
        startY: 30,
        head: [["Field", "Details"]],
        body: tableData,
        theme: "striped",
        headStyles: { fillColor: [240, 177, 0], textColor: [17, 24, 39], fontStyle: "bold" },
        styles: { fontSize: 10, cellPadding: 4 },
      });

      doc.save(`Vehicle_${vNum}_Details.pdf`);
      toast.success("Vehicle details (.pdf) downloaded");
    } catch (err) {
      toast.error("Failed to download vehicle PDF");
      console.error(err);
    }
  };

  const filteredCars = cars.filter((car) => {
    const statusMatch =
      statusFilter === "All" ||
      (statusFilter === "In Workshop" && (car.status !== "Out" && car.status !== "Delivered")) ||
      (statusFilter === "Delivered" && (car.status === "Out" || car.status === "Delivered"));

    const cleanQuery = searchQuery.trim().toLowerCase();
    const normQuery = cleanQuery.replace(/\s+/g, "");

    const vehicleNum = (car.vehicleNo || car.vehicle || car.vehicleNumber || "").toLowerCase();
    const normVehicleNum = vehicleNum.replace(/\s+/g, "");

    const entryIdStr = (car.entryId || car.id || "").toLowerCase();
    const modelStr = (car.model || "").toLowerCase();
    const customerStr = (car.customer || "").toLowerCase();
    const phoneStr = (car.phone || "").toLowerCase();

    const vehicleMatch = vehicleNum.includes(cleanQuery) || (normQuery.length > 0 && normVehicleNum.includes(normQuery));

    const searchMatch =
      !cleanQuery ||
      vehicleMatch ||
      entryIdStr.includes(cleanQuery) ||
      modelStr.includes(cleanQuery) ||
      customerStr.includes(cleanQuery) ||
      phoneStr.includes(cleanQuery);

    let dateMatch = true;
    if (car.inTime) {
      const carDate = new Date(car.inTime);
      if (!isNaN(carDate.getTime())) {
        const { from, to } = getDateRange();
        if (from && carDate < from) dateMatch = false;
        if (to && carDate > to) dateMatch = false;
      }
    }

    return statusMatch && searchMatch && dateMatch;
  });

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading vehicle check-ins...</div>;

  return (
    <div className="p-4 sm:p-6 md:p-8">
      {/* Quick Filter Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <SummaryCard label="All Vehicles" value={allCount} active={statusFilter === "All"} onClick={() => setStatusFilter("All")} />
        <SummaryCard label="In Workshop" value={inWorkshopCount} active={statusFilter === "In Workshop"} onClick={() => setStatusFilter("In Workshop")} />
      </div>

      {/* Toolbar */}
      <div className="mb-6 bg-white px-4 py-3 rounded-xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full min-w-[140px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by vehicle, customer, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Period pill tabs */}
          <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-1">
            {["All", "Today", "Yesterday", "Custom"].map((period) => (
              <div key={period} className="relative">
                <button
                  onClick={() => setPeriodFilter(period)}
                  className={`text-sm px-3 py-1 rounded-md font-medium transition-all whitespace-nowrap ${periodFilter === period
                    ? "bg-white text-gray-900 font-semibold shadow-sm"
                    : "text-gray-500 hover:text-gray-800"
                    }`}
                >
                  {period}
                </button>

                {/* Custom date dropdown */}
                {period === "Custom" && periodFilter === "Custom" && (
                  <div className="absolute top-full right-0 mt-2 z-50 bg-white border border-gray-200 p-4 rounded-xl shadow-xl animate-in fade-in slide-in-from-top-2 duration-150 min-w-[280px]">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-gray-800">Custom Date Range</span>
                      {(customFromDate || customToDate) && (
                        <button type="button" onClick={() => { setCustomFromDate(""); setCustomToDate(""); }} className="text-[11px] font-semibold text-yellow-600 hover:underline">Clear All</button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">From</label>
                        <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5">
                          <input type="date" value={customFromDate} max={getTodayISO()} onChange={handleCustomFromDateChange} className="bg-transparent border-none text-xs text-gray-800 outline-none w-full" />
                          {customFromDate && <button type="button" onClick={() => setCustomFromDate("")} className="text-gray-400 hover:text-gray-600 shrink-0"><X className="w-3 h-3" /></button>}
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">To</label>
                        <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5">
                          <input type="date" value={customToDate} max={getTodayISO()} onChange={handleCustomToDateChange} className="bg-transparent border-none text-xs text-gray-800 outline-none w-full" />
                          {customToDate && <button type="button" onClick={() => setCustomToDate("")} className="text-gray-400 hover:text-gray-600 shrink-0"><X className="w-3 h-3" /></button>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Download dropdown */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setIsDownloadOpen((prev) => !prev)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors text-sm whitespace-nowrap cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-80" />
            </button>
            {isDownloadOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsDownloadOpen(false)} />
                <div className="absolute right-0 mt-1.5 w-44 bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <button type="button" onClick={downloadExcel} className="w-full px-4 py-2.5 text-left text-xs font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2.5 transition-colors cursor-pointer">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    Download as CSV
                  </button>
                  <button type="button" onClick={() => { downloadReport(); setIsDownloadOpen(false); }} className="w-full px-4 py-2.5 text-left text-xs font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2.5 transition-colors cursor-pointer">
                    <FileText className="w-4 h-4 text-red-500" />
                    Download as PDF
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Vehicle Check-In */}
          <button
            onClick={() => { setSelectedCar(null); setIsDialogOpen(true); }}
            className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors text-sm shrink-0 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Vehicle Check-In
          </button>
        </div>
      </div>

      {/* Vehicle Check-In Register */}
      {filteredCars.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-10 text-center text-slate-500 text-sm">
          {searchQuery
            ? `No vehicle record matching "${searchQuery}" was found.`
            : "No vehicle check-in records available"}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
          <table className="data-table w-full min-w-[1500px] text-left">
            <thead>
              <tr>
                {["Entry ID", "Vehicle No.", "Model", "Customer", "Mobile No.", "Service", "In Date", "In Time", "Out Date", "Out Time", "Duration", "Status"].map((h) => (
                  <th key={h}>{h}</th>
                ))}
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCars.map((entry) => {
                const inWorkshop = entry.status === "Ongoing" || entry.status === "In Workshop";
                const vehicleNo = entry.vehicleNo || entry.vehicle || entry.vehicleNumber || "";

                return (
                  <tr key={entry.id}>
                    <td className="whitespace-nowrap">{formatCarId(entry.id, entry.entryId)}</td>
                    <td className="whitespace-nowrap uppercase">{vehicleNo}</td>
                    <td className="max-w-[140px] truncate">{entry.model || "—"}</td>
                    <td className="max-w-[180px] truncate">{entry.customer}</td>
                    <td className="whitespace-nowrap">{entry.phone || "—"}</td>
                    <td className="max-w-[160px] truncate">{entry.service || "—"}</td>
                    <td className="whitespace-nowrap">{formatDate(entry.inTime)}</td>
                    <td className="whitespace-nowrap">{formatTime(entry.inTime)}</td>
                    <td className="whitespace-nowrap">{entry.outTime ? formatDate(entry.outTime) : "—"}</td>
                    <td className="whitespace-nowrap">{entry.outTime ? formatTime(entry.outTime) : "—"}</td>
                    <td className="whitespace-nowrap">{entry.outTime ? calculateDuration(entry.inTime, entry.outTime) : "—"}</td>
                    <td className="whitespace-nowrap"><StatusText status={entry.status === "Ongoing" ? "In Workshop" : entry.status} /></td>
                    <td className="whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        {inWorkshop && (
                          <>
                            <button onClick={() => handleDeliveryClick(entry)} className="px-1" title="Check Out Vehicle">
                              Check Out
                            </button>
                            <button
                              onClick={() => router.push(`/dashboard/jobs?search=${encodeURIComponent(vehicleNo)}`)}
                              className="px-1"
                            >
                              Job Card
                            </button>
                            <button
                              onClick={() => handleInspectionClick(entry)}
                              className="p-1.5"
                              title={hasCompletedInspection(entry) ? "Inspection Complete" : "Complete Inspection (required for QC)"}
                            >
                              {hasCompletedInspection(entry) ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                            </button>
                          </>
                        )}
                        <button onClick={() => handleViewDetailsClick(entry)} className="p-1.5" title="View Details">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleEditClick(entry)} className="p-1.5" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => downloadSingleCarExcel(entry)} className="p-1.5" title="Download as CSV">
                          <FileSpreadsheet className="w-4 h-4" />
                        </button>
                        <button onClick={() => downloadSingleCarPDF(entry)} className="p-1.5" title="Download as PDF">
                          <FileText className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteClick(entry)} className="p-1.5" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Dialogs */}
      <VehicleCheckInDialog
        isOpen={isDialogOpen}
        onClose={() => { setIsDialogOpen(false); setSelectedCar(null); }}
        onSubmit={handleCheckInSubmit}
        onDeliver={async (deliverData) => {
          if (selectedCar) {
            await handleVehicleCheckOut(selectedCar, deliverData);
          } else {
            await handleUpdateVehicleCheckIn(deliverData.id, deliverData);
          }
          setIsDialogOpen(false);
          setSelectedCar(null);
          toast.success("Vehicle status updated to Delivered!");
        }}
        onDelete={handleDeleteClick}
        onViewExistingRecord={(car) => {
          setIsDialogOpen(false);
          setSelectedCar(car);
          setIsDetailsDialogOpen(true);
        }}
        initialData={selectedCar}
        cars={cars}
      />
      <VehicleDeliveryDialog
        isOpen={isDeliveryDialogOpen}
        onClose={() => setIsDeliveryDialogOpen(false)}
        carData={selectedCar ? {
          id: selectedCar.id,
          vehicleNo: selectedCar.vehicleNo || selectedCar.vehicle || "",
          model: selectedCar.model || "",
          customer: selectedCar.customer || "",
          phone: selectedCar.phone || "",
          service: selectedCar.service || "",
          odometer: selectedCar.odometer || "",
          inTime: selectedCar.inTime || "",
          technician: selectedCar.technician || "",
        } : undefined}
        cars={cars}
        onSubmit={handleDeliverySubmit}
      />
      <VehicleInspectionDialog
        isOpen={isInspectionDialogOpen}
        onClose={() => { setIsInspectionDialogOpen(false); setSelectedCar(null); }}
        car={selectedCar}
        onSubmit={handleUpdateVehicleCheckIn}
      />
      <VehicleDetailsDialog
        isOpen={isDetailsDialogOpen}
        onClose={() => setIsDetailsDialogOpen(false)}
        carData={selectedCar ? { ...selectedCar, vehicleNo: selectedCar.vehicleNo || selectedCar.vehicle || selectedCar.vehicleNumber || "" } : undefined}
        onDeliver={(car) => {
          setIsDetailsDialogOpen(false);
          const target = cars.find((c) => c.id === car.id || (car.vehicleNo && c.vehicleNo === car.vehicleNo)) || selectedCar;
          if (target) {
            handleDeliveryClick(target);
          }
        }}
        onDelete={(carData) => {
          const target = cars.find((c) => c.id === carData.id || (carData.vehicleNo && c.vehicleNo === carData.vehicleNo)) || selectedCar;
          if (target) {
            handleDeleteClick(target);
          }
        }}
      />

      {/* Success Popup */}
      {successCar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl p-8 max-w-sm w-full text-center shadow-2xl">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-emerald-600 stroke-3" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Vehicle Checked In!</h3>
            <p className="text-gray-500 mb-6 text-sm">
              {successCar.vehicleNo} has been registered. Would you like to create a Job Card now?
            </p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  // Carries the check-in's own data through instead of
                  // dropping it — Job Cards reads this via ?fromCarIn=<id>
                  // and pre-fills a new job card with it, including the
                  // real carInId link (not just a vehicle-number text match).
                  router.push(`/dashboard/jobs?fromCarIn=${encodeURIComponent(successCar.id)}`);
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

