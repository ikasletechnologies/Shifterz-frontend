"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Eye,
  Circle,
  Edit,
  Download,
  Check,
  Briefcase,
  Trash2,
  Search,
  X,
  Car,
  Wrench,
  CheckCircle,
  LogOut,
  Calendar,
  Clock,
  Phone,
  User,
  LayoutGrid,
  List,
  ChevronDown,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import { toast } from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
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

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const getTodayISO = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleFromDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.value;
    const today = getTodayISO();
    if (selected && selected > today) {
      toast.error("Future dates are not allowed. Please select today or a past date.");
      setFromDate(today);
      return;
    }
    setFromDate(selected);
  };

  const handleToDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.value;
    const today = getTodayISO();
    if (selected && selected > today) {
      toast.error("Future dates are not allowed. Please select today or a past date.");
      setToDate(today);
      return;
    }
    setToDate(selected);
  };
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeliveryDialogOpen, setIsDeliveryDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState<CarEntry | null>(null);
  const [successCar, setSuccessCar] = useState<CarEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [statusFilter, setStatusFilter] = useState<"All" | "In Workshop" | "Delivered">("All");
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [activeCardDownloadId, setActiveCardDownloadId] = useState<string | null>(null);

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
  const inWorkshopCount = cars.filter((c) => c.status === "Ongoing" || c.status === "In Workshop").length;
  const deliveredCount = cars.filter((c) => c.status === "Out" || c.status === "Delivered").length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Ongoing":
      case "In Workshop":
        return "bg-emerald-100 text-emerald-700";
      case "Out":
      case "Delivered":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

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
      (statusFilter === "In Workshop" && (car.status === "Ongoing" || car.status === "In Workshop")) ||
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
        if (fromDate) {
          const start = new Date(fromDate + "T00:00:00");
          if (carDate < start) dateMatch = false;
        }
        if (toDate) {
          const end = new Date(toDate + "T23:59:59.999");
          if (carDate > end) dateMatch = false;
        }
      }
    }

    return statusMatch && searchMatch && dateMatch;
  });

  const inWorkshopCars = filteredCars.filter(
    (c) => c.status === "Ongoing" || c.status === "In Workshop"
  );
  const deliveredCars = filteredCars.filter(
    (c) => c.status === "Out" || c.status === "Delivered"
  );

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading vehicle check-ins...</div>;

  return (
    <div className="p-4 sm:p-6 md:p-8">
      {/* Interactive Quick Filter Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <button
          type="button"
          onClick={() => setStatusFilter("All")}
          className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${statusFilter === "All"
              ? "bg-amber-50/70 border-amber-400 ring-2 ring-amber-400/20 shadow-sm"
              : "bg-white border-gray-200 hover:border-amber-300 hover:bg-gray-50/60"
            }`}
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">All Vehicles</p>
            <p className="text-2xl font-black text-gray-900 mt-1">{allCount}</p>
            <p className="text-xs text-gray-500 mt-0.5 font-medium">Total check-in records</p>
          </div>
          <div className={`p-3 rounded-xl transition-colors ${statusFilter === "All" ? "bg-amber-400 text-gray-900 shadow-xs" : "bg-gray-100 text-gray-600"}`}>
            <Car className="w-6 h-6" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("In Workshop")}
          className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${statusFilter === "In Workshop"
              ? "bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm"
              : "bg-white border-gray-200 hover:border-emerald-300 hover:bg-gray-50/60"
            }`}
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">In Workshop</p>
            <p className="text-2xl font-black text-emerald-700 mt-1">{inWorkshopCount}</p>
            <p className="text-xs text-gray-500 mt-0.5 font-medium">Cars currently in workshop</p>
          </div>
          <div className={`p-3 rounded-xl transition-colors ${statusFilter === "In Workshop" ? "bg-emerald-600 text-white shadow-xs" : "bg-emerald-50 text-emerald-600"}`}>
            <Wrench className="w-6 h-6" />
          </div>
        </button>
      </div>

      {/* Toolbar: Search -> From Date -> To Date -> Download -> Vehicle Check-In -> Vehicle Check-Out -> View Switcher */}
      <div className="mb-6 flex flex-nowrap items-center gap-2.5 border-b border-gray-200 pb-4 w-full">
        {/* 1. Search Bar */}
        <div className="relative flex-1 min-w-[140px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by vehicle, customer, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>



        {/* 2. From Date Filter */}
        <div className="flex items-center gap-1.5 bg-white border border-gray-300 rounded-lg px-2.5 py-2 shrink-0">
          <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">From:</span>
          <input
            type="date"
            value={fromDate}
            max={getTodayISO()}
            onChange={handleFromDateChange}
            className="bg-transparent border-none text-xs text-gray-800 focus:outline-none cursor-pointer p-0"
          />
          <button
            type="button"
            disabled={!fromDate}
            onClick={() => fromDate && setFromDate("")}
            className={`p-0.5 rounded transition-colors flex items-center justify-center shrink-0 ${
              fromDate
                ? "text-gray-600 hover:text-gray-900 hover:bg-gray-100 cursor-pointer"
                : "text-gray-300 cursor-not-allowed opacity-50"
            }`}
            title={fromDate ? "Clear From Date" : ""}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 3. To Date Filter */}
        <div className="flex items-center gap-1.5 bg-white border border-gray-300 rounded-lg px-2.5 py-2 shrink-0">
          <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">To:</span>
          <input
            type="date"
            value={toDate}
            max={getTodayISO()}
            onChange={handleToDateChange}
            className="bg-transparent border-none text-xs text-gray-800 focus:outline-none cursor-pointer p-0"
          />
          <button
            type="button"
            disabled={!toDate}
            onClick={() => toDate && setToDate("")}
            className={`p-0.5 rounded transition-colors flex items-center justify-center shrink-0 ${
              toDate
                ? "text-gray-600 hover:text-gray-900 hover:bg-gray-100 cursor-pointer"
                : "text-gray-300 cursor-not-allowed opacity-50"
            }`}
            title={toDate ? "Clear To Date" : ""}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 4. Download Dropdown Button */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setIsDownloadOpen((prev) => !prev)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-3.5 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors text-sm whitespace-nowrap cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-80" />
          </button>

          {isDownloadOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsDownloadOpen(false)} />
              <div className="absolute right-0 mt-1.5 w-44 bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <button
                  type="button"
                  onClick={downloadExcel}
                  className="w-full px-4 py-2.5 text-left text-xs font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  Download as CSV
                </button>
                <button
                  type="button"
                  onClick={() => {
                    downloadReport();
                    setIsDownloadOpen(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-xs font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-red-500" />
                  Download as PDF
                </button>
              </div>
            </>
          )}
        </div>

        {/* 5. Vehicle Check-In Button */}
        <button
          onClick={() => { setSelectedCar(null); setIsDialogOpen(true); }}
          className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-3.5 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors text-sm shrink-0 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Vehicle Check-In
        </button>

      </div>

      {/* Main Display Area (Cards / Table) */}
      {viewMode === "cards" ? (
        <div className="space-y-6">
          {/* Vehicles In Workshop */}
          {inWorkshopCars.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inWorkshopCars.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-white border border-emerald-200 hover:border-emerald-400 rounded-2xl p-4 shadow-xs transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Card Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                          <Car className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-black text-gray-900 tracking-tight">
                            {entry.vehicleNo || entry.vehicle || entry.vehicleNumber || "—"}
                          </h3>
                          <p className="text-xs text-gray-500 font-medium">
                            {entry.model || "—"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setActiveCardDownloadId(activeCardDownloadId === entry.id ? null : entry.id)}
                            className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors text-gray-600 cursor-pointer flex items-center justify-center"
                            title="Download vehicle record"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          {activeCardDownloadId === entry.id && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setActiveCardDownloadId(null)} />
                              <div className="absolute right-0 mt-1.5 w-44 bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 text-left">
                                <button
                                  type="button"
                                  onClick={() => {
                                    downloadSingleCarExcel(entry);
                                    setActiveCardDownloadId(null);
                                  }}
                                  className="w-full px-3.5 py-2 text-left text-xs font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2 transition-colors cursor-pointer"
                                >
                                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                                  Download as CSV
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    downloadSingleCarPDF(entry);
                                    setActiveCardDownloadId(null);
                                  }}
                                  className="w-full px-3.5 py-2 text-left text-xs font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2 transition-colors cursor-pointer"
                                >
                                  <FileText className="w-3.5 h-3.5 text-red-500" />
                                  Download as PDF
                                </button>
                              </div>
                            </>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleEditClick(entry)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold px-3 py-1 rounded-full whitespace-nowrap shadow-2xs transition-colors cursor-pointer"
                        >
                          View
                        </button>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 my-3" />

                    {/* Card Body Details */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                      <div>
                        <p className="text-[10px] uppercase font-semibold text-gray-400">Entry ID</p>
                        <p className="font-bold text-amber-500 font-mono mt-0.5">{entry.entryId || entry.id}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-semibold text-gray-400">Service</p>
                        <p className="font-bold text-gray-900 mt-0.5">{entry.service || "—"}</p>
                      </div>

                      <div>
                        <p className="text-[10px] uppercase font-semibold text-gray-400">Customer</p>
                        <p className="font-bold text-gray-900 mt-0.5">{entry.customer || "—"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-semibold text-gray-400">Check-In Date</p>
                        <p className="font-medium text-gray-700 mt-0.5 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          {formatDate(entry.inTime)}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] uppercase font-semibold text-gray-400">Mobile</p>
                        <p className="font-medium text-gray-700 mt-0.5 flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          {entry.phone || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-semibold text-gray-400">Check-In Time</p>
                        <p className="font-medium text-gray-700 mt-0.5 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          {formatTime(entry.inTime)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Vehicles Delivered */}
          {deliveredCars.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {deliveredCars.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-red-50/20 border border-red-200 hover:border-red-300 rounded-2xl p-4 shadow-xs transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Card Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                          <Car className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-black text-gray-900 tracking-tight">
                            {entry.vehicleNo || entry.vehicle || entry.vehicleNumber || "—"}
                          </h3>
                          <p className="text-xs text-gray-500 font-medium">
                            {entry.model || "—"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setActiveCardDownloadId(activeCardDownloadId === entry.id ? null : entry.id)}
                            className="p-1.5 bg-red-100/70 hover:bg-red-200/80 rounded-full transition-colors text-red-700 cursor-pointer flex items-center justify-center"
                            title="Download vehicle record"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          {activeCardDownloadId === entry.id && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setActiveCardDownloadId(null)} />
                              <div className="absolute right-0 mt-1.5 w-44 bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 text-left">
                                <button
                                  type="button"
                                  onClick={() => {
                                    downloadSingleCarExcel(entry);
                                    setActiveCardDownloadId(null);
                                  }}
                                  className="w-full px-3.5 py-2 text-left text-xs font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2 transition-colors cursor-pointer"
                                >
                                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                                  Download as CSV
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    downloadSingleCarPDF(entry);
                                    setActiveCardDownloadId(null);
                                  }}
                                  className="w-full px-3.5 py-2 text-left text-xs font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2 transition-colors cursor-pointer"
                                >
                                  <FileText className="w-3.5 h-3.5 text-red-500" />
                                  Download as PDF
                                </button>
                              </div>
                            </>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleViewDetailsClick(entry)}
                          className="bg-red-600 hover:bg-red-700 text-white text-[11px] font-semibold px-3 py-1 rounded-full whitespace-nowrap shadow-2xs transition-colors cursor-pointer"
                        >
                          View
                        </button>
                      </div>
                    </div>

                    <div className="border-t border-red-100/70 my-3" />

                    {/* Card Body Details - 3 Columns (Beside Service Section) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-2 text-xs">
                      {/* Column 1: Core Details */}
                      <div className="space-y-2">
                        <div>
                          <p className="text-[10px] uppercase font-semibold text-gray-400">Entry ID</p>
                          <p className="font-bold text-amber-500 font-mono mt-0.5">{entry.entryId || entry.id}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-semibold text-gray-400">Customer</p>
                          <p className="font-bold text-gray-900 mt-0.5">{entry.customer || "—"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-semibold text-gray-400">Mobile</p>
                          <p className="font-medium text-gray-700 mt-0.5 flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-gray-400" />
                            {entry.phone || "—"}
                          </p>
                        </div>
                      </div>

                      {/* Column 2: Service & Check-In */}
                      <div className="space-y-2">
                        <div>
                          <p className="text-[10px] uppercase font-semibold text-gray-400">Service</p>
                          <p className="font-bold text-gray-900 mt-0.5">{entry.service || "—"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-semibold text-gray-400">Check-In Date</p>
                          <p className="font-medium text-gray-700 mt-0.5 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            {formatDate(entry.inTime)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-semibold text-gray-400">Check-In Time</p>
                          <p className="font-medium text-gray-700 mt-0.5 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            {formatTime(entry.inTime)}
                          </p>
                        </div>
                      </div>

                      {/* Column 3: Beside Service Section (Technician & Check-Out) */}
                      <div className="space-y-2 sm:border-l sm:border-red-100/80 sm:pl-3.5 pl-2">
                        <div>
                          <p className="text-[9.5px] uppercase font-semibold text-gray-400 flex items-center gap-1 whitespace-nowrap tracking-tight">
                            <User className="w-3 h-3 text-gray-400 shrink-0" />
                            <span className="whitespace-nowrap">{entry.technician && entry.technician.trim() !== "" && entry.technician !== "Unassigned" ? "Assigned Technician" : "Unassigned Technician"}</span>
                          </p>
                          <p className="font-bold text-emerald-700 mt-0.5">
                            {entry.technician && entry.technician.trim() !== "" && entry.technician !== "Unassigned" ? entry.technician : "Unassigned"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-semibold text-gray-400">Checkout Date</p>
                          <p className="font-bold text-red-700 mt-0.5 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-red-500 shrink-0" />
                            {entry.outTime ? formatDate(entry.outTime) : "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-semibold text-gray-400">Checkout Time</p>
                          <p className="font-bold text-red-700 mt-0.5 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-red-500 shrink-0" />
                            {entry.outTime ? formatTime(entry.outTime) : "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {inWorkshopCars.length === 0 && deliveredCars.length === 0 && (
            <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-10 text-center text-gray-500 text-sm">
              <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3">
                <Search className="w-5 h-5" />
              </div>
              <p className="font-bold text-gray-800 text-base mb-1">No vehicles found</p>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                {searchQuery
                  ? `No vehicle record matching "${searchQuery}" was found.`
                  : "No vehicle check-in records available."}
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/75">
                  {["Entry ID", "Vehicle No.", "Model", "Customer", "Mobile No.", "Service", "In Date", "In Time", "Out Date", "Out Time", "Duration", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-6 py-4 text-left text-xs font-bold text-gray-800 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCars.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-xs font-mono font-bold" style={{ color: "#F0B100" }}>
                      {entry.entryId || entry.id}
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-gray-900 whitespace-nowrap">
                      {entry.vehicleNo || entry.vehicle || entry.vehicleNumber || ""}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{entry.model}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900 whitespace-nowrap">{entry.customer}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{entry.phone || "—"}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{entry.service}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">{formatDate(entry.inTime)}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-700 whitespace-nowrap">{formatTime(entry.inTime)}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">{entry.outTime ? formatDate(entry.outTime) : "—"}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-700 whitespace-nowrap">{entry.outTime ? formatTime(entry.outTime) : "—"}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-emerald-600">{entry.outTime ? calculateDuration(entry.inTime, entry.outTime) : "—"}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(entry.status)}`}>
                        <Circle className="w-3 h-3 fill-current" /> {entry.status === "Ongoing" ? "In Workshop" : entry.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        {(entry.status === "Ongoing" || entry.status === "In Workshop") ? (
                          <button
                            onClick={() => handleDeliveryClick(entry)}
                            className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-3 py-1 rounded font-semibold text-xs transition-colors flex items-center gap-1 w-[58px] justify-center"
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

