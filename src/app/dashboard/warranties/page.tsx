"use client";

import React, { useState, useEffect } from "react";
import {
  getWarranties,
  generateWarrantyFromInvoice,
  WarrantyRecord,
} from "@/lib/api";
import { toast } from "react-hot-toast";
import CreateWarrantyDialog from "@/modules/warranty/components/CreateWarrantyDialog";
import WarrantyDetailsDialog from "@/modules/warranty/components/WarrantyDetailsDialog";
import {
  ShieldCheck, FileText, Clock, Calendar, Printer, Plus, Download,
  Search, X, Eye, Pencil, CheckCircle2, Filter
} from "lucide-react";

export type CardFilterType = "ALL" | "ACTIVE" | "EXPIRING_SOON" | "EXPIRED" | "CLAIMS_RAISED" | "CLAIMS_APPROVED";

export default function WarrantyManagementPage() {
  const [warranties, setWarranties] = useState<WarrantyRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [cardFilter, setCardFilter] = useState<CardFilterType>("ALL");

  const getTodayISO = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleDateFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.value;
    const today = getTodayISO();
    if (selected && selected > today) {
      toast.error("Future dates are not allowed. Please select today or a past date.");
      setDateFrom(today);
      return;
    }
    setDateFrom(selected);
  };

  const handleDateToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.value;
    const today = getTodayISO();
    if (selected && selected > today) {
      toast.error("Future dates are not allowed. Please select today or a past date.");
      setDateTo(today);
      return;
    }
    setDateTo(selected);
  };

  // Modals & Dialogs
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedWarranty, setSelectedWarranty] = useState<WarrantyRecord | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"view" | "edit">("view");

  const handlePrintWarranty = (w: WarrantyRecord) => {
    const printWindow = window.open("", "_blank", "width=850,height=950");
    if (!printWindow) return;

    const wNo = w.warrantyNo || `WR-2026-${w.id?.slice(-4) || "0001"}`;
    const custName = w.customer?.name || w.customerId || "Customer";
    const vehNo = w.vehicleNo || "N/A";
    const invNo = w.invoiceId ? (w.invoiceId.startsWith("INV") ? w.invoiceId : `INV-${w.invoiceId}`) : "N/A";
    const item = w.itemName || "Service Coverage";
    const days = w.durationDays ? `${w.durationDays} Days` : "365 Days";
    const sDate = w.startDate ? new Date(w.startDate).toLocaleDateString("en-IN") : "N/A";
    const eDate = w.expiryDate ? new Date(w.expiryDate).toLocaleDateString("en-IN") : "N/A";
    const notes = w.notes || "Standard workshop warranty coverage applies.";

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Warranty Certificate - ${wNo}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 40px; color: #0f172a; background: #fff; }
            .cert-card { border: 4px double #facc15; padding: 40px; border-radius: 16px; max-width: 750px; margin: 0 auto; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
            .header { text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 32px; font-weight: 900; letter-spacing: 2px; color: #0f172a; margin: 0; }
            .subtitle { font-size: 14px; font-weight: 700; color: #d97706; text-transform: uppercase; letter-spacing: 3px; margin-top: 4px; }
            .cert-title { font-size: 20px; font-weight: 800; text-align: center; color: #1e293b; margin-bottom: 24px; text-transform: uppercase; text-decoration: underline; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
            .box { background: #f8fafc; padding: 12px 16px; border-radius: 8px; border: 1px solid #e2e8f0; }
            .label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }
            .value { font-size: 14px; font-weight: 700; color: #0f172a; }
            .terms { background: #fffbeb; border: 1px solid #fef3c7; padding: 16px; border-radius: 8px; font-size: 12px; color: #92400e; line-height: 1.6; margin-top: 20px; }
            .footer { margin-top: 40px; display: flex; justify-content: space-between; align-items: flex-end; padding-top: 20px; border-top: 1px solid #e2e8f0; }
            .sign { text-align: center; }
            .sign-line { border-top: 1px solid #94a3b8; width: 160px; margin-bottom: 4px; }
            @media print {
              body { padding: 0; }
              .cert-card { border-color: #000; box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="cert-card">
            <div class="header">
              <h1 class="logo">SHIFTERZ</h1>
              <div class="subtitle">WARRANTY CERTIFICATE</div>
            </div>
            <div class="cert-title">${wNo}</div>

            <div class="grid">
              <div class="box"><div class="label">Customer Name</div><div class="value">${custName}</div></div>
              <div class="box"><div class="label">Vehicle Number</div><div class="value">${vehNo}</div></div>
              <div class="box"><div class="label">Invoice Reference</div><div class="value">${invNo}</div></div>
              <div class="box"><div class="label">Covered Service / Item</div><div class="value">${item}</div></div>
              <div class="box"><div class="label">Coverage Duration</div><div class="value">${days}</div></div>
              <div class="box"><div class="label">Start Date</div><div class="value">${sDate}</div></div>
              <div class="box"><div class="label">Expiry Date</div><div class="value">${eDate}</div></div>
              <div class="box"><div class="label">Coverage Status</div><div class="value">${w.status || "Active"}</div></div>
            </div>

            <div class="terms">
              <strong>Coverage Terms & Conditions:</strong><br/>
              ${notes}
            </div>

            <div class="footer">
              <div>
                <p style="font-size: 11px; color: #64748b; margin: 0;">Issued by: Workshop Manager</p>
                <p style="font-size: 11px; color: #64748b; margin: 4px 0 0 0;">Date: ${new Date().toLocaleDateString("en-IN")}</p>
              </div>
              <div class="sign">
                <div class="sign-line"></div>
                <span style="font-size: 11px; font-weight: 700; color: #475569;">Authorized Signatory</span>
              </div>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Generate From Invoice Modal
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [invoiceIdInput, setInvoiceIdInput] = useState("");
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
  const [invoiceGenError, setInvoiceGenError] = useState<string | null>(null);

  useEffect(() => {
    loadWarranties();
  }, []);

  const loadWarranties = async () => {
    setLoading(true);
    try {
      const data = await getWarranties({
        search: searchQuery || undefined,
      });
      setWarranties(data || []);
    } catch (err) {
      console.error("Failed to load warranties:", err);
      setWarranties([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFromInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceIdInput.trim()) {
      setInvoiceGenError("Please enter an Invoice Number or STZ Number.");
      return;
    }
    setIsGeneratingInvoice(true);
    setInvoiceGenError(null);
    try {
      const created = await generateWarrantyFromInvoice(invoiceIdInput.trim());
      setIsGeneratingInvoice(false);
      setInvoiceIdInput("");
      setIsGenerateModalOpen(false);
      await loadWarranties();
      if (!created || (Array.isArray(created) && created.length === 0)) {
        toast.error("No invoice found or no warranty could be generated.");
      } else {
        const count = Array.isArray(created) ? created.length : 1;
        toast.success(`Successfully generated ${count} warranty record(s) for Document ${invoiceIdInput.trim()}!`);
      }
    } catch (err: any) {
      setInvoiceGenError(err.message || "Failed to generate warranty from invoice.");
      setIsGeneratingInvoice(false);
    }
  };

  const calculateDaysLeft = (expiryDateStr: string) => {
    if (!expiryDateStr) return 0;
    const expiry = new Date(expiryDateStr).getTime();
    const now = new Date().getTime();
    return Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);

  const downloadPDF = async () => {
    setIsDownloadingPDF(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

      // Header Bar (Dark Slate 900)
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 297, 22, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.text("Shifterz ERP – Warranty Management Report", 14, 14);

      // Generated Timestamp (Right-aligned)
      const generated = `Generated: ${new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}`;
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(226, 232, 240);
      doc.text(generated, 297 - 14, 14, { align: "right" });

      // Summary Bar Subtitle
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(51, 65, 85);
      doc.text(
        `Total Warranties: ${totalCount}   |   Active Coverage: ${activeCount}   |   Expiring Soon: ${expiringSoonCount}   |   Expired: ${expiredCount}   |   Claims Raised: ${claimsRaisedCount}   |   Claims Approved: ${claimsApprovedCount}`,
        14, 29
      );

      // Table
      const tableHead = [["Warranty No", "Customer", "Vehicle No", "Invoice No", "Covered Item", "Start Date", "Expiry Date", "Days Left", "Status"]];
      const tableBody = filteredWarranties.map((w, idx) => {
        const daysLeft = calculateDaysLeft(w.expiryDate);
        const isExpired = w.status === "Expired" || daysLeft < 0;
        return [
          w.warrantyNo || `WR-000${idx + 1}`,
          w.customer?.name || w.customerId || "Hari",
          w.vehicleNo || "TN38AB1234",
          w.invoiceId ? (w.invoiceId.startsWith("INV") ? w.invoiceId : `INV-${w.invoiceId}`) : `INV-102${idx + 1}`,
          `${w.itemName || "Ceramic Coating"} (${w.durationDays ? `${w.durationDays} Days` : "3 Years"})`,
          formatDate(w.startDate || "2026-08-01"),
          formatDate(w.expiryDate || "2029-08-01"),
          isExpired ? "Expired" : String(daysLeft),
          isExpired ? "Expired" : w.status || "Active",
        ];
      });

      autoTable(doc, {
        startY: 34,
        head: tableHead,
        body: tableBody,
        theme: "striped",
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 8,
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [30, 41, 59],
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        margin: { left: 14, right: 14 },
      });

      doc.save(`warranties_report_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF report:", err);
      alert("Failed to generate PDF report. Please try again.");
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  // Dynamic KPI Calculations based on actual warranty records
  const totalCount = warranties.length;

  const activeCount = warranties.filter((w) => {
    const daysLeft = calculateDaysLeft(w.expiryDate);
    return w.status === "Active" && daysLeft >= 0;
  }).length;

  const expiringSoonCount = warranties.filter((w) => {
    const daysLeft = calculateDaysLeft(w.expiryDate);
    return w.status !== "Expired" && daysLeft >= 0 && daysLeft <= 30;
  }).length;

  const expiredCount = warranties.filter((w) => {
    const daysLeft = calculateDaysLeft(w.expiryDate);
    return w.status === "Expired" || daysLeft < 0;
  }).length;

  const claimsRaisedCount = warranties.reduce(
    (sum, w) => sum + (w.claimsList?.length || 0),
    0
  ) || warranties.filter((w) => w.claimsList && w.claimsList.length > 0).length;

  const claimsApprovedCount = warranties.reduce((sum, w) => {
    if (!w.claimsList) return sum;
    const app = w.claimsList.filter((c: any) => {
      const st = (c.status || "").toLowerCase();
      return st === "approved" || st === "closed" || st === "accepted";
    }).length;
    return sum + app;
  }, 0) || warranties.filter((w) => (w.status || "").toLowerCase() === "claimed").length;

  // Filter Calculation Logic with Interactive Card Filtering
  const filteredWarranties = warranties.filter((w) => {
    const daysLeft = calculateDaysLeft(w.expiryDate);
    const isExpired = w.status === "Expired" || daysLeft < 0;

    const matchesSearch =
      !searchQuery ||
      (w.warrantyNo || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (w.customer?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (w.vehicleNo || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (w.invoiceId || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (w.itemName || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDate = (() => {
      let valid = true;
      if (w.startDate) {
        const wDate = new Date(w.startDate);
        if (!isNaN(wDate.getTime())) {
          if (dateFrom) {
            const start = new Date(dateFrom + "T00:00:00");
            if (wDate < start) valid = false;
          }
          if (dateTo) {
            const end = new Date(dateTo + "T23:59:59.999");
            if (wDate > end) valid = false;
          }
        }
      }
      return valid;
    })();

    let matchesCard = true;
    if (cardFilter === "ACTIVE") {
      matchesCard = w.status === "Active" && !isExpired;
    } else if (cardFilter === "EXPIRING_SOON") {
      matchesCard = !isExpired && daysLeft >= 0 && daysLeft <= 30;
    } else if (cardFilter === "EXPIRED") {
      matchesCard = isExpired;
    } else if (cardFilter === "CLAIMS_RAISED") {
      matchesCard = Boolean(w.claimsList && w.claimsList.length > 0) || (w.status || "").toLowerCase() === "claimed";
    } else if (cardFilter === "CLAIMS_APPROVED") {
      const hasApproved = w.claimsList && w.claimsList.some((c: any) => {
        const st = (c.status || "").toLowerCase();
        return st === "approved" || st === "closed" || st === "accepted";
      });
      matchesCard = hasApproved || (w.status || "").toLowerCase() === "claimed";
    }

    return matchesSearch && matchesDate && matchesCard;
  });

  const handleCardClick = (type: CardFilterType) => {
    setCardFilter((prev) => (prev === type ? "ALL" : type));
  };

  const getStatusBadge = (s: string, expiryDate: string) => {
    const daysLeft = calculateDaysLeft(expiryDate);
    if (s === "Expired" || daysLeft < 0) {
      return (
        <span className="px-3 py-1 bg-rose-50 text-rose-600 font-bold rounded-full text-xs inline-block">
          Expired
        </span>
      );
    }
    if (s === "Claimed" || s === "Claim Raised") {
      return (
        <span className="px-3 py-1 bg-purple-50 text-purple-600 font-bold rounded-full text-xs inline-block">
          Claim Raised
        </span>
      );
    }
    if (daysLeft <= 30) {
      return (
        <span className="px-3 py-1 bg-amber-50 text-amber-600 font-bold rounded-full text-xs inline-block">
          Expiring Soon
        </span>
      );
    }
    return (
      <span className="px-3 py-1 bg-emerald-50 text-emerald-600 font-bold rounded-full text-xs inline-block">
        Active
      </span>
    );
  };

  return (
    <div className="p-8 space-y-6">
      {/* 6 Type Cards Grid (3 Cards Row 1, 3 Cards Row 2) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* ROW 1 CARD 1: TOTAL WARRANTIES */}
        <div
          onClick={() => handleCardClick("ALL")}
          className={`bg-white rounded-2xl border p-4 shadow-2xs flex items-center justify-between cursor-pointer select-none transition-all ${
            cardFilter === "ALL"
              ? "border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/10 shadow-sm"
              : "border-slate-100 hover:border-blue-200"
          }`}
        >
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">TOTAL WARRANTIES</p>
            <p className="text-2xl font-bold text-slate-900">{totalCount}</p>
            <p className="text-[11px] text-slate-400 font-medium mt-1">All time <span className="text-[10px]">ⓘ</span></p>
          </div>
          <div className="p-3 bg-blue-500 text-white rounded-2xl shrink-0">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        {/* ROW 1 CARD 2: ACTIVE COVERAGE */}
        <div
          onClick={() => handleCardClick("ACTIVE")}
          className={`bg-white rounded-2xl border p-4 shadow-2xs flex items-center justify-between cursor-pointer select-none transition-all ${
            cardFilter === "ACTIVE"
              ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/10 shadow-sm"
              : "border-slate-100 hover:border-emerald-200"
          }`}
        >
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">ACTIVE COVERAGE</p>
            <p className="text-2xl font-bold text-slate-900">{activeCount}</p>
            <p className="text-[11px] text-slate-400 font-medium mt-1">Currently active <span className="text-[10px]">ⓘ</span></p>
          </div>
          <div className="p-3 bg-emerald-500 text-white rounded-2xl shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        {/* ROW 1 CARD 3: EXPIRING SOON */}
        <div
          onClick={() => handleCardClick("EXPIRING_SOON")}
          className={`bg-white rounded-2xl border p-4 shadow-2xs flex items-center justify-between cursor-pointer select-none transition-all ${
            cardFilter === "EXPIRING_SOON"
              ? "border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/10 shadow-sm"
              : "border-slate-100 hover:border-amber-200"
          }`}
        >
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">EXPIRING SOON</p>
            <p className="text-2xl font-bold text-slate-900">{expiringSoonCount}</p>
            <p className="text-[11px] text-slate-400 font-medium mt-1">Within 30 days <span className="text-[10px]">ⓘ</span></p>
          </div>
          <div className="p-3 bg-amber-500 text-white rounded-2xl shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* ROW 2 CARD 1: EXPIRED */}
        <div
          onClick={() => handleCardClick("EXPIRED")}
          className={`bg-white rounded-2xl border p-4 shadow-2xs flex items-center justify-between cursor-pointer select-none transition-all ${
            cardFilter === "EXPIRED"
              ? "border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/10 shadow-sm"
              : "border-slate-100 hover:border-rose-200"
          }`}
        >
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">EXPIRED</p>
            <p className="text-2xl font-bold text-slate-900">{expiredCount}</p>
            <p className="text-[11px] text-slate-400 font-medium mt-1">Past expiry <span className="text-[10px]">ⓘ</span></p>
          </div>
          <div className="p-3 bg-rose-500 text-white rounded-2xl shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        {/* ROW 2 CARD 2: CLAIMS RAISED */}
        <div
          onClick={() => handleCardClick("CLAIMS_RAISED")}
          className={`bg-white rounded-2xl border p-4 shadow-2xs flex items-center justify-between cursor-pointer select-none transition-all ${
            cardFilter === "CLAIMS_RAISED"
              ? "border-purple-500 ring-2 ring-purple-500/20 bg-purple-50/10 shadow-sm"
              : "border-slate-100 hover:border-purple-200"
          }`}
        >
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">CLAIMS RAISED</p>
            <p className="text-2xl font-bold text-slate-900">{claimsRaisedCount}</p>
            <p className="text-[11px] text-slate-400 font-medium mt-1">All time <span className="text-[10px]">ⓘ</span></p>
          </div>
          <div className="p-3 bg-purple-500 text-white rounded-2xl shrink-0">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        {/* ROW 2 CARD 3: CLAIMS APPROVED */}
        <div
          onClick={() => handleCardClick("CLAIMS_APPROVED")}
          className={`bg-white rounded-2xl border p-4 shadow-2xs flex items-center justify-between cursor-pointer select-none transition-all ${
            cardFilter === "CLAIMS_APPROVED"
              ? "border-teal-500 ring-2 ring-teal-500/20 bg-teal-50/10 shadow-sm"
              : "border-slate-100 hover:border-teal-200"
          }`}
        >
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">CLAIMS APPROVED</p>
            <p className="text-2xl font-bold text-slate-900">{claimsApprovedCount}</p>
            <p className="text-[11px] text-slate-400 font-medium mt-1">All time <span className="text-[10px]">ⓘ</span></p>
          </div>
          <div className="p-3 bg-teal-500 text-white rounded-2xl shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter & Actions Bar Container (Single Horizontal Row) */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
        {/* Left Side: Search Bar */}
        <div className="flex-1 relative min-w-[260px] flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search Warranty No, Invoice, Customer, Vehicle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-9 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {cardFilter !== "ALL" && (
            <span
              onClick={() => setCardFilter("ALL")}
              className="px-2.5 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shrink-0 border border-slate-200"
            >
              <Filter className="w-3 h-3 text-blue-600" />
              Filter: {cardFilter.replace("_", " ")}
              <X className="w-3 h-3 text-slate-400 hover:text-slate-600" />
            </span>
          )}
        </div>

        {/* Center / Right: From Date & To Date filters */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shrink-0">
            <span className="text-xs font-bold text-slate-500">From:</span>
            <input
              type="date"
              value={dateFrom}
              max={getTodayISO()}
              onChange={handleDateFromChange}
              className="bg-transparent border-none text-xs text-slate-700 focus:outline-none cursor-pointer p-0 font-medium"
            />
            <button
              type="button"
              disabled={!dateFrom}
              onClick={() => dateFrom && setDateFrom("")}
              className={`p-0.5 rounded transition-colors flex items-center justify-center shrink-0 ${
                dateFrom
                  ? "text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
                  : "text-slate-300 cursor-not-allowed opacity-50"
              }`}
              title={dateFrom ? "Clear From Date" : ""}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shrink-0">
            <span className="text-xs font-bold text-slate-500">To:</span>
            <input
              type="date"
              value={dateTo}
              max={getTodayISO()}
              onChange={handleDateToChange}
              className="bg-transparent border-none text-xs text-slate-700 focus:outline-none cursor-pointer p-0 font-medium"
            />
            <button
              type="button"
              disabled={!dateTo}
              onClick={() => dateTo && setDateTo("")}
              className={`p-0.5 rounded transition-colors flex items-center justify-center shrink-0 ${
                dateTo
                  ? "text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
                  : "text-slate-300 cursor-not-allowed opacity-50"
              }`}
              title={dateTo ? "Clear To Date" : ""}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Single Row of 3 Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            {/* Generate Warranty Invoice */}
            <button
              onClick={() => setIsGenerateModalOpen(true)}
              className="bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-2xs text-xs whitespace-nowrap"
            >
              <Printer className="w-4 h-4" />
              Generate Warranty Invoice
            </button>

            {/* Issue Warranty */}
            <button
              onClick={() => setIsCreateOpen(true)}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-2xs text-xs whitespace-nowrap"
            >
              <Plus className="w-4 h-4 stroke-3" />
              Issue Warranty
            </button>

            {/* Download PDF Button */}
            <button
              onClick={downloadPDF}
              disabled={isDownloadingPDF}
              className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-xs text-xs whitespace-nowrap disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-slate-500" />
              {isDownloadingPDF ? "Downloading..." : "Download"}
            </button>
          </div>
        </div>
      </div>

      {/* Warranties Data Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">WARRANTY NO</th>
                <th className="py-3.5 px-4">CUSTOMER</th>
                <th className="py-3.5 px-4">VEHICLE</th>
                <th className="py-3.5 px-4">INVOICE NO</th>
                <th className="py-3.5 px-4">COVERED ITEM</th>
                <th className="py-3.5 px-4">START DATE</th>
                <th className="py-3.5 px-4">EXPIRY DATE</th>
                <th className="py-3.5 px-4">DAYS LEFT</th>
                <th className="py-3.5 px-4">STATUS</th>
                <th className="py-3.5 px-4 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-900">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    Loading warranties...
                  </td>
                </tr>
              ) : filteredWarranties.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    No warranty records found for selected filter.
                  </td>
                </tr>
              ) : (
                filteredWarranties.map((w, idx) => {
                  const daysLeft = calculateDaysLeft(w.expiryDate);
                  const isExpired = w.status === "Expired" || daysLeft < 0;

                  return (
                    <tr key={w.id || idx} className="hover:bg-slate-50/60 transition-colors">
                      {/* Warranty No */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {w.warrantyNo || `WR-000${idx + 1}`}
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                        {w.customer?.name || w.customerId || "Hari"}
                      </td>

                      {/* Vehicle */}
                      <td className="py-3.5 px-4 min-w-[140px]">
                        <p className="font-bold text-slate-900 font-mono uppercase">{w.vehicleNo || "TN38AB1234"}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5 truncate">Hyundai Creta</p>
                      </td>

                      {/* Invoice No */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800 whitespace-nowrap">
                        {w.invoiceId ? (w.invoiceId.startsWith("INV") ? w.invoiceId : `INV-${w.invoiceId}`) : `INV-102${idx + 1}`}
                      </td>

                      {/* Covered Item */}
                      <td className="py-3.5 px-4 min-w-[150px]">
                        <p className="font-bold text-slate-900">{w.itemName || "Ceramic Coating"}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{w.durationDays ? `${w.durationDays} Days` : "3 Years"}</p>
                      </td>

                      {/* Start Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-700">
                        {formatDate(w.startDate || "2026-08-01")}
                      </td>

                      {/* Expiry Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-700">
                        {formatDate(w.expiryDate || "2029-08-01")}
                      </td>

                      {/* Days Left */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono font-bold">
                        {isExpired ? (
                          <span className="text-rose-600">Expired</span>
                        ) : daysLeft <= 30 ? (
                          <span className="text-amber-600">{daysLeft}</span>
                        ) : (
                          <span className="text-emerald-600">{daysLeft}</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getStatusBadge(w.status, w.expiryDate)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* View Certificate / Details (View Only) */}
                          <button
                            onClick={() => {
                              setSelectedWarranty(w);
                              setDialogMode("view");
                              setIsDetailsOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors bg-white shadow-2xs"
                            title="View Certificate (Read-Only)"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Print Certificate (Direct Print) */}
                          <button
                            onClick={() => handlePrintWarranty(w)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors bg-white shadow-2xs"
                            title="Print Warranty Certificate"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit / Process Claim (Edit Access) */}
                          <button
                            onClick={() => {
                              setSelectedWarranty(w);
                              setDialogMode("edit");
                              setIsDetailsOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-50 border border-purple-100 transition-colors bg-purple-50/50 shadow-2xs"
                            title="Edit Access / Process Claim"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate From Invoice Dialog Modal */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Generate Warranty Invoice</h3>
              <button onClick={() => setIsGenerateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateFromInvoice} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Invoice Number / ID</label>
                <input
                  type="text"
                  value={invoiceIdInput}
                  onChange={(e) => setInvoiceIdInput(e.target.value)}
                  placeholder="e.g. STZ-25-26-0001"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase font-mono"
                  required
                />
              </div>

              {invoiceGenError && (
                <p className="text-xs text-rose-600 font-medium">{invoiceGenError}</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsGenerateModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGeneratingInvoice}
                  className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 disabled:opacity-50"
                >
                  {isGeneratingInvoice ? "Generating..." : "Generate Warranty"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Modal */}
      <CreateWarrantyDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={loadWarranties}
      />

      {/* Details & Claims Modal */}
      <WarrantyDetailsDialog
        warranty={selectedWarranty}
        isOpen={isDetailsOpen}
        mode={dialogMode}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedWarranty(null);
        }}
        onUpdate={loadWarranties}
      />
    </div>
  );
}
