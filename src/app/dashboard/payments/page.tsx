"use client";

import { toast } from "react-hot-toast";
import { useState, useEffect } from "react";
import {
  Plus, Eye, Printer, MessageCircle, RotateCcw, Search, X,
  Banknote, CreditCard, Smartphone,
} from "lucide-react";
import { SummaryCard } from "@/components/common/SummaryCard";
import PaymentReceiptDialog from "@/modules/payment/components/PaymentReceiptDialog";
import RecordPaymentDialog from "@/modules/payment/components/RecordPaymentDialog";
import PaymentHistoryDialog from "@/modules/payment/components/PaymentHistoryDialog";
import { getPayments, createPayment, getInvoices } from "@/lib/api";

interface Payment {
  id: string;
  invoiceId: string;
  client: string;
  phone?: string;
  vehicle?: string;
  model?: string;
  service?: string;
  date: string;
  time?: string;
  amount: number;
  mode: string;
  status: string;
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
  const itemsPerPage = 7;

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
      setCurrentPage(1);
      return;
    }
    setStartDate(selected);
    setCurrentPage(1);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.value;
    const today = getTodayISO();
    if (selected && selected > today) {
      toast.error("Future dates are not allowed. Please select today or a past date.");
      setEndDate(today);
      setCurrentPage(1);
      return;
    }
    setEndDate(selected);
    setCurrentPage(1);
  };

  useEffect(() => {
    async function fetchPayments() {
      try {
        setIsLoading(true);
        const [data, invoicesData] = await Promise.all([
          getPayments(),
          getInvoices().catch(() => [])
        ]);
        const invMap = new Map((invoicesData || []).map((i: any) => [i.id, i]));
        const enriched = (data || []).map((p: any) => {
          const inv: any = p.invoiceId ? invMap.get(p.invoiceId) : null;
          const veh = p.vehicle && p.vehicle !== "-" ? p.vehicle : inv?.vehicle && inv.vehicle !== "-" ? inv.vehicle : "";
          return {
            ...p,
            vehicle: veh,
            client: p.client && p.client !== "Walk-in Customer" ? p.client : inv?.client || p.client || "—",
            phone: p.phone || inv?.phone || "",
          };
        });
        setPayments(enriched);
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

  // Mode buckets used by both the summary cards and the mode filter.
  const modeOf = (p: any): "Cash" | "UPI" | "Card" | "Other" => {
    const m = (p.mode || "").toLowerCase();
    if (m.includes("cash")) return "Cash";
    if (m.includes("upi") || m.includes("online")) return "UPI";
    if (m.includes("card") || m.includes("pos")) return "Card";
    return "Other";
  };

  const basePayments = payments.filter((p) => {
    const matchesSearch =
      p.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.invoiceId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.client?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.vehicle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phone?.includes(searchTerm);

    const matchesReceivedBy = receivedByFilter === "All" || p.receivedBy?.toLowerCase() === receivedByFilter.toLowerCase();
    const matchesDate = (() => {
      let valid = true;
      if (p.date) {
        const pDate = new Date(p.date);
        if (!isNaN(pDate.getTime())) {
          if (startDate) {
            const start = new Date(startDate + "T00:00:00");
            if (pDate < start) valid = false;
          }
          if (endDate) {
            const end = new Date(endDate + "T23:59:59.999");
            if (pDate > end) valid = false;
          }
        }
      }
      return valid;
    })();

    return matchesSearch && matchesReceivedBy && matchesDate;
  });

  const filteredPayments = modeFilter === "All" ? basePayments : basePayments.filter((p) => modeOf(p) === modeFilter);

  // Calculate Summary KPI Stats
  const sumOf = (list: any[]) => list.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const totalCollected = sumOf(basePayments);
  const cashPayments = basePayments.filter((p) => modeOf(p) === "Cash");
  const cashTotal = sumOf(cashPayments);
  const upiPayments = basePayments.filter((p) => modeOf(p) === "UPI");
  const upiTotal = sumOf(upiPayments);
  const cardPayments = basePayments.filter((p) => modeOf(p) === "Card");
  const cardTotal = sumOf(cardPayments);
  const modeLabel: Record<string, string> = { All: "All modes", Cash: "Cash", UPI: "UPI / Online", Card: "Card / POS" };

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
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          ⚠️ {error}
        </div>
      )}

      {/* Summary — each card also filters the list by payment mode */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Total Received" value={`₹${totalCollected.toLocaleString("en-IN")}`} note={`${basePayments.length} payment${basePayments.length === 1 ? "" : "s"}`} active={modeFilter === "All"} onClick={() => { setModeFilter("All"); setCurrentPage(1); }} />
        <SummaryCard label="Cash" value={`₹${cashTotal.toLocaleString("en-IN")}`} note={`${cashPayments.length} payment${cashPayments.length === 1 ? "" : "s"}`} active={modeFilter === "Cash"} onClick={() => { setModeFilter("Cash"); setCurrentPage(1); }} />
        <SummaryCard label="UPI / Online" value={`₹${upiTotal.toLocaleString("en-IN")}`} note={`${upiPayments.length} payment${upiPayments.length === 1 ? "" : "s"}`} active={modeFilter === "UPI"} onClick={() => { setModeFilter("UPI"); setCurrentPage(1); }} />
        <SummaryCard label="Card / POS" value={`₹${cardTotal.toLocaleString("en-IN")}`} note={`${cardPayments.length} payment${cardPayments.length === 1 ? "" : "s"}`} active={modeFilter === "Card"} onClick={() => { setModeFilter("Card"); setCurrentPage(1); }} />
      </div>

      <div>
        <h2 className="text-sm font-bold text-slate-900">
          Payments <span className="font-normal text-slate-500">· {modeLabel[modeFilter]} ({filteredPayments.length})</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Every payment received against an invoice. Use the receipt to print or share it; refunds are recorded from here too.
        </p>
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
              onClick={() => { setStartDate(""); setCurrentPage(1); }}
              className={`p-0.5 rounded transition-colors flex items-center justify-center shrink-0 ${startDate
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
              onClick={() => { setEndDate(""); setCurrentPage(1); }}
              className={`p-0.5 rounded transition-colors flex items-center justify-center shrink-0 ${endDate
                ? "text-gray-600 hover:text-gray-900 hover:bg-gray-100 cursor-pointer"
                : "text-gray-300 cursor-not-allowed opacity-50"
                }`}
              title={endDate ? "Clear To Date" : ""}
            >
              <X className="w-3.5 h-3.5" />
            </button>
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
          <table className="data-table w-full text-left text-xs">
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
                    {searchTerm || modeFilter !== "All" || receivedByFilter !== "All"
                      ? "No payments match these filters."
                      : "No payments recorded yet. Payments appear here when you record one against an invoice."}
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
                      {p.vehicle && p.vehicle !== "—" ? (
                        <span className="font-mono text-sm font-bold text-slate-900 tracking-wider uppercase">
                          {p.vehicle}
                        </span>
                      ) : (
                        <span className="font-bold text-gray-400 font-mono">—</span>
                      )}
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
                              setSelectedPayment(p);
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
        invoiceData={selectedPayment ? {
          id: selectedPayment.invoiceId,
          client: selectedPayment.client,
          amount: selectedPayment.amount,
        } : undefined}
      />
    </div>
  );
}
