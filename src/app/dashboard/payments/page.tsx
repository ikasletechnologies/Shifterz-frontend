"use client";

import { useState, useEffect } from "react";
import {
  Plus, Eye, Printer, MessageCircle, RotateCcw, Search, X,
  Wallet, Banknote, CreditCard, Smartphone, ChevronLeft, ChevronRight
} from "lucide-react";
import PaymentReceiptDialog from "@/modules/payment/components/PaymentReceiptDialog";
import RecordPaymentDialog from "@/modules/payment/components/RecordPaymentDialog";
import PaymentHistoryDialog from "@/modules/payment/components/PaymentHistoryDialog";
import { getPayments, createPayment } from "@/lib/api";

interface Payment {
  id: string;
  invoiceId: string;
  client: string;
  phone?: string;
  vehicle?: string;
  model?: string;
  service?: string;
  amount: number;
  mode: string;
  date: string;
  time?: string;
  receivedBy?: string;
  ref?: string;
  notes?: string;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>("");

  const [searchTerm, setSearchTerm] = useState("");
  const [modeFilter, setModeFilter] = useState("All");
  const [receivedByFilter, setReceivedByFilter] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    async function fetchPayments() {
      try {
        setIsLoading(true);
        const data = await getPayments();
        setPayments(data || []);
        setError("");
      } catch (err: any) {
        setError("Failed to load payments: " + err.message);
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPayments();
  }, []);

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      p.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.invoiceId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.client?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.vehicle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phone?.includes(searchTerm);

    const matchesMode = modeFilter === "All" || p.mode?.toLowerCase() === modeFilter.toLowerCase();
    const matchesReceivedBy = receivedByFilter === "All" || p.receivedBy?.toLowerCase() === receivedByFilter.toLowerCase();
    const matchesDate = (!startDate || p.date >= startDate) && (!endDate || p.date <= endDate);

    return matchesSearch && matchesMode && matchesReceivedBy && matchesDate;
  });

  // Calculate Summary KPI Stats
  const totalCollected = filteredPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const cashPayments = filteredPayments.filter(p => p.mode?.toLowerCase().includes("cash"));
  const cashTotal = cashPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const upiPayments = filteredPayments.filter(p => p.mode?.toLowerCase().includes("upi") || p.mode?.toLowerCase().includes("online"));
  const upiTotal = upiPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const cardPayments = filteredPayments.filter(p => p.mode?.toLowerCase().includes("card") || p.mode?.toLowerCase().includes("pos"));
  const cardTotal = cardPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  // Staff members list
  const staffList = Array.from(new Set(payments.map(p => p.receivedBy).filter(Boolean)));

  // Pagination logic
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage) || 1;
  const paginatedPayments = filteredPayments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleAddPayment = async (newPayment: any) => {
    try {
      const created = await createPayment(newPayment);
      setPayments([created, ...payments]);
      setIsRecordPaymentOpen(false);
    } catch (err: any) {
      alert("Failed to create payment: " + err.message);
    }
  };


  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const renderModeBadge = (mode: string) => {
    const m = (mode || "").toLowerCase();
    if (m.includes("cash")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
          <Banknote className="w-3.5 h-3.5 text-emerald-600" />
          Cash
        </span>
      );
    }
    if (m.includes("upi") || m.includes("online")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-100">
          <Smartphone className="w-3.5 h-3.5 text-purple-600" />
          UPI <span className="font-mono text-[10px] font-black italic text-purple-600">UPI❯</span>
        </span>
      );
    }
    if (m.includes("card") || m.includes("pos")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
          <CreditCard className="w-3.5 h-3.5 text-blue-600" />
          Card / POS
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
        {mode}
      </span>
    );
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading payments...</div>;

  return (
    <div className="p-8 space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          ⚠️ {error}
        </div>
      )}

      {/* Top 4 Summary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Received */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total Received</p>
            <p className="text-2xl font-bold text-gray-900">₹{totalCollected.toLocaleString("en-IN")}</p>
            <p className="text-xs text-gray-400 font-medium mt-1">Today's Collection</p>
          </div>
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl shrink-0">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        {/* Cash */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Cash</p>
            <p className="text-2xl font-bold text-gray-900">₹{cashTotal.toLocaleString("en-IN")}</p>
            <p className="text-xs text-gray-400 font-medium mt-1">Transactions: {cashPayments.length}</p>
          </div>
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl shrink-0">
            <Banknote className="w-6 h-6" />
          </div>
        </div>

        {/* UPI / Online */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">UPI / Online</p>
            <p className="text-2xl font-bold text-gray-900">₹{upiTotal.toLocaleString("en-IN")}</p>
            <p className="text-xs text-gray-400 font-medium mt-1">Transactions: {upiPayments.length}</p>
          </div>
          <div className="p-3 bg-purple-100 text-purple-600 rounded-2xl shrink-0">
            <Smartphone className="w-6 h-6" />
          </div>
        </div>

        {/* Card / POS */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Card / POS</p>
            <p className="text-2xl font-bold text-gray-900">₹{cardTotal.toLocaleString("en-IN")}</p>
            <p className="text-xs text-gray-400 font-medium mt-1">Transactions: {cardPayments.length}</p>
          </div>
          <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Bar (Single Horizontal Card Container) */}
      <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
        {/* Search Bar */}
        <div className="flex-1 relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by receipt no., invoice no., customer, vehicle..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-9 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
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

        {/* Mode Filter Dropdown */}
        <select
          value={modeFilter}
          onChange={(e) => { setModeFilter(e.target.value); setCurrentPage(1); }}
          className="px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-semibold text-gray-700 shrink-0"
        >
          <option value="All">All Modes</option>
          <option value="Cash">Cash</option>
          <option value="UPI">UPI / Online</option>
          <option value="Card">Card / POS</option>
        </select>

        {/* Staff Filter Dropdown */}
        <select
          value={receivedByFilter}
          onChange={(e) => { setReceivedByFilter(e.target.value); setCurrentPage(1); }}
          className="px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-semibold text-gray-700 shrink-0"
        >
          <option value="All">All Received By</option>
          {staffList.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {/* Date Inputs */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-gray-500">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
              className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 font-medium"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-gray-500">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
              className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 font-medium"
            />
          </div>

          {/* Record Payment Primary Button */}
          <button
            onClick={() => setIsRecordPaymentOpen(true)}
            className="bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-xs text-xs shrink-0 whitespace-nowrap"
          >
            <Plus className="w-4 h-4 stroke-3" />
            Record Payment
          </button>
        </div>
      </div>

      {/* Payments Data Table */}
      <div className="bg-white rounded-2xl border border-gray-200/90 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Receipt No.</th>
                <th className="py-3.5 px-4">Invoice No.</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Vehicle</th>
                <th className="py-3.5 px-4 text-right">Amount (₹)</th>
                <th className="py-3.5 px-4">Payment Mode</th>
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4">Received By</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-gray-900">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400">
                    No payment records found.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                    {/* Receipt No */}
                    <td className="py-3.5 px-4 font-mono font-bold text-gray-900 whitespace-nowrap">
                      {p.id}
                    </td>

                    {/* Invoice No */}
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600 hover:underline cursor-pointer whitespace-nowrap">
                      {p.invoiceId || "—"}
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-4 min-w-[140px]">
                      <p className="font-bold text-gray-900 truncate">{p.client || "—"}</p>
                      {p.phone && <p className="text-[11px] text-gray-400 font-mono mt-0.5">{p.phone}</p>}
                    </td>

                    {/* Vehicle */}
                    <td className="py-3.5 px-4 min-w-[150px]">
                      <p className="font-bold text-gray-900 uppercase font-mono">{p.vehicle || "—"}</p>
                      {p.model && <p className="text-[11px] text-gray-500 truncate mt-0.5">{p.model}</p>}
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 text-right font-black font-mono text-sm text-gray-900 whitespace-nowrap">
                      ₹{Number(p.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>

                    {/* Payment Mode */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {renderModeBadge(p.mode)}
                    </td>

                    {/* Date & Time */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <p className="font-bold text-gray-900">{formatDate(p.date)}</p>
                      <p className="text-[11px] text-gray-400 font-medium mt-0.5">{p.time || "10:35 AM"}</p>
                    </td>

                    {/* Received By */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-bold text-gray-700">
                      {p.receivedBy || "Arun Kumar"}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* View Receipt */}
                        <button
                          onClick={() => { setSelectedPayment(p); setIsReceiptOpen(true); }}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 border border-gray-200 transition-colors bg-white shadow-2xs"
                          title="View Receipt"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Print Receipt */}
                        <button
                          onClick={() => { setSelectedPayment(p); setIsReceiptOpen(true); }}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 border border-gray-200 transition-colors bg-white shadow-2xs"
                          title="Print Receipt"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        {/* WhatsApp Share */}
                        <button
                          onClick={() => {
                            const phone = (p.phone || "").replace(/\D/g, "");
                            const msg = `Payment Receipt ${p.id} received for Invoice ${p.invoiceId} — Amount ₹${p.amount.toLocaleString("en-IN")} via ${p.mode}. Thank you!`;
                            window.open(`https://wa.me/${phone ? `91${phone}` : ""}?text=${encodeURIComponent(msg)}`, "_blank");
                          }}
                          className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 border border-emerald-100 transition-colors bg-emerald-50/50 shadow-2xs"
                          title="Share via WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>

                        {/* Payment History / Undo */}
                        <button
                          onClick={() => {
                            if (p.invoiceId) {
                              setSelectedInvoiceId(p.invoiceId);
                              setIsHistoryOpen(true);
                            }
                          }}
                          className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 border border-amber-100 transition-colors bg-amber-50/50 shadow-2xs"
                          title="Payment History"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>


                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialogs */}
      <RecordPaymentDialog
        isOpen={isRecordPaymentOpen}
        onClose={() => setIsRecordPaymentOpen(false)}
        onSubmit={handleAddPayment}
      />

      <PaymentReceiptDialog
        isOpen={isReceiptOpen}
        onClose={() => {
          setIsReceiptOpen(false);
          setSelectedPayment(null);
        }}
        payment={selectedPayment ? {
          id: selectedPayment.id,
          invoiceRef: selectedPayment.invoiceId,
          client: selectedPayment.client,
          phone: selectedPayment.phone,
          vehicle: selectedPayment.vehicle,
          service: selectedPayment.service,
          amount: selectedPayment.amount.toString(),
          mode: selectedPayment.mode,
          date: selectedPayment.date,
          reference: selectedPayment.ref || "",
          notes: selectedPayment.notes || ""
        } : undefined}
      />

      <PaymentHistoryDialog
        isOpen={isHistoryOpen}
        onClose={() => {
          setIsHistoryOpen(false);
          setSelectedInvoiceId("");
        }}
        invoiceId={selectedInvoiceId}
      />
    </div>
  );
}
