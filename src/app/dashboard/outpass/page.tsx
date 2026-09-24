"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useCallback } from "react";
import {
  Edit2,
  X,
  Download,
  ChevronDown,
  FileSpreadsheet,
  FileText,
  CheckCircle,
  XCircle,
  ShieldAlert,
} from "lucide-react";
import NewOutPassDialog from "@/components/outpass/NewOutPassDialog";
import { SummaryCard } from "@/components/common/SummaryCard";
import { ListHeader } from "@/components/common/ListHeader";
import PrintPassDialog from "@/components/outpass/PrintPassDialog";
import { formatOutPassId } from "@/utils/outPassFormatter";
import { getOutPasses, createOutPass, updateOutPass, approveOutpass, rejectOutpass } from "@/lib/api";
import { getScopedFranchiseId, scopeToFranchise } from "@/lib/franchise-scope";
import { toast } from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { StatusText } from "@/components/common/StatusText";

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
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Custom confirmation modal state (replaces window.confirm)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: "approve" | "reject" | null;
    pass: OutPass | null;
  }>({ isOpen: false, type: null, pass: null });
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserRole(user.role?.split("|")[0] || null);
      } catch (e) { }
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
    } catch (err: any) {
      console.error("Failed to save out pass:", err);
      toast.error("Failed to save out pass: " + (err.message || "Unknown error"));
    }
  };

  const handlePrintClick = (pass: OutPass) => {
    setSelectedPass(pass);
    setIsPrintOpen(true);
  };

  const triggerApproveConfirm = (pass: OutPass) => {
    setConfirmModal({ isOpen: true, type: "approve", pass });
  };

  const triggerRejectConfirm = (pass: OutPass) => {
    setConfirmModal({ isOpen: true, type: "reject", pass });
  };

  const closeConfirmModal = () => setConfirmModal((prev) => ({ ...prev, isOpen: false }));

  const handleConfirmAction = async () => {
    const { type, pass } = confirmModal;
    if (!type || !pass) return;

    setIsConfirming(true);
    try {
      if (type === "approve") {
        await approveOutpass(pass.id);
        toast.success("Out pass approved successfully");
      } else {
        await rejectOutpass(pass.id);
        toast.success("Out pass rejected successfully");
      }
      closeConfirmModal();
      fetchOutPasses();
    } catch (err: any) {
      toast.error(`Failed to ${type} out pass: ` + (err.message || "Unknown error"));
      console.error(err);
    } finally {
      setIsConfirming(false);
    }
  };
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

      const formattedData = dataToExport.map((pass, index) => ({
        "Pass ID": formatOutPassId(pass.passId || pass.id, index),
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

      const tableData = dataToExport.map((pass, index) => [
        formatOutPassId(pass.passId || pass.id, index),
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
        "Pass ID": formatOutPassId(pass.passId || pass.id),
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
        ["Pass ID", formatOutPassId(pass.passId || pass.id)],
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
        <SummaryCard label="All" value={allCount} active={statusFilter === "All"} onClick={() => setStatusFilter("All")} />
        <SummaryCard label="Pending" value={pendingCount} active={statusFilter === "Pending"} onClick={() => setStatusFilter("Pending")} />
        <SummaryCard tone="bad" label="Rejected" value={rejectedCount} active={statusFilter === "Rejected"} onClick={() => setStatusFilter("Rejected")} />
        <SummaryCard tone="good" label="Delivered" value={deliveredCount} active={statusFilter === "Delivered"} onClick={() => setStatusFilter("Delivered")} />
      </div>

      <section className="space-y-3">
        <ListHeader
          title="Out Passes"
          filterLabel={statusFilter === "All" ? undefined : statusFilter}
          count={filteredOutPasses.length}
          hint="Approve a pending out pass to let the vehicle leave; print it for the gate."
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search pass, vehicle, customer..."
        >
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
              className={`p-0.5 rounded transition-colors flex items-center justify-center shrink-0 ${fromDate
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
              className={`p-0.5 rounded transition-colors flex items-center justify-center shrink-0 ${toDate
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
        </ListHeader>

      {/* Out Pass Register */}
      {filteredOutPasses.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-slate-500 text-sm">
          {searchQuery
            ? `No out passes match "${searchQuery}".`
            : statusFilter === "Pending"
            ? "Nothing waiting for approval."
            : statusFilter === "All"
            ? "No out passes yet. One is created when a paid vehicle is ready to leave."
            : `No ${statusFilter.toLowerCase()} out passes.`}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
          <table className="data-table w-full min-w-[1150px] text-left">
            <thead>
              <tr>
                <th>Pass ID</th>
                <th>Vehicle</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>Job Card</th>
                <th>Invoice</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Out Time</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOutPasses.map((pass) => {
                const isApproved = pass.status === "Approved" || pass.status === "Delivered" || pass.issued === true;
                const isRejected = pass.status === "Rejected";
                const isPending = !isApproved && !isRejected;

                return (
                  <tr key={pass.id}>
                    <td className="whitespace-nowrap">{formatOutPassId(pass.passId || pass.id, outPasses.indexOf(pass))}</td>
                    <td className="whitespace-nowrap uppercase">{pass.vehicle}</td>
                    <td className="max-w-[180px] truncate">{pass.customer}</td>
                    <td className="whitespace-nowrap">{pass.phone || "—"}</td>
                    <td className="whitespace-nowrap">{pass.jobCardId || "—"}</td>
                    <td className="whitespace-nowrap">{pass.invoiceId || "—"}</td>
                    <td className="whitespace-nowrap"><StatusText status={pass.paymentStatus} /></td>
                    <td className="whitespace-nowrap"><StatusText status={pass.status || "Pending"} /></td>
                    <td className="whitespace-nowrap">
                      {pass.outTime ? new Date(pass.outTime).toLocaleString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                    </td>
                    <td className="whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handlePrintClick(pass)} className="px-1">
                          Print
                        </button>
                        <button onClick={() => downloadSingleOutPassExcel(pass)} className="p-1.5" title="Download as CSV">
                          <FileSpreadsheet className="w-4 h-4" />
                        </button>
                        <button onClick={() => downloadSingleOutPassPDF(pass)} className="p-1.5" title="Download as PDF">
                          <FileText className="w-4 h-4" />
                        </button>
                        {isRejected && (
                          <button
                            onClick={() => { setEditingPass(pass); setIsDialogOpen(true); }}
                            className="p-1.5"
                            title="Edit out pass"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {isPending && (
                          <>
                            <button
                              onClick={() => triggerApproveConfirm(pass)}
                              className="keep-color px-1 text-sm font-medium text-green-700 hover:underline underline-offset-2 cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => triggerRejectConfirm(pass)}
                              className="keep-color px-1 text-sm font-medium text-red-600 hover:underline underline-offset-2 cursor-pointer"
                            >
                              Reject
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
      )}
      </section>

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
          passId: formatOutPassId(selectedPass.passId || selectedPass.id),
          technician: selectedPass.technicianName || selectedPass.technician || "",
          security: selectedPass.securityName || selectedPass.security || "",
          jobCardId: selectedPass.jobCardId,
          invoiceId: selectedPass.invoiceId,
          paymentStatus: selectedPass.paymentStatus,
          createdBy: selectedPass.createdBy,
        } : undefined}
      />

      {/* Approve / Reject Confirmation Modal */}
      {confirmModal.isOpen && confirmModal.pass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-3 rounded-full shrink-0 ${confirmModal.type === "approve" ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"}`}>
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">
                {confirmModal.type === "approve" ? "Approve out pass?" : "Reject out pass?"}
              </h3>
            </div>

            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              You&apos;re about to{" "}
              <span className="font-semibold text-slate-900">{confirmModal.type}</span> out pass{" "}
              <span className="font-mono font-semibold text-amber-600">
                {formatOutPassId(confirmModal.pass.passId || confirmModal.pass.id)}
              </span>{" "}
              for vehicle <span className="font-semibold text-slate-900">{confirmModal.pass.vehicle}</span>.
              {confirmModal.type === "approve"
                ? " This will authorize the vehicle to leave the premises."
                : " The pass will be marked as rejected and can be edited and resubmitted."}
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeConfirmModal}
                disabled={isConfirming}
                className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                disabled={isConfirming}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm transition-colors flex items-center gap-2 disabled:opacity-60 ${confirmModal.type === "approve"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-red-600 hover:bg-red-700"
                  }`}
              >
                {confirmModal.type === "approve" ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                {isConfirming ? "Please wait…" : confirmModal.type === "approve" ? "Approve" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div >
  );
}

