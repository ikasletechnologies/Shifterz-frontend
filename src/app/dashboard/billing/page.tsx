"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from "react";
import { Plus, Eye, Check, Trash2, Search, Receipt, ArrowRight, History } from "lucide-react";
import NewDocumentDialog from "@/components/billing/NewDocumentDialog";
import DocumentPreviewDialog from "@/components/billing/DocumentPreviewDialog";
import ConvertDocumentDialog from "@/components/billing/ConvertDocumentDialog";
import RecordPaymentDialog from "@/components/payments/RecordPaymentDialog";
import PaymentReceiptDialog from "@/components/payments/PaymentReceiptDialog";
import PaymentHistoryDialog from "@/components/payments/PaymentHistoryDialog";
import { toast } from "react-hot-toast";
import { getInvoices, createInvoice, updateInvoice, deleteInvoice, createPayment } from "@/lib/api";

interface BillingDocument {
  id: string;
  type: string;
  client: string;
  phone: string;
  vehicle: string;
  service: string;
  amount: number;
  gst: number;
  discount: number;
  total: number;
  date: string;
  dueDate: string;
  status: string;
  notes: string;
  paidAmount?: number;
  gstNumber?: string;
  items?: any;
  bankDetails?: string;
  paymentTerms?: string;
  deliveryTerms?: string;
  authorizedSignatory?: string;
}

export default function BillingPage() {
  const [documents, setDocuments] = useState<BillingDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("All");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isConvertOpen, setIsConvertOpen] = useState(false);
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [isPaymentReceiptOpen, setIsPaymentReceiptOpen] = useState(false);
  const [isPaymentHistoryOpen, setIsPaymentHistoryOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<BillingDocument | null>(null);
  const [documentToConvert, setDocumentToConvert] = useState<BillingDocument | null>(null);
  const [documentToMarkPaid, setDocumentToMarkPaid] = useState<BillingDocument | null>(null);
  const [selectedPaymentDocument, setSelectedPaymentDocument] = useState<BillingDocument | null>(null);
  const [documentForPaymentHistory, setDocumentForPaymentHistory] = useState<BillingDocument | null>(null);

  const fetchInvoices = async () => {
    try {
      setIsLoading(true);
      const data = await getInvoices();
      setDocuments(data);
      setError("");
    } catch (err: any) {
      setError("Failed to load invoices: " + err.message);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

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
        return "bg-green-100 text-green-700";
      case "Pending":
        return "bg-yellow-100 text-yellow-700";
      case "Partially Paid":
        return "bg-orange-100 text-orange-700";
      case "Overdue":
        return "bg-red-100 text-red-700";
      case "Approved":
        return "bg-blue-100 text-blue-700";
      case "Converted":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (!confirm("Delete this document?")) return;
    try {
      await deleteInvoice(id);
      setDocuments(documents.filter((doc) => doc.id !== id));
    } catch (err: any) {
      alert("Failed to delete: " + err.message);
    }
  };

  const handleMarkAsPaid = (id: string) => {
    const doc = documents.find((d) => d.id === id);
    if (doc && doc.status !== "Paid") {
      setDocumentToMarkPaid(doc);
      setIsRecordPaymentOpen(true);
    }
  };

  const handleConvertDocument = async (convertedData: any) => {
    try {
      const docTypeMap: Record<string, string> = {
        Invoice: "INV",
        Quotation: "QT",
        Estimate: "EST",
      };
      const docTypePrefix = docTypeMap[convertedData.type] || "DOC";

      // Get the next sequential ID based on document type
      let maxId = 0;
      const relevantDocs = documents.filter((doc) => doc.id?.startsWith(docTypePrefix));
      relevantDocs.forEach((doc) => {
        const numStr = doc.id.replace(docTypePrefix, "");
        const num = parseInt(numStr, 10);
        if (!isNaN(num) && num > maxId) {
          maxId = num;
        }
      });
      const newDocId = `${docTypePrefix}${String(maxId + 1).padStart(3, "0")}`;

      const newDoc = {
        ...convertedData,
        id: newDocId,
        date: new Date().toISOString().split("T")[0],
      };

      // Add new converted document to database
      await createInvoice(newDoc);

      // Mark original as "Converted" instead of deleting
      const updatedOriginal = {
        ...documentToConvert,
        status: "Converted",
      };
      await updateInvoice(documentToConvert?.id || "", updatedOriginal);

      // Update UI immediately - add new doc and update old one
      setDocuments((prevDocs) => [
        ...prevDocs.map((doc) =>
          doc.id === documentToConvert?.id ? updatedOriginal : doc
        ),
        newDoc,
      ]);

      toast.success(`${documentToConvert?.type} converted to ${convertedData.type} (${newDocId})`);
      setIsConvertOpen(false);
      setDocumentToConvert(null);
    } catch (err: any) {
      toast.error("Failed to convert document: " + err.message);
      console.error(err);
    }
  };

  const handleRecordPayment = async (paymentData: any) => {
    try {
      if (!documentToMarkPaid) return;

      const invoiceId = documentToMarkPaid.id;
      const totalAmount = (documentToMarkPaid.amount || 0) + (documentToMarkPaid.gst || 0) - (documentToMarkPaid.discount || 0);
      const currentPaidAmount = documentToMarkPaid.paidAmount || 0;
      const newPaidAmount = currentPaidAmount + (paymentData.amount || 0);
      const isFullyPaid = newPaidAmount >= totalAmount;

      const paymentRecord = {
        invoiceId,
        client: documentToMarkPaid.client,
        phone: documentToMarkPaid.phone,
        vehicle: documentToMarkPaid.vehicle,
        service: documentToMarkPaid.service,
        amount: paymentData.amount || totalAmount,
        mode: paymentData.mode || "Cash",
        date: paymentData.date || new Date().toISOString().split("T")[0],
        ref: paymentData.reference || invoiceId,
        notes: paymentData.notes || "",
      };

      await createPayment(paymentRecord);

      const updatedStatus = isFullyPaid ? "Paid" : "Partially Paid";
      await updateInvoice(invoiceId, {
        ...documentToMarkPaid,
        status: updatedStatus,
        paidAmount: newPaidAmount
      });

      setDocuments(
        documents.map((d) =>
          d.id === invoiceId ? {
            ...d,
            status: updatedStatus,
            paidAmount: newPaidAmount
          } : d
        )
      );

      toast.success(`Payment recorded! Status: ${updatedStatus}`);
      setIsRecordPaymentOpen(false);
      setDocumentToMarkPaid(null);
    } catch (err: any) {
      toast.error("Failed to record payment: " + err.message);
    }
  };

  const handleAddInvoice = async (newDoc: any) => {
    try {
      const created = await createInvoice(newDoc);
      setDocuments([...documents, created]);
      setIsDialogOpen(false);
    } catch (err: any) {
      alert("Failed to create invoice: " + err.message);
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
          <div className="flex gap-2">
            {["All", "Estimate", "Quotation", "Invoice"].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${filter === tab
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
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
                    <td className="px-6 py-4 text-sm font-semibold text-green-600">
                      ₹{paidAmount.toLocaleString("en-IN")}
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
                        <button
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="p-1 hover:bg-red-100 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
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
        onSubmit={handleAddInvoice}
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
          authorizedSignatory: selectedDocument.authorizedSignatory
        } : undefined}
      />
      <ConvertDocumentDialog
        isOpen={isConvertOpen}
        onClose={() => {
          setIsConvertOpen(false);
          setDocumentToConvert(null);
        }}
        onSubmit={handleConvertDocument}
        document={documentToConvert || undefined}
      />
      <RecordPaymentDialog
        isOpen={isRecordPaymentOpen}
        onClose={() => {
          setIsRecordPaymentOpen(false);
          setDocumentToMarkPaid(null);
        }}
        onSubmit={handleRecordPayment}
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
