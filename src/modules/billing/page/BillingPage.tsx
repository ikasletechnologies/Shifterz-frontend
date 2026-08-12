"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Eye, Pencil, Trash2, Ban, Search, Receipt, ArrowRight, History, X,
  Car, Phone, Printer, MoreHorizontal, Download,
  SlidersHorizontal, FileText, Wallet, Clock, AlertTriangle, CreditCard, Ticket
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
  onCancel: () => void;
  onConvert?: () => void;
  onPrint?: () => void;
  onDownload?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 text-xs font-bold text-gray-400 hover:text-gray-900 transition-colors flex items-center justify-center"
        title="More Actions"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 rounded-xl shadow-lg bg-white border border-gray-100 py-1 z-50 animate-in fade-in duration-150">
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
          {doc.status !== "Cancelled" && doc.status !== "Paid" && doc.status !== "Partially Paid" && (
            <button
              onClick={() => { setIsOpen(false); onCancel(); }}
              className="w-full text-left px-3 py-2 text-xs font-medium hover:bg-red-50 text-red-600 flex items-center gap-2 transition-colors"
            >
              <Ban className="w-3.5 h-3.5" /> Cancel Invoice
            </button>
          )}

        </div>
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
        customerConfirmation: true,
        outTime: new Date().toISOString()
      });
      setOutPasses((prev) => [...prev, newOutpass || { invoiceId: doc.id, vehicle: vehStr, status: "Pending" }]);
      toast.success(`Out pass generated for Invoice ${doc.id}`);
    } catch (err: any) {
      toast.error("Failed to generate out pass: " + (err.message || "Error"));
    }
  };

  const [filter, setFilter] = useState("All");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<BillingDocument | null>(null);
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

  const filteredDocs = documents.filter((doc) => {
    const matchesFilter = filter === "All" || doc.type === filter;
    const matchesSearch = doc.client?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.vehicle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.phone?.includes(searchTerm);
    const matchesDate = (!startDate || doc.date >= startDate) && (!endDate || doc.date <= endDate);
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
    .reduce((sum, doc) => sum + getDocVal(doc), 0);
  const pending = activeDocs
    .filter((doc) => ["Pending", "Partially Paid", "Payment Pending", "Invoice Generated"].includes(doc.status))
    .reduce((sum, doc) => sum + getDocVal(doc), 0);
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
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-gray-500">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 text-gray-700 font-medium"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-gray-500">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 text-gray-700 font-medium"
            />
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

      {/* Cards Grid (2 Columns on Desktop) */}
      {filteredDocs.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-12 flex flex-col items-center justify-center text-center shadow-xs">
          <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-4">
            <Receipt className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No documents found</h3>
          <p className="text-gray-500">Try adjusting your search or date filters, or create a new document.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
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

            return (
              <div
                key={doc.id}
                className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Card Top Bar: Doc ID, Type Badge, Vehicle Badge, and Action Buttons */}
                  <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-100 flex-wrap">
                    <div className="flex items-center gap-2 min-w-0 flex-wrap">
                      <div className={`p-2 rounded-xl shrink-0 ${doc.type === "Invoice" ? "bg-purple-100 text-purple-600" :
                        doc.type === "Quotation" ? "bg-blue-100 text-blue-600" :
                          "bg-emerald-100 text-emerald-600"
                        }`}>
                        <FileText className="w-4 h-4" />
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${doc.type === "Invoice" ? "bg-purple-50 text-purple-700" :
                        doc.type === "Quotation" ? "bg-blue-50 text-blue-700" :
                          "bg-emerald-50 text-emerald-700"
                        }`}>
                        {doc.type}
                      </span>
                      <h3 className="text-sm font-black text-gray-900 tracking-tight font-mono truncate">
                        {doc.id}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => { setSelectedDocument(doc); setIsPreviewOpen(true); }}
                        className="p-1.5 text-xs font-bold text-gray-400 hover:text-gray-900 transition-colors flex items-center justify-center"
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
                          className="p-1.5 text-xs font-bold text-gray-400 hover:text-gray-900 transition-colors flex items-center justify-center"
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
                  </div>

                  {/* 2-Column Aligned Details Grid (4 Left, 4 Right) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 lg:gap-16 text-sm px-2 pb-2">
                    {/* Left Column (4 Fields) */}
                    <div className="space-y-3">
                      <div className="grid grid-cols-[140px_20px_1fr] items-center">
                        <span className="font-semibold text-gray-600">Vehicle No</span>
                        <span className="text-gray-300 font-bold text-center">:</span>
                        <span className="font-bold text-slate-900 font-mono text-sm tracking-wider uppercase">
                          {doc.vehicle || "—"}
                        </span>
                      </div>

                      <div className="grid grid-cols-[140px_20px_1fr] items-center">
                        <span className="font-medium text-gray-500">Customer Name</span>
                        <span className="text-gray-300 font-bold text-center">:</span>
                        <span className="font-bold text-gray-900 whitespace-nowrap">{doc.client || "—"}</span>
                      </div>

                      <div className="grid grid-cols-[140px_20px_1fr] items-center">
                        <span className="font-medium text-gray-500">Service</span>
                        <span className="text-gray-300 font-bold text-center">:</span>
                        <span className="font-bold text-gray-900 whitespace-nowrap">
                          {doc.service && doc.service !== "—" && doc.service !== "-"
                            ? doc.service
                            : (doc.serviceCategory || (doc.items && doc.items.find((i: any) => i.desc && i.desc.trim())?.desc) || "General Service")}
                        </span>
                      </div>

                      <div className="grid grid-cols-[140px_20px_1fr] items-center">
                        <span className="font-medium text-gray-500">Phone</span>
                        <span className="text-gray-300 font-bold text-center">:</span>
                        <span className="font-bold text-blue-600 font-mono whitespace-nowrap">{doc.phone || "—"}</span>
                      </div>
                    </div>

                    {/* Right Column (4 Fields) */}
                    <div className="space-y-3">
                      <div className="grid grid-cols-[140px_20px_1fr] items-center">
                        <span className="font-medium text-gray-500">Date</span>
                        <span className="text-gray-300 font-bold text-center">:</span>
                        <span className="font-bold text-gray-900 whitespace-nowrap">{formattedDate}</span>
                      </div>

                      <div className="grid grid-cols-[140px_20px_1fr] items-center">
                        <span className="font-medium text-gray-500">Total Amount</span>
                        <span className="text-gray-300 font-bold text-center">:</span>
                        <span className="font-bold text-gray-900 whitespace-nowrap">₹{totalAmount.toLocaleString("en-IN")}</span>
                      </div>

                      <div className="grid grid-cols-[140px_20px_1fr] items-center">
                        <span className="font-medium text-gray-500">Paid Amount</span>
                        <span className="text-gray-300 font-bold text-center">:</span>
                        <span className="font-bold text-emerald-600 whitespace-nowrap">₹{paidAmount.toLocaleString("en-IN")}</span>
                      </div>

                      <div className="grid grid-cols-[140px_20px_1fr] items-center">
                        <span className="font-medium text-gray-500">Pending Amount</span>
                        <span className="text-gray-300 font-bold text-center">:</span>
                        <span className={`font-bold whitespace-nowrap ${remainingAmount > 0 ? "text-red-600" : "text-emerald-600"}`}>
                          ₹{remainingAmount.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Add Payment / Go to Out Pass Button (Footer) */}
                <div className="flex justify-between items-center gap-2 pt-4 border-t border-gray-50 mt-4">
                  {/* Estimate/Quotation: payment not allowed — show conversion hint */}
                  {(doc.type === "Estimate" || doc.type === "Quotation") && doc.status !== "Converted" && doc.status !== "Cancelled" && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                      <CreditCard className="w-3.5 h-3.5 shrink-0" />
                      <span>Convert to Invoice to accept payment</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 ml-auto">
                    {(doc.status === "Paid" || doc.status === "Completed") && !hasOutPass(doc) && (
                      <button
                        onClick={() => handleGenerateOutPass(doc)}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm flex items-center gap-2"
                      >
                        <Ticket className="w-4 h-4" />
                        Generate Out Pass
                      </button>
                    )}
                    {doc.type === "Invoice" && doc.status !== "Paid" && doc.status !== "Cancelled" && (
                      <button
                        onClick={() => handleMarkAsPaid(doc.id)}
                        className="px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-2"
                      >
                        <CreditCard className="w-4 h-4" />
                        Add Payment
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
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
