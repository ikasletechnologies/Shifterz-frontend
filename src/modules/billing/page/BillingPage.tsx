"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  Plus, Eye, Pencil, Ban, Search, Receipt, ArrowRight, History, X,
  Printer, MoreHorizontal, Download,
  FileText, Wallet, Clock, AlertTriangle
} from "lucide-react";
import { createOutPass } from "@/lib/api";
import { toast } from "react-hot-toast";
import NewDocumentDialog from "../components/NewDocumentDialog";
import DocumentPreviewDialog from "../components/DocumentPreviewDialog";
import ConvertDocumentDialog from "../components/ConvertDocumentDialog";
import { CancelInvoiceDialog } from "../components/CancelInvoiceDialog";
import { ShareInvoiceMenu, downloadInvoicePdf } from "../components/ShareInvoiceMenu";
import RecordPaymentDialog from "@/modules/payment/components/RecordPaymentDialog";
import PaymentReceiptDialog from "@/modules/payment/components/PaymentReceiptDialog";
import PaymentHistoryDialog from "@/modules/payment/components/PaymentHistoryDialog";
import { useBilling } from "@/modules/billing/hooks/useBilling";
import { BillingDocument } from "@/modules/billing/types/billing.types";
import BillingJobCards from "../components/BillingJobCards";
import { useOpenOnQuery } from "@/lib/useOpenOnQuery";
import { StatusText } from "@/components/common/StatusText";

function CardMoreDropdown({
  doc,
  onViewHistory,
  onViewReceipt,
  onCancel,
  onConvert,
  onPrint,
  onDownload,
}: {
  doc: BillingDocument;
  onViewHistory: () => void;
  onViewReceipt: () => void;
  onCancel?: () => void;
  onConvert?: () => void;
  onPrint?: () => void;
  onDownload?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Rendered in a portal at a fixed position (like ShareInvoiceMenu) so the
  // scrolling document table doesn't clip it.
  const handleToggle = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
    setIsOpen((v) => !v);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(event.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    const handleScroll = () => setIsOpen(false);
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("scroll", handleScroll, true);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("scroll", handleScroll, true);
    };
  }, [isOpen]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className="p-1.5 text-xs font-bold text-gray-400 hover:text-gray-900 transition-colors flex items-center justify-center"
        title="More Actions"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {isOpen && createPortal(
        <div
          ref={menuRef}
          style={{ position: "fixed", top: menuPos.top, right: menuPos.right, zIndex: 9999 }}
          className="w-48 rounded-xl shadow-lg bg-white border border-gray-100 py-1 animate-in fade-in duration-150"
        >
          {onConvert && (
            <button
              onClick={() => { setIsOpen(false); onConvert(); }}
              className="w-full text-left px-3 py-2 text-xs font-medium hover:bg-blue-50 text-blue-600 flex items-center gap-2 transition-colors"
            >
              <ArrowRight className="w-3.5 h-3.5" /> Convert Document
            </button>
          )}
          {onPrint && (
            <button
              onClick={() => { setIsOpen(false); onPrint(); }}
              className="w-full text-left px-3 py-2 text-xs font-medium hover:bg-gray-50 text-gray-700 flex items-center gap-2 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
          )}
          {onDownload && (
            <button
              onClick={() => { setIsOpen(false); onDownload(); }}
              className="w-full text-left px-3 py-2 text-xs font-medium hover:bg-gray-50 text-gray-700 flex items-center gap-2 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Download PDF
            </button>
          )}
          {(doc.status === "Paid" || doc.status === "Partially Paid") && (
            <button
              onClick={() => { setIsOpen(false); onViewHistory(); }}
              className="w-full text-left px-3 py-2 text-xs font-medium hover:bg-purple-50 text-purple-700 flex items-center gap-2 transition-colors"
            >
              <History className="w-3.5 h-3.5" /> Payment History
            </button>
          )}
          {doc.status === "Paid" && (
            <button
              onClick={() => { setIsOpen(false); onViewReceipt(); }}
              className="w-full text-left px-3 py-2 text-xs font-medium hover:bg-blue-50 text-blue-700 flex items-center gap-2 transition-colors"
            >
              <Receipt className="w-3.5 h-3.5" /> View Payment Details
            </button>
          )}
          {onCancel && doc.status !== "Cancelled" && doc.status !== "Paid" && doc.status !== "Partially Paid" && (
            <button
              onClick={() => { setIsOpen(false); onCancel(); }}
              className="w-full text-left px-3 py-2 text-xs font-medium hover:bg-red-50 text-red-600 flex items-center gap-2 transition-colors"
            >
              <Ban className="w-3.5 h-3.5" /> Cancel Invoice
            </button>
          )}

        </div>,
        document.body
      )}
    </div>
  );
}

export function BillingPage() {
  const router = useRouter();
  const {
    documents,
    isLoading,
    error,
    outPasses,
    setOutPasses,
    hasOutPass,
    fetchInvoices,
    handleAddInvoice,
    handleEditInvoice,
    handleCancelDocument,
    handleShareDocument,
    handleConvertDocument,
    handleRecordPayment
  } = useBilling();

  const handleGenerateOutPass = async (doc: BillingDocument) => {
    try {
      const vehStr = doc.vehicle && doc.vehicle !== "-" ? doc.vehicle : "N/A";
      const newOutpass = await createOutPass({
        vehicle: vehStr,
        customer: doc.client || "Walk-in Customer",
        phone: doc.phone || "",
        service: doc.service || "General Service",
        invoiceId: doc.id,
        jobCardId: doc.jobId || doc.jobCardNo || undefined,
        customerConfirmation: true,
        outTime: new Date().toISOString()
      });
      setOutPasses((prev) => [...prev, newOutpass || { invoiceId: doc.id, vehicle: vehStr, status: "Pending" }]);
      toast.success(`Out pass generated for Invoice ${doc.id}`);
    } catch (err: any) {
      toast.error("Failed to generate out pass: " + (err.message || "Error"));
    }
  };

  const [activeSubTab, setActiveSubTab] = useState<"ready" | "documents">("ready");
  const [filter, setFilter] = useState("All");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<BillingDocument | null>(null);
  // Dashboard "New Invoice" quick action links here with ?new=1.
  useOpenOnQuery(() => { setActiveSubTab("documents"); setEditingDocument(null); setIsDialogOpen(true); });
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isConvertOpen, setIsConvertOpen] = useState(false);
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [isPaymentReceiptOpen, setIsPaymentReceiptOpen] = useState(false);
  const [isPaymentHistoryOpen, setIsPaymentHistoryOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<BillingDocument | null>(null);
  const [documentToConvert, setDocumentToConvert] = useState<BillingDocument | null>(null);
  const [documentToCancel, setDocumentToCancel] = useState<BillingDocument | null>(null);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [documentToMarkPaid, setDocumentToMarkPaid] = useState<BillingDocument | null>(null);
  const [selectedPaymentDocument, setSelectedPaymentDocument] = useState<BillingDocument | null>(null);
  const [documentForPaymentHistory, setDocumentForPaymentHistory] = useState<BillingDocument | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    fetchInvoices();
  }, [activeSubTab]);

  const getTodayISO = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.value;
    const today = getTodayISO();
    if (selected && selected > today) {
      toast.error("Future dates are not allowed. Please select today or a past date.");
      setStartDate(today);
      return;
    }
    setStartDate(selected);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.value;
    const today = getTodayISO();
    if (selected && selected > today) {
      toast.error("Future dates are not allowed. Please select today or a past date.");
      setEndDate(today);
      return;
    }
    setEndDate(selected);
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesFilter =
      filter === "All" ||
      (doc.type && doc.type.toLowerCase() === filter.toLowerCase());

    const q = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !q ||
      Boolean(
        (doc.client && doc.client.toLowerCase().includes(q)) ||
        (doc.vehicle && doc.vehicle.toLowerCase().includes(q)) ||
        (doc.id && doc.id.toLowerCase().includes(q)) ||
        (doc.phone && doc.phone.includes(q)) ||
        (doc.service && doc.service.toLowerCase().includes(q))
      );

    const matchesDate = (() => {
      if (!startDate && !endDate) return true;
      const dDate = doc.date ? new Date(doc.date) : null;
      if (!dDate || isNaN(dDate.getTime())) return true;

      if (startDate) {
        const start = new Date(startDate + "T00:00:00");
        if (dDate < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate + "T23:59:59.999");
        if (dDate > end) return false;
      }
      return true;
    })();

    return matchesFilter && matchesSearch && matchesDate;
  });

  const activeDocs = documents.filter((doc) => doc.status !== "Cancelled");

  const getDocVal = (doc: any) => {
    const amt = Number(doc.amount || 0);
    const gst = Number(doc.gst || 0);
    const disc = Number(doc.discount || 0);
    return amt + gst - disc;
  };

  const totalInvoiced = activeDocs.reduce((sum, doc) => sum + getDocVal(doc), 0);
  const collected = activeDocs
    .filter((doc) => doc.status === "Paid" || doc.status === "Completed")
    .reduce((sum, doc) => sum + (doc.paidAmount !== undefined ? Number(doc.paidAmount) : getDocVal(doc)), 0);
  const pending = activeDocs
    .filter((doc) => ["Pending", "Partially Paid", "Payment Pending", "Invoice Generated"].includes(doc.status))
    .reduce((sum, doc) => {
      const tot = getDocVal(doc);
      const paid = Number(doc.paidAmount || 0);
      return sum + Math.max(0, tot - paid);
    }, 0);
  const overdue = activeDocs
    .filter((doc) => doc.status === "Overdue")
    .reduce((sum, doc) => sum + getDocVal(doc), 0);

  const totalInvoicedCount = activeDocs.length;
  const collectedCount = activeDocs.filter((doc) => doc.status === "Paid" || doc.status === "Completed").length;
  const pendingCount = activeDocs.filter((doc) => ["Pending", "Partially Paid", "Payment Pending", "Invoice Generated"].includes(doc.status)).length;
  const overdueCount = activeDocs.filter((doc) => doc.status === "Overdue").length;


  const handleMarkAsPaid = (id: string) => {
    const doc = documents.find((d) => d.id === id);
    if (doc && doc.type === "Invoice" && doc.status !== "Paid" && doc.status !== "Cancelled") {
      setDocumentToMarkPaid(doc);
      setIsRecordPaymentOpen(true);
    }
  };


  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading invoices...</div>;

  return (
    <div className="p-8 space-y-6">
      {/* View Selector Tabs */}
      <div className="flex border-b border-gray-100 gap-6 mb-2">
        <button
          onClick={() => setActiveSubTab("ready")}
          className={`pb-3 text-sm font-bold border-b-2 transition-all relative ${
            activeSubTab === "ready"
              ? "border-amber-500 text-amber-600"
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          Ready for Billing
        </button>
        <button
          onClick={() => setActiveSubTab("documents")}
          className={`pb-3 text-sm font-bold border-b-2 transition-all relative ${
            activeSubTab === "documents"
              ? "border-amber-500 text-amber-600"
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          Invoices & Documents
        </button>
      </div>

      {activeSubTab === "ready" ? (
        <BillingJobCards onInvoiceGenerated={() => { fetchInvoices(); setActiveSubTab("documents"); }} />
      ) : (
        <>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              ⚠️ {error}
            </div>
          )}

          {/* Stats Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* TOTAL INVOICED */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">TOTAL INVOICED</p>
                <p className="text-2xl font-bold text-gray-900">₹{totalInvoiced.toLocaleString("en-IN")}</p>
                <p className="text-xs text-gray-400 font-medium mt-1">Across {totalInvoicedCount} Documents</p>
              </div>
              <div className="p-3 bg-purple-100 text-purple-600 rounded-2xl shrink-0">
                <FileText className="w-6 h-6" />
              </div>
            </div>

            {/* COLLECTED */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">COLLECTED</p>
                <p className="text-2xl font-bold text-gray-900">₹{collected.toLocaleString("en-IN")}</p>
                <p className="text-xs text-gray-400 font-medium mt-1">Across {collectedCount} Documents</p>
              </div>
              <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl shrink-0">
                <Wallet className="w-6 h-6" />
              </div>
            </div>

            {/* PENDING */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">PENDING</p>
                <p className="text-2xl font-bold text-gray-900">₹{pending.toLocaleString("en-IN")}</p>
                <p className="text-xs text-gray-400 font-medium mt-1">Across {pendingCount} Documents</p>
              </div>
              <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl shrink-0">
                <Clock className="w-6 h-6" />
              </div>
            </div>

            {/* OVERDUE */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">OVERDUE</p>
                <p className="text-2xl font-bold text-gray-900">₹{overdue.toLocaleString("en-IN")}</p>
                <p className="text-xs text-gray-400 font-medium mt-1">Across {overdueCount} Documents</p>
              </div>
              <div className="p-3 bg-red-100 text-red-600 rounded-2xl shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
            {/* Search Bar */}
            <div className="flex-1 relative min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by doc no., client, vehicle or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-9 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Type Filter Pills */}
            <div className="bg-gray-100 rounded-xl p-1 flex items-center gap-1 shrink-0">
              {["All", "Estimate", "Quotation", "Invoice"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`text-xs px-3.5 py-1.5 rounded-lg transition-all ${filter === tab
                    ? "bg-white text-gray-900 font-bold shadow-xs"
                    : "text-gray-600 hover:text-gray-900 font-medium"
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>

        {/* Date Inputs & New Document Action Button */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 shrink-0">
            <span className="text-xs font-semibold text-gray-500">From:</span>
            <input
              type="date"
              value={startDate}
              max={getTodayISO()}
              onChange={handleStartDateChange}
              className="bg-transparent border-none text-xs text-gray-700 focus:outline-none cursor-pointer p-0 font-medium"
            />
            <button
              type="button"
              disabled={!startDate}
              onClick={() => setStartDate("")}
              className={`p-0.5 rounded transition-colors flex items-center justify-center shrink-0 ${
                startDate
                  ? "text-gray-600 hover:text-gray-900 hover:bg-gray-100 cursor-pointer"
                  : "text-gray-300 cursor-not-allowed opacity-50"
              }`}
              title={startDate ? "Clear From Date" : ""}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 shrink-0">
            <span className="text-xs font-semibold text-gray-500">To:</span>
            <input
              type="date"
              value={endDate}
              max={getTodayISO()}
              onChange={handleEndDateChange}
              className="bg-transparent border-none text-xs text-gray-700 focus:outline-none cursor-pointer p-0 font-medium"
            />
            <button
              type="button"
              disabled={!endDate}
              onClick={() => setEndDate("")}
              className={`p-0.5 rounded transition-colors flex items-center justify-center shrink-0 ${
                endDate
                  ? "text-gray-600 hover:text-gray-900 hover:bg-gray-100 cursor-pointer"
                  : "text-gray-300 cursor-not-allowed opacity-50"
              }`}
              title={endDate ? "Clear To Date" : ""}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <button
            onClick={() => {
              setEditingDocument(null);
              setIsDialogOpen(true);
            }}
            className="bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-xs text-xs shrink-0 whitespace-nowrap"
          >
            <Plus className="w-4 h-4 stroke-3" />
            New Document
          </button>
        </div>
      </div>

          {/* Documents Table */}
          {filteredDocs.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-lg p-12 text-center text-slate-500">No documents found</div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
              <table className="data-table w-full min-w-[1400px] text-left">
                <thead>
                  <tr>
                    <th>Document No</th>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Vehicle Number</th>
                    <th>Customer Name</th>
                    <th>Phone</th>
                    <th>Service</th>
                    <th>Status</th>
                    <th className="text-right">Total</th>
                    <th className="text-right">Paid</th>
                    <th className="text-right">Pending</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocs.map((doc) => {
                    const totalAmount = (doc.amount || 0) + (doc.gst || 0) - (doc.discount || 0);
                    const rawPaidAmount = doc.paidAmount || 0;
                    const paidAmount = (rawPaidAmount === 0 && (doc.status === "Paid" || doc.status === "Completed"))
                      ? totalAmount
                      : rawPaidAmount;
                    const remainingAmount = Math.max(0, totalAmount - paidAmount);

                    const formattedDate = doc.date
                      ? (() => {
                        const d = new Date(doc.date);
                        return isNaN(d.getTime()) ? doc.date : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
                      })()
                      : "—";

                    const serviceLabel = doc.service && doc.service !== "—" && doc.service !== "-"
                      ? doc.service
                      : (doc.serviceCategory || (doc.items && doc.items.find((i: any) => i.desc && i.desc.trim())?.desc) || "General Service");

                    const awaitingConversion =
                      (doc.type === "Estimate" || doc.type === "Quotation") && doc.status !== "Converted" && doc.status !== "Cancelled";

                    return (
                      <tr key={doc.id}>
                        <td className="whitespace-nowrap">{doc.id}</td>
                        <td className="whitespace-nowrap">{doc.type}</td>
                        <td className="whitespace-nowrap">{formattedDate}</td>
                        <td className="whitespace-nowrap uppercase">{doc.vehicle || "—"}</td>
                        <td className="max-w-[180px] truncate">{doc.client || "—"}</td>
                        <td className="whitespace-nowrap">{doc.phone || "—"}</td>
                        <td className="max-w-[180px] truncate" title={serviceLabel}>{serviceLabel}</td>
                        <td className="whitespace-nowrap"><StatusText status={doc.status} /></td>
                        <td className="whitespace-nowrap text-right">₹{totalAmount.toLocaleString("en-IN")}</td>
                        <td className="whitespace-nowrap text-right">₹{paidAmount.toLocaleString("en-IN")}</td>
                        <td className="whitespace-nowrap text-right"><StatusText tone={remainingAmount > 0 ? "bad" : "neutral"}>₹{remainingAmount.toLocaleString("en-IN")}</StatusText></td>
                        <td className="whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            {(doc.status === "Paid" || doc.status === "Completed") && !hasOutPass(doc) && (
                              <button onClick={() => handleGenerateOutPass(doc)}>Generate Out Pass</button>
                            )}
                            {doc.type === "Invoice" && doc.status !== "Paid" && doc.status !== "Cancelled" && (
                              <button onClick={() => handleMarkAsPaid(doc.id)}>Add Payment</button>
                            )}
                            {awaitingConversion && (
                              <span className="text-xs text-slate-400" title="Convert to Invoice to accept payment">
                                Convert to invoice to accept payment
                              </span>
                            )}
                            <button
                              onClick={() => { setSelectedDocument(doc); setIsPreviewOpen(true); }}
                              className="p-1.5"
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {doc.status !== "Converted" && doc.status !== "Cancelled" && (
                              <button
                                onClick={() => {
                                  setEditingDocument(doc);
                                  setIsDialogOpen(true);
                                }}
                                className="p-1.5"
                                title="Edit"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                            )}
                            <ShareInvoiceMenu doc={doc} onLogShare={handleShareDocument} />
                            <CardMoreDropdown
                              doc={doc}
                              onViewHistory={() => { setDocumentForPaymentHistory(doc); setIsPaymentHistoryOpen(true); }}
                              onViewReceipt={() => { setSelectedPaymentDocument(doc); setIsPaymentReceiptOpen(true); }}
                              onCancel={() => { setDocumentToCancel(doc); setIsCancelOpen(true); }}
                              onConvert={(doc.type === "Estimate" || doc.type === "Quotation") && doc.status !== "Paid" && doc.status !== "Converted" ? () => { setDocumentToConvert(doc); setIsConvertOpen(true); } : undefined}
                              onPrint={() => { setSelectedDocument(doc); setIsPreviewOpen(true); }}
                              onDownload={() => downloadInvoicePdf(doc)}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Dialogs */}
      <NewDocumentDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingDocument(null);
        }}
        initialData={editingDocument}
        onSubmit={async (docData) => {
          let success = false;
          if (editingDocument) {
            success = await handleEditInvoice(editingDocument.id, docData);
          } else {
            success = await handleAddInvoice(docData);
          }
          if (success) {
            setIsDialogOpen(false);
            setEditingDocument(null);
          }
        }}
        existingDocuments={documents}
      />
      <DocumentPreviewDialog
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        document={selectedDocument ? {
          docNo: selectedDocument.id,
          type: selectedDocument.type,
          status: selectedDocument.status,
          client: selectedDocument.client,
          phone: selectedDocument.phone,
          vehicle: selectedDocument.vehicle,
          service: selectedDocument.service,
          base: (selectedDocument.amount || 0).toString(),
          gst: (selectedDocument.gst || 0).toString(),
          discount: (selectedDocument.discount || 0) > 0 ? `₹${(selectedDocument.discount || 0).toLocaleString("en-IN")}` : undefined,
          total: ((selectedDocument.amount || 0) + (selectedDocument.gst || 0) - (selectedDocument.discount || 0)).toString(),
          date: selectedDocument.date,
          due: selectedDocument.dueDate,
          gstNumber: selectedDocument.gstNumber,
          items: selectedDocument.items,
          bankDetails: selectedDocument.bankDetails,
          paymentTerms: selectedDocument.paymentTerms,
          deliveryTerms: selectedDocument.deliveryTerms,
          authorizedSignatory: selectedDocument.authorizedSignatory,
          warranty: selectedDocument.warranty
        } : undefined}
      />
      <ConvertDocumentDialog
        isOpen={isConvertOpen}
        onClose={() => {
          setIsConvertOpen(false);
          setDocumentToConvert(null);
        }}
        onSubmit={async (convertedData) => {
          if (documentToConvert) {
            const success = await handleConvertDocument(documentToConvert, convertedData);
            if (success) {
              setIsConvertOpen(false);
              setDocumentToConvert(null);
            }
          }
        }}
        document={documentToConvert || undefined}
      />
      <CancelInvoiceDialog
        isOpen={isCancelOpen}
        onClose={() => {
          setIsCancelOpen(false);
          setDocumentToCancel(null);
        }}
        document={documentToCancel}
        onConfirm={async (reason) => {
          if (documentToCancel) {
            const success = await handleCancelDocument(documentToCancel.id, reason);
            if (success) {
              setIsCancelOpen(false);
              setDocumentToCancel(null);
            }
          }
        }}
      />
      <RecordPaymentDialog
        isOpen={isRecordPaymentOpen}
        onClose={() => {
          setIsRecordPaymentOpen(false);
          setDocumentToMarkPaid(null);
        }}
        onSubmit={async (paymentData) => {
          if (documentToMarkPaid) {
            const success = await handleRecordPayment(documentToMarkPaid, paymentData);
            if (success) {
              setIsRecordPaymentOpen(false);
              setDocumentToMarkPaid(null);
            }
          }
        }}
        invoiceData={documentToMarkPaid || undefined}
      />
      <PaymentReceiptDialog
        isOpen={isPaymentReceiptOpen}
        onClose={() => {
          setIsPaymentReceiptOpen(false);
          setSelectedPaymentDocument(null);
        }}
        payment={selectedPaymentDocument ? {
          id: `PAY-${selectedPaymentDocument.id}`,
          invoiceRef: selectedPaymentDocument.id,
          client: selectedPaymentDocument.client,
          phone: selectedPaymentDocument.phone,
          vehicle: selectedPaymentDocument.vehicle,
          service: selectedPaymentDocument.service,
          amount: ((selectedPaymentDocument.amount || 0) + (selectedPaymentDocument.gst || 0) - (selectedPaymentDocument.discount || 0)).toString(),
          mode: "Paid",
          date: selectedPaymentDocument.date,
          reference: selectedPaymentDocument.id,
          notes: selectedPaymentDocument.notes
        } : undefined}
      />
      <PaymentHistoryDialog
        isOpen={isPaymentHistoryOpen}
        onClose={() => {
          setIsPaymentHistoryOpen(false);
          setDocumentForPaymentHistory(null);
        }}
        invoiceId={documentForPaymentHistory?.id}
        invoiceData={documentForPaymentHistory ? {
          id: documentForPaymentHistory.id,
          client: documentForPaymentHistory.client,
          amount: documentForPaymentHistory.amount || 0,
          gst: documentForPaymentHistory.gst || 0,
          discount: documentForPaymentHistory.discount || 0,
        } : undefined}
      />
    </div>
  );
}

export default BillingPage;
