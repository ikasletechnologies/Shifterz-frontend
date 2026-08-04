"use client";

import { useState, useEffect } from "react";
import { Plus, Eye, Check, Trash2, Ban, Search, Receipt, ArrowRight, History, X } from "lucide-react";
import NewDocumentDialog from "../components/NewDocumentDialog";
import DocumentPreviewDialog from "../components/DocumentPreviewDialog";
import ConvertDocumentDialog from "../components/ConvertDocumentDialog";
import { CancelInvoiceDialog } from "../components/CancelInvoiceDialog";
import { ShareInvoiceMenu } from "../components/ShareInvoiceMenu";
import RecordPaymentDialog from "@/modules/payment/components/RecordPaymentDialog";
import PaymentReceiptDialog from "@/modules/payment/components/PaymentReceiptDialog";
import PaymentHistoryDialog from "@/modules/payment/components/PaymentHistoryDialog";
import { useBilling } from "@/modules/billing/hooks/useBilling";
import { BillingDocument } from "@/modules/billing/types/billing.types";

export function BillingPage() {
  const {
    documents,
    isLoading,
    error,
    handleAddInvoice,
    handleDeleteDocument,
    handleCancelDocument,
    handleShareDocument,
    handleConvertDocument,
    handleRecordPayment
  } = useBilling();

  const [userRole, setUserRole] = useState<string>("");

  useEffect(() => {
    try {
      const u = localStorage.getItem("user");
      if (u) setUserRole((JSON.parse(u).role || "").toUpperCase());
    } catch {
      // Ignore
    }
  }, []);

  const isBillingExecutive = userRole.includes("BILLING") || userRole.includes("ACCOUNTANT");

  const [filter, setFilter] = useState("All");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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
      doc.id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = (!startDate || doc.date >= startDate) && (!endDate || doc.date <= endDate);
    return matchesFilter && matchesSearch && matchesDate;
  });

  const totalInvoiced = documents.reduce((sum, doc) => sum + (doc.amount + doc.gst - doc.discount), 0);
  const collected = documents
    .filter((doc) => doc.status === "Paid")
    .reduce((sum, doc) => sum + (doc.amount + doc.gst - doc.discount), 0);
  const pending = documents
    .filter((doc) => doc.status === "Pending")
    .reduce((sum, doc) => sum + (doc.amount + doc.gst - doc.discount), 0);
  const overdue = documents
    .filter((doc) => doc.status === "Overdue")
    .reduce((sum, doc) => sum + (doc.amount + doc.gst - doc.discount), 0);

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Invoice":
        return "bg-purple-100 text-purple-700";
      case "Quotation":
        return "bg-blue-100 text-blue-700";
      case "Estimate":
        return "bg-orange-100 text-orange-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Paid":
      case "Completed":
        return "bg-green-100 text-green-700";
      case "Partially Paid":
        return "bg-amber-100 text-amber-700";
      case "Invoice Generated":
        return "bg-indigo-100 text-indigo-700";
      case "Approved":
        return "bg-blue-100 text-blue-700";
      case "Estimate":
      case "Quotation":
        return "bg-cyan-100 text-cyan-700";
      case "Cancelled":
        return "bg-red-100 text-red-700";
      case "Draft":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const handleMarkAsPaid = (id: string) => {
    const doc = documents.find((d) => d.id === id);
    if (doc && doc.status !== "Paid") {
      setDocumentToMarkPaid(doc);
      setIsRecordPaymentOpen(true);
    }
  };

  if (isLoading) return <div className="p-8">Loading invoices...</div>;

  return (
    <div className="p-8">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
          ⚠️ {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Total Invoiced</p>
          <p className="text-3xl font-bold text-gray-900">₹{totalInvoiced.toLocaleString("en-IN")}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Collected</p>
          <p className="text-3xl font-bold text-green-600">₹{collected.toLocaleString("en-IN")}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Pending</p>
          <p className="text-3xl font-bold text-yellow-600">₹{pending.toLocaleString("en-IN")}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Overdue</p>
          <p className="text-3xl font-bold text-red-600">₹{overdue.toLocaleString("en-IN")}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="rounded-lg px-2 py-1.5 flex items-center gap-1 w-fit" style={{ backgroundColor: "#ebebebff" }}>
            {["All", "Estimate", "Quotation", "Invoice"].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`text-sm px-3 py-1 rounded-md transition-colors ${filter === tab
                  ? "bg-white text-gray-900 font-bold shadow-sm"
                  : "text-gray-600 hover:text-gray-900 font-medium"
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsDialogOpen(true)}
            className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Document
          </button>
        </div>

        <div className="flex items-center gap-4 bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by client, vehicle or doc no..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-9 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
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
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/75">
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">Doc No.</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">Client</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">Total Amount</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">Paid Amount</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">Pending Amount</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredDocs.map((doc) => {
                const totalAmount = (doc.amount || 0) + (doc.gst || 0) - (doc.discount || 0);
                const paidAmount = doc.paidAmount || 0;
                const remainingAmount = Math.max(0, totalAmount - paidAmount);

                return (
                  <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-xs font-mono font-bold" style={{ color: "#F0B100" }}>{doc.id}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-flex px-2.5 py-1 rounded text-xs font-semibold ${getTypeColor(doc.type)}`}>
                        {doc.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="font-semibold text-gray-900">{doc.client}</div>
                      <div className="text-xs text-gray-500">{doc.phone}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      ₹{totalAmount.toLocaleString("en-IN")}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-green-600 min-w-[120px]">
                      <div>₹{paidAmount.toLocaleString("en-IN")}</div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${paidAmount >= totalAmount ? 'bg-green-500' : paidAmount > 0 ? 'bg-amber-400' : 'bg-transparent'}`}
                          style={{ width: `${Math.min(100, (totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0))}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold">
                      <span className={remainingAmount > 0 ? "text-red-600" : "text-green-600"}>
                        ₹{remainingAmount.toLocaleString("en-IN")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{doc.date}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-flex px-2.5 py-1 rounded text-xs font-semibold ${getStatusColor(doc.status)}`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedDocument(doc);
                            setIsPreviewOpen(true);
                          }}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                          title="View Invoice"
                        >
                          <Eye className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleMarkAsPaid(doc.id)}
                          className={`p-1 rounded transition-colors ${doc.status === "Paid"
                            ? "bg-green-100"
                            : "hover:bg-gray-200"
                            }`}
                          title={doc.status === "Paid" ? "Paid" : "Mark as Paid"}
                        >
                          <Check className={`w-4 h-4 ${doc.status === "Paid" ? "text-green-600" : "text-gray-600"}`} />
                        </button>
                        {(doc.status === "Paid" || doc.status === "Partially Paid") && (
                          <>
                            <button
                              onClick={() => {
                                setDocumentForPaymentHistory(doc);
                                setIsPaymentHistoryOpen(true);
                              }}
                              className="p-1 hover:bg-purple-100 rounded transition-colors"
                              title="View Payment History"
                            >
                              <History className="w-4 h-4 text-purple-600" />
                            </button>
                            {doc.status === "Paid" && (
                              <button
                                onClick={() => {
                                  setSelectedPaymentDocument(doc);
                                  setIsPaymentReceiptOpen(true);
                                }}
                                className="p-1 hover:bg-blue-100 rounded transition-colors"
                                title="View Payment Details"
                              >
                                <Receipt className="w-4 h-4 text-blue-600" />
                              </button>
                            )}
                          </>
                        )}
                        {(doc.type === "Estimate" || doc.type === "Quotation") && doc.status !== "Paid" && doc.status !== "Converted" && (
                          <button
                            onClick={() => {
                              setDocumentToConvert(doc);
                              setIsConvertOpen(true);
                            }}
                            className="p-1 hover:bg-blue-100 rounded transition-colors"
                            title={`Convert to ${doc.type === "Estimate" ? "Quotation" : "Invoice"}`}
                          >
                            <ArrowRight className="w-4 h-4 text-blue-600" />
                          </button>
                        )}
                        <ShareInvoiceMenu doc={doc} onLogShare={handleShareDocument} />
                        {doc.status !== "Cancelled" && (
                          <button
                            onClick={() => {
                              setDocumentToCancel(doc);
                              setIsCancelOpen(true);
                            }}
                            className="p-1 hover:bg-red-100 rounded transition-colors"
                            title="Cancel Invoice"
                          >
                            <Ban className="w-4 h-4 text-red-500" />
                          </button>
                        )}
                        {!isBillingExecutive && (
                          <button
                            onClick={async () => {
                              if (confirm("Delete this document? This permanently removes it and frees its number for reuse.")) {
                                await handleDeleteDocument(doc.id);
                              }
                            }}
                            className="p-1 hover:bg-red-100 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
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

      {/* Dialogs */}
      <NewDocumentDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSubmit={async (newDoc) => {
          const success = await handleAddInvoice(newDoc);
          if (success) setIsDialogOpen(false);
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
