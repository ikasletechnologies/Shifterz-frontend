 "use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useCallback } from "react";
import {
  Printer,
  Edit2,
  Search,
  X,
  Car,
  Calendar,
  Clock,
  Phone,
  LayoutGrid,
  List,
  Download,
  LogOut,
  User,
  ShieldCheck,
  ChevronDown,
  FileSpreadsheet,
  FileText,
  CheckCircle,
  XCircle,
  Truck,
  Layers,
} from "lucide-react";
import NewOutPassDialog from "@/components/outpass/NewOutPassDialog";
import PrintPassDialog from "@/components/outpass/PrintPassDialog";
import { getOutPasses, createOutPass, updateOutPass, approveOutpass, rejectOutpass } from "@/lib/api";
import { getScopedFranchiseId, scopeToFranchise } from "@/lib/franchise-scope";
import { toast } from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

interface OutPass {
  id: string;
  passId?: string;
  vehicle: string;
  model: string;
  customer: string;
  phone: string;
  service: string;
  outTime: string;
  technician?: string;
  technicianName?: string;
  security?: string;
  securityName?: string;
  jobCardId?: string;
  invoiceId?: string;
  paymentStatus?: string;
  status?: string;
  issued?: boolean;
  createdBy?: string;
}

export default function OutPassPage() {
  const [outPasses, setOutPasses] = useState<OutPass[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [selectedPass, setSelectedPass] = useState<OutPass | null>(null);
  const [editingPass, setEditingPass] = useState<OutPass | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Pending" | "Rejected" | "Delivered">("All");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [activeCardDownloadId, setActiveCardDownloadId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserRole(user.role?.split("|")[0] || null);
      } catch (e) {}
    }
  }, []);

  const isSuperAdmin = userRole === "SUPER_ADMIN";

  const fetchOutPasses = useCallback(async () => {
    try {
      setIsLoading(true);
      const franchiseId = getScopedFranchiseId();
      const data = await getOutPasses(franchiseId);
      setOutPasses(scopeToFranchise(data || []));
    } catch (err: any) {
      setError("Failed to load outpasses: " + err.message);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOutPasses();
  }, [fetchOutPasses]);

  const handleSave = async (data: any) => {
    try {
      if (editingPass) {
        await updateOutPass(editingPass.id, data);
      } else {
        await createOutPass(data);
      }
      await fetchOutPasses();
      setIsDialogOpen(false);
      setEditingPass(null);
    } catch (err) {
      console.error("Failed to save out pass:", err);
      alert("Failed to save out pass.");
    }
  };

  const handlePrintClick = (pass: OutPass) => {
    setSelectedPass(pass);
    setIsPrintOpen(true);
  };

  const handleApproveClick = async (pass: OutPass) => {
    if (!confirm(`Are you sure you want to approve out pass ${pass.passId || pass.id}?`)) return;
    try {
      await approveOutpass(pass.id);
      toast.success("Out pass approved successfully");
      fetchOutPasses();
    } catch (err: any) {
      toast.error("Failed to approve out pass");
      console.error(err);
    }
  };

  const handleRejectClick = async (pass: OutPass) => {
    if (!confirm(`Are you sure you want to reject out pass ${pass.passId || pass.id}?`)) return;
    try {
      await rejectOutpass(pass.id);
      toast.success("Out pass rejected successfully");
      fetchOutPasses();
    } catch (err: any) {
      toast.error("Failed to reject out pass");
      console.error(err);
    }
  };

  const allCount = outPasses.length;
  const pendingCount = outPasses.filter((p) => {
    const s = (p.status || "").toLowerCase();
    return s === "pending" || s === "updated" || !p.status;
  }).length;
  const rejectedCount = outPasses.filter((p) => (p.status || "").toLowerCase() === "rejected").length;
  const deliveredCount = outPasses.filter(
    (p) => (p.status || "").toLowerCase() === "delivered" || p.issued === true || (p.status || "").toLowerCase() === "issued" || (p.status || "").toLowerCase() === "out"
  ).length;

  const filteredOutPasses = outPasses.filter((pass) => {
    const searchMatch =
      !searchQuery ||
      (pass.passId || pass.id || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (pass.vehicle || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (pass.customer || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (pass.phone || "").includes(searchQuery);

    let dateMatch = true;
    if (pass.outTime) {
      const passDate = new Date(pass.outTime);
      if (!isNaN(passDate.getTime())) {
        if (fromDate) {
          const start = new Date(fromDate + "T00:00:00");
          if (passDate < start) dateMatch = false;
        }
        if (toDate) {
          const end = new Date(toDate + "T23:59:59.999");
          if (passDate > end) dateMatch = false;
        }
      }
    }

    let statusMatch = true;
    const passStatus = (pass.status || "").toLowerCase();
    if (statusFilter === "Pending") {
      statusMatch = passStatus === "pending" || passStatus === "updated" || !passStatus;
    } else if (statusFilter === "Rejected") {
      statusMatch = passStatus === "rejected";
    } else if (statusFilter === "Delivered") {
      statusMatch = passStatus === "delivered" || pass.issued === true || passStatus === "issued" || passStatus === "out";
    }

    return searchMatch && dateMatch && statusMatch;
  });

  const formatDateStr = (dateStr?: string) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const formatTimeStr = (dateStr?: string) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  };

  const downloadOutPassExcel = () => {
    try {
      const dataToExport = filteredOutPasses.length > 0 ? filteredOutPasses : outPasses;

      const formattedData = dataToExport.map((pass) => ({
        "Pass ID": pass.passId || pass.id || "-",
        "Vehicle": pass.vehicle || "-",
        "Model": pass.model || "-",
        "Customer": pass.customer || "-",
        "Phone": pass.phone || "-",
        "Service": pass.service || "-",
        "Out Date": formatDateStr(pass.outTime),
        "Out Time": formatTimeStr(pass.outTime),
        "Technician": pass.technicianName || pass.technician || "-",
        "Security Guard": pass.securityName || pass.security || "-",
      }));

      const worksheet = XLSX.utils.json_to_sheet(formattedData);

      worksheet["!cols"] = [
        { wch: 16 },
        { wch: 18 },
        { wch: 18 },
        { wch: 20 },
        { wch: 16 },
        { wch: 22 },
        { wch: 14 },
        { wch: 12 },
        { wch: 18 },
        { wch: 18 },
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Out Pass Register");

      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.style.display = "none";
      link.href = url;
      link.download = `OutPass_Report_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);

      toast.success("Out Pass (.xlsx) report downloaded directly");
      setIsDownloadOpen(false);
    } catch (err) {
      toast.error("Failed to download Excel report");
      console.error(err);
    }
  };

  const downloadOutPassPDF = () => {
    try {
      const dataToExport = filteredOutPasses.length > 0 ? filteredOutPasses : outPasses;

      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

      doc.setFillColor(30, 41, 59);
      doc.rect(0, 0, 297, 28, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("SHIFTERZ - VEHICLE OUT PASS REGISTER", 14, 18);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated: ${new Date().toLocaleString()}`, 210, 18);

      const tableHeaders = [
        "Pass ID",
        "Vehicle No.",
        "Model",
        "Customer",
        "Phone",
        "Service",
        "Out Date",
        "Out Time",
        "Technician",
        "Security",
      ];

      const tableData = dataToExport.map((pass) => [
        pass.passId || pass.id || "-",
        pass.vehicle || "-",
        pass.model || "-",
        pass.customer || "-",
        pass.phone || "-",
        pass.service || "-",
        formatDateStr(pass.outTime),
        formatTimeStr(pass.outTime),
        pass.technicianName || pass.technician || "-",
        pass.securityName || pass.security || "-",
      ]);

      autoTable(doc, {
        startY: 34,
        head: [tableHeaders],
        body: tableData,
        theme: "striped",
        headStyles: { fillColor: [240, 177, 0], textColor: [17, 24, 39], fontStyle: "bold" },
        styles: { fontSize: 9, cellPadding: 3 },
      });

      doc.save(`OutPass_Report_${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("Out Pass PDF report downloaded successfully");
      setIsDownloadOpen(false);
    } catch (err) {
      toast.error("Failed to download PDF report");
      console.error(err);
    }
  };

  const downloadSingleOutPassExcel = (pass: OutPass) => {
    try {
      const vNum = pass.vehicle || pass.passId || pass.id;
      const formattedData = [{
        "Pass ID": pass.passId || pass.id || "-",
        "Vehicle": pass.vehicle || "-",
        "Model": pass.model || "-",
        "Customer": pass.customer || "-",
        "Phone": pass.phone || "-",
        "Service": pass.service || "-",
        "Out Date": formatDateStr(pass.outTime),
        "Out Time": formatTimeStr(pass.outTime),
        "Technician": pass.technicianName || pass.technician || "-",
        "Security Guard": pass.securityName || pass.security || "-",
      }];

      const worksheet = XLSX.utils.json_to_sheet(formattedData);
      worksheet["!cols"] = [
        { wch: 16 }, { wch: 18 }, { wch: 18 }, { wch: 20 },
        { wch: 16 }, { wch: 22 }, { wch: 14 }, { wch: 12 },
        { wch: 18 }, { wch: 18 },
      ];
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Out Pass Details");

      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.style.display = "none";
      link.href = url;
      link.download = `OutPass_${vNum}_Details.xlsx`;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);

      toast.success("Out Pass details (.xlsx) downloaded");
    } catch (err) {
      toast.error("Failed to download Out Pass details");
      console.error(err);
    }
  };

  const downloadSingleOutPassPDF = (pass: OutPass) => {
    try {
      const vNum = pass.vehicle || pass.passId || pass.id;
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      doc.setFillColor(30, 41, 59);
      doc.rect(0, 0, 210, 24, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(`OUT PASS DETAILS - ${vNum}`, 14, 16);

      const tableData = [
        ["Pass ID", pass.passId || pass.id || "-"],
        ["Vehicle No.", pass.vehicle || "-"],
        ["Model", pass.model || "-"],
        ["Customer Name", pass.customer || "-"],
        ["Phone Number", pass.phone || "-"],
        ["Service", pass.service || "-"],
        ["Check-Out Date", formatDateStr(pass.outTime)],
        ["Check-Out Time", formatTimeStr(pass.outTime)],
        ["Technician", pass.technicianName || pass.technician || "-"],
        ["Security Guard", pass.securityName || pass.security || "-"],
      ];

      autoTable(doc, {
        startY: 30,
        head: [["Field", "Details"]],
        body: tableData,
        theme: "striped",
        headStyles: { fillColor: [240, 177, 0], textColor: [17, 24, 39], fontStyle: "bold" },
        styles: { fontSize: 10, cellPadding: 4 },
      });

      doc.save(`OutPass_${vNum}_Details.pdf`);
      toast.success("Out Pass details (.pdf) downloaded");
    } catch (err) {
      toast.error("Failed to download Out Pass PDF");
      console.error(err);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading out passes...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-4 sm:p-6 md:p-8">
      {/* 4 Status KPI Cards Row (Single Horizontal Row) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* 1. All */}
        <div
          onClick={() => setStatusFilter("All")}
          className={`bg-white rounded-2xl border p-4 shadow-2xs flex items-center justify-between cursor-pointer select-none transition-all ${
            statusFilter === "All"
              ? "border-slate-800 ring-2 ring-slate-800/20 bg-slate-50/60 shadow-sm"
              : "border-gray-200 hover:border-slate-300"
          }`}
        >
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">All</p>
            <p className="text-2xl font-bold text-gray-900">{allCount}</p>
          </div>
          <div className="p-3 bg-slate-100 text-slate-700 rounded-2xl shrink-0">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* 2. Pending */}
        <div
          onClick={() => setStatusFilter("Pending")}
          className={`bg-white rounded-2xl border p-4 shadow-2xs flex items-center justify-between cursor-pointer select-none transition-all ${
            statusFilter === "Pending"
              ? "border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/60 shadow-sm"
              : "border-gray-200 hover:border-amber-200"
          }`}
        >
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Pending</p>
            <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
          </div>
          <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* 4. Rejected */}
        <div
          onClick={() => setStatusFilter("Rejected")}
          className={`bg-white rounded-2xl border p-4 shadow-2xs flex items-center justify-between cursor-pointer select-none transition-all ${
            statusFilter === "Rejected"
              ? "border-red-500 ring-2 ring-red-500/20 bg-red-50/60 shadow-sm"
              : "border-gray-200 hover:border-red-200"
          }`}
        >
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Rejected</p>
            <p className="text-2xl font-bold text-gray-900">{rejectedCount}</p>
          </div>
          <div className="p-3 bg-red-100 text-red-600 rounded-2xl shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
        </div>

        {/* 5. Delivered */}
        <div
          onClick={() => setStatusFilter("Delivered")}
          className={`bg-white rounded-2xl border p-4 shadow-2xs flex items-center justify-between cursor-pointer select-none transition-all ${
            statusFilter === "Delivered"
              ? "border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/60 shadow-sm"
              : "border-gray-200 hover:border-blue-200"
          }`}
        >
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Delivered</p>
            <p className="text-2xl font-bold text-gray-900">{deliveredCount}</p>
          </div>
          <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl shrink-0">
            <Truck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Toolbar: Search -> From Date -> To Date -> Download */}
      <div className="mb-6 flex flex-nowrap items-center gap-2.5 border-b border-gray-200 pb-4 w-full">
        {/* 1. Search Bar */}
        <div className="relative flex-1 min-w-[140px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search out passes..."
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
            onChange={(e) => setFromDate(e.target.value)}
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
            onChange={(e) => setToDate(e.target.value)}
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
                  onClick={downloadOutPassExcel}
                  className="w-full px-4 py-2.5 text-left text-xs font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  Download as CSV
                </button>
                <button
                  type="button"
                  onClick={() => {
                    downloadOutPassPDF();
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

      </div>

      {/* Filter Buttons Below Search Bar */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {[
          { id: "All", label: "All", count: allCount },
          { id: "Pending", label: "Pending", count: pendingCount },
          { id: "Rejected", label: "Rejected", count: rejectedCount },
          { id: "Delivered", label: "Delivered", count: deliveredCount },
        ].map((tab) => {
          const isActive = statusFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-2xs ${
                isActive
                  ? tab.id === "Pending"
                    ? "bg-amber-600 text-white shadow-xs ring-2 ring-amber-600/20"
                    : tab.id === "Rejected"
                    ? "bg-red-600 text-white shadow-xs ring-2 ring-red-600/20"
                    : tab.id === "Delivered"
                    ? "bg-blue-600 text-white shadow-xs ring-2 ring-blue-600/20"
                    : tab.id === "Approved"
                    ? "bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-600/20"
                    : "bg-slate-900 text-white shadow-xs ring-2 ring-slate-900/20"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 hover:border-gray-300"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                  isActive
                    ? "bg-white/25 text-white"
                    : tab.id === "Pending"
                    ? "bg-amber-100 text-amber-800"
                    : tab.id === "Rejected"
                    ? "bg-red-100 text-red-700"
                    : tab.id === "Delivered"
                    ? "bg-blue-100 text-blue-700"
                    : tab.id === "Approved"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Display Area (Cards / Table) */}
      {viewMode === "cards" ? (
        <div className="space-y-6">
          {filteredOutPasses.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-300 rounded-xl p-8 text-center text-gray-500 text-sm">
              No out passes registered.
            </div>
          ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredOutPasses.map((pass) => {
                  const isApproved = pass.status === "Approved" || pass.status === "Delivered" || pass.issued === true;
                  const isRejected = pass.status === "Rejected";
                  const isPending = !isApproved && !isRejected;

                  const cardBgClass = isApproved
                    ? "bg-emerald-50/20 border-emerald-200 hover:border-emerald-300"
                    : isRejected
                    ? "bg-red-50/20 border-red-200 hover:border-red-300"
                    : "bg-amber-50/30 border-amber-200 hover:border-amber-300";

                  const iconBgClass = isApproved
                    ? "bg-emerald-100 text-emerald-600"
                    : isRejected
                    ? "bg-red-100 text-red-600"
                    : "bg-amber-100 text-amber-700";

                  const downloadBtnClass = isApproved
                    ? "bg-emerald-100/70 hover:bg-emerald-200/80 text-emerald-700"
                    : isRejected
                    ? "bg-red-100/70 hover:bg-red-200/80 text-red-700"
                    : "bg-amber-100/70 hover:bg-amber-200/80 text-amber-800";

                  const viewBtnClass = isApproved
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : isRejected
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-amber-600 hover:bg-amber-700";

                  const dividerClass = isApproved
                    ? "border-emerald-100/70"
                    : isRejected
                    ? "border-red-100/70"
                    : "border-amber-100/70";

                  return (
                    <div
                      key={pass.id}
                      className={`${cardBgClass} border rounded-2xl p-4 shadow-xs transition-all flex flex-col justify-between`}
                    >
                      <div>
                        {/* Card Header */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl ${iconBgClass} flex items-center justify-center shrink-0`}>
                              <Car className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="text-base font-black text-gray-900 tracking-tight">
                                {pass.vehicle || "—"}
                              </h3>
                              <p className="text-xs text-gray-500 font-medium">
                                {pass.model || "—"}
                              </p>
                            </div>
                          </div>

                          {/* Top-Center Status Badge */}
                          {isApproved && (
                            <div className="flex-1 flex justify-center items-center">
                              <span className="px-3 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                                {pass.status === "Delivered" ? "Delivered" : "Approved"}
                              </span>
                            </div>
                          )}
                          {isPending && (
                            <div className="flex-1 flex justify-center items-center">
                              <span className="px-3 py-0.5 bg-amber-100 text-amber-800 rounded-full text-xs font-bold animate-pulse">
                                Pending Approval
                              </span>
                            </div>
                          )}
                          {isRejected && (
                            <div className="flex-1 flex justify-center items-center">
                              <span className="px-3 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-bold">
                                Rejected
                              </span>
                            </div>
                          )}

                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setActiveCardDownloadId(activeCardDownloadId === pass.id ? null : pass.id)}
                              className={`p-1.5 ${downloadBtnClass} rounded-full transition-colors cursor-pointer flex items-center justify-center`}
                              title="Download outpass record"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>

                            {activeCardDownloadId === pass.id && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setActiveCardDownloadId(null)} />
                                <div className="absolute right-0 mt-1.5 w-44 bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 text-left">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      downloadSingleOutPassExcel(pass);
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
                                      downloadSingleOutPassPDF(pass);
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

                          {isRejected && (
                            <button
                              type="button"
                              onClick={() => { setEditingPass(pass); setIsDialogOpen(true); }}
                              className={`p-1.5 ${downloadBtnClass} rounded-full transition-colors cursor-pointer flex items-center justify-center`}
                              title="Edit out pass"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handlePrintClick(pass)}
                            className={`${viewBtnClass} text-white text-[11px] font-semibold px-3 py-1 rounded-full whitespace-nowrap shadow-2xs transition-colors cursor-pointer`}
                          >
                            View
                          </button>
                        </div>
                        </div>

                        <div className={`border-t ${dividerClass} my-3`} />

                        {/* Card Body Details */}
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <p className="text-[10px] uppercase font-semibold text-gray-400">Pass ID</p>
                            <p className="font-bold text-amber-500 font-mono mt-0.5">{pass.passId || pass.id}</p>
                            <p className="text-[10px] uppercase font-semibold text-gray-400 mt-2">Customer</p>
                            <p className="font-bold text-gray-900 mt-0.5">{pass.customer || "—"}</p>
                          </div>

                          <div>
                            <p className="text-[10px] uppercase font-semibold text-gray-400">Service</p>
                            <p className="font-bold text-gray-900 mt-0.5">{pass.service || "—"}</p>
                            <p className="text-[10px] uppercase font-semibold text-gray-400 mt-2">Mobile</p>
                            <p className="font-medium text-gray-700 mt-0.5 flex items-center gap-1">
                              <Phone className="w-3.5 h-3.5 text-gray-400" />
                              {pass.phone || "—"}
                            </p>
                          </div>

                          <div>
                            <p className="text-[10px] uppercase font-semibold text-gray-400">Check-Out Date</p>
                            <p className="font-medium text-gray-700 mt-0.5 flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-gray-400" />
                              {formatDateStr(pass.outTime)}
                            </p>
                            <p className="text-[10px] uppercase font-semibold text-gray-400 mt-2">Check-Out Time</p>
                            <p className="font-medium text-gray-700 mt-0.5 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-gray-400" />
                              {formatTimeStr(pass.outTime)}
                            </p>
                          </div>
                        </div>

                        {/* Enriched fields: Job Card, Invoice, Payment, Status, Generated By */}
                        {(pass.jobCardId || pass.invoiceId || pass.paymentStatus || pass.createdBy) && (
                          <div className={`mt-3 pt-3 border-t ${dividerClass} grid grid-cols-2 gap-2 text-xs`}>
                            {pass.jobCardId && (
                              <div>
                                <p className="text-[10px] uppercase font-semibold text-gray-400">Job Card</p>
                                <p className="font-bold text-gray-900 mt-0.5 font-mono">{pass.jobCardId}</p>
                              </div>
                            )}
                            {pass.invoiceId && (
                              <div>
                                <p className="text-[10px] uppercase font-semibold text-gray-400">Invoice</p>
                                <p className="font-bold text-gray-900 mt-0.5 font-mono">{pass.invoiceId}</p>
                              </div>
                            )}
                            {pass.paymentStatus && (
                              <div>
                                <p className="text-[10px] uppercase font-semibold text-gray-400">Payment</p>
                                <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  pass.paymentStatus === "Paid" ? "bg-emerald-100 text-emerald-700" :
                                  pass.paymentStatus === "Approved Credit" ? "bg-blue-100 text-blue-700" :
                                  "bg-amber-100 text-amber-700"
                                }`}>
                                  {pass.paymentStatus}
                                </span>
                              </div>
                            )}
                            {pass.status && !isApproved && (
                              <div>
                                <p className="text-[10px] uppercase font-semibold text-gray-400">Pass Status</p>
                                <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  pass.status === "Rejected" ? "bg-red-100 text-red-700" :
                                  pass.status === "Updated" ? "bg-amber-100 text-amber-800" :
                                  "bg-gray-100 text-gray-600"
                                }`}>
                                  {pass.status}
                                </span>
                              </div>
                            )}
                            {pass.createdBy && (
                              <div className="col-span-2">
                                <p className="text-[10px] uppercase font-semibold text-gray-400">Generated By</p>
                                <p className="font-medium text-gray-700 mt-0.5 flex items-center gap-1">
                                  <User className="w-3 h-3 text-gray-400" />
                                  {pass.createdBy}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Approval / Rejection Actions for Pending Outpasses */}
                        {isPending && (
                          <div className={`mt-3 pt-3 border-t ${dividerClass} flex gap-2`}>
                            <button
                              onClick={() => handleApproveClick(pass)}
                              className="flex-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-bold py-1.5 rounded-lg text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectClick(pass)}
                              className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 font-bold py-1.5 rounded-lg text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Out Pass Register</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full table-fixed">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-3 py-3 text-left text-[11px] font-bold text-gray-900 uppercase tracking-wider">Pass ID</th>
                  <th className="px-3 py-3 text-left text-[11px] font-bold text-gray-900 uppercase tracking-wider">Vehicle</th>
                  <th className="px-3 py-3 text-left text-[11px] font-bold text-gray-900 uppercase tracking-wider">Customer</th>
                  <th className="px-3 py-3 text-left text-[11px] font-bold text-gray-900 uppercase tracking-wider">Job Card</th>
                  <th className="px-3 py-3 text-left text-[11px] font-bold text-gray-900 uppercase tracking-wider">Invoice</th>
                  <th className="px-3 py-3 text-left text-[11px] font-bold text-gray-900 uppercase tracking-wider">Payment</th>
                  <th className="px-3 py-3 text-left text-[11px] font-bold text-gray-900 uppercase tracking-wider">Status</th>
                  <th className="px-3 py-3 text-left text-[11px] font-bold text-gray-900 uppercase tracking-wider">Out Time</th>
                  <th className="px-3 py-3 text-left text-[11px] font-bold text-gray-900 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredOutPasses.map((pass) => {
                  const isApproved = pass.status === "Approved" || pass.status === "Delivered" || pass.issued === true;
                  const isRejected = pass.status === "Rejected";
                  const isPending = !isApproved && !isRejected;

                  return (
                    <tr key={pass.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-3 text-xs font-mono font-bold" style={{ color: "#F0B100" }}>{pass.passId || pass.id}</td>
                      <td className="px-3 py-3 text-xs font-bold text-gray-900 whitespace-nowrap">{pass.vehicle}</td>
                      <td className="px-3 py-3 text-xs">
                        <div className="font-bold text-gray-900">{pass.customer}</div>
                        <div className="text-[10px] font-medium text-gray-500">{pass.phone}</div>
                      </td>
                      <td className="px-3 py-3 text-xs font-mono text-gray-700">{pass.jobCardId || "—"}</td>
                      <td className="px-3 py-3 text-xs font-mono text-gray-700">{pass.invoiceId || "—"}</td>
                      <td className="px-3 py-3 text-xs">
                        {pass.paymentStatus ? (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            pass.paymentStatus === "Paid" ? "bg-emerald-100 text-emerald-700" :
                            pass.paymentStatus === "Approved Credit" ? "bg-blue-100 text-blue-700" :
                            "bg-amber-100 text-amber-700"
                          }`}>
                            {pass.paymentStatus}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-3 py-3 text-xs">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isApproved ? "bg-emerald-100 text-emerald-700" :
                          isRejected ? "bg-red-100 text-red-700" :
                          isPending ? "bg-amber-100 text-amber-800" :
                          "bg-gray-100 text-gray-600"
                        }`}>
                          {pass.status || "Pending"}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs font-medium text-gray-900">
                        {pass.outTime ? new Date(pass.outTime).toLocaleString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                      </td>
                      <td className="px-3 py-3 text-xs">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handlePrintClick(pass)}
                            className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-2 py-1 rounded text-[10px] transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Printer className="w-3 h-3" />
                            Print
                          </button>
                          {isRejected && (
                            <button
                              onClick={() => { setEditingPass(pass); setIsDialogOpen(true); }}
                              className="p-1 hover:bg-gray-100 rounded transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-gray-600" />
                            </button>
                          )}
                          {isPending && (
                            <>
                              <button
                                onClick={() => handleApproveClick(pass)}
                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                                title="Approve"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleRejectClick(pass)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                title="Reject"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <NewOutPassDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingPass(null);
        }}
        onSubmit={handleSave}
        initialData={editingPass}
      />
      <PrintPassDialog
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        pass={selectedPass ? {
          ...selectedPass,
          passId: selectedPass.passId || selectedPass.id,
          technician: selectedPass.technicianName || selectedPass.technician || "",
          security: selectedPass.securityName || selectedPass.security || "",
          jobCardId: selectedPass.jobCardId,
          invoiceId: selectedPass.invoiceId,
          paymentStatus: selectedPass.paymentStatus,
          createdBy: selectedPass.createdBy,
        } : undefined}
      />
    </div>
  );
}

