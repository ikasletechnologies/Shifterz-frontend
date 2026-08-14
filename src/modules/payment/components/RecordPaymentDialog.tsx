"use client";

import { useState, useEffect } from "react";
import {
  X, CreditCard, User, Car, Upload, Clock
} from "lucide-react";
import { getInvoices, getPayments } from "@/lib/api";

interface RecordPaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (payment: any) => void;
  invoiceData?: {
    id: string;
    client: string;
    phone?: string;
    vehicle?: string;
    model?: string;
    jobCardNo?: string | null;
    amount: number;
    gst?: number;
    discount?: number;
    paidAmount?: number;
    date?: string;
  };
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const getLoggedInUser = () => {
  if (typeof window !== "undefined") {
    try {
      const u = localStorage.getItem("user");
      if (u) {
        const userObj = JSON.parse(u);
        return userObj.name || userObj.username || "Arun Kumar";
      }
    } catch (e) {
      // Ignore
    }
  }
  return "Arun Kumar";
};

export default function RecordPaymentDialog({
  isOpen,
  onClose,
  onSubmit,
  invoiceData,
}: RecordPaymentDialogProps) {
  const [formData, setFormData] = useState({
    client: "",
    phone: "",
    vehicle: "",
    model: "",
    jobCardNo: "",
    invoiceNo: "",
    totalAmount: "",
    amount: "",
    mode: "UPI",
    date: new Date().toISOString().split("T")[0],
    time: "11:23 AM",
    reference: "",
    receivedBy: getLoggedInUser(),
    notes: "",
  });

  const [existingPayments, setExistingPayments] = useState<any[]>([]);
  const [availableInvoices, setAvailableInvoices] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateClock = () => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', { hour12: true }));
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isOpen) {
      getInvoices()
        .then((invs) => setAvailableInvoices(invs || []))
        .catch(console.error);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && invoiceData) {
      const total = (invoiceData.amount || 0) + (invoiceData.gst || 0) - (invoiceData.discount || 0);
      const paid = invoiceData.paidAmount || 0;
      const remaining = Math.max(0, total - paid);

      setFormData({
        client: invoiceData.client || "",
        phone: invoiceData.phone || "",
        vehicle: invoiceData.vehicle || "",
        model: invoiceData.model || "",
        jobCardNo: invoiceData.jobCardNo || "",
        invoiceNo: invoiceData.id || "",
        totalAmount: total.toString(),
        amount: remaining > 0 ? remaining.toString() : "",
        mode: "UPI",
        date: invoiceData.date || new Date().toISOString().split("T")[0],
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
        reference: "",
        receivedBy: getLoggedInUser(),
        notes: "",
      });

      getPayments()
        .then((payments: any[]) => {
          setExistingPayments((payments || []).filter(p => p.invoiceId === invoiceData.id));
        })
        .catch(console.error);
    }
  }, [isOpen, invoiceData]);

  const handleInvoiceSelect = (invId: string) => {
    if (!invId) {
      setFormData((prev) => ({
        ...prev,
        invoiceNo: "",
        client: "",
        phone: "",
        vehicle: "",
        model: "",
        jobCardNo: "",
        totalAmount: "",
        amount: "",
      }));
      setExistingPayments([]);
      return;
    }

    const inv = availableInvoices.find((i) => i.id === invId);
    if (inv) {
      const total = (inv.amount || 0) + (inv.gst || 0) - (inv.discount || 0);
      const paid = inv.paidAmount || 0;
      const remaining = Math.max(0, total - paid);

      setFormData((prev) => ({
        ...prev,
        client: inv.client || "",
        phone: inv.phone || "",
        vehicle: inv.vehicle || "",
        model: inv.model || "",
        jobCardNo: inv.jobId || "",
        invoiceNo: inv.id,
        totalAmount: total.toString(),
        amount: remaining > 0 ? remaining.toString() : "",
      }));

      getPayments()
        .then((payments: any[]) => {
          setExistingPayments((payments || []).filter(p => p.invoiceId === inv.id));
        })
        .catch(console.error);
    }
  };

  const totalPaidBefore = existingPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const remainingBeforePayment = Math.max(0, (Number(formData.totalAmount) || 0) - totalPaidBefore);
  
  const paidNowNum = Number(formData.amount) || 0;
  const outstandingAfterPayment = Math.max(0, remainingBeforePayment - paidNowNum);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name === "amount") {
      const numValue = Number(value);
      if (numValue > remainingBeforePayment && remainingBeforePayment > 0) {
        setFormData((prev) => ({ ...prev, [name]: remainingBeforePayment.toString() }));
        return;
      }
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmount = Number(formData.amount);

    if (!formData.client.trim() || !finalAmount) {
      alert("Client name and payment amount are required");
      return;
    }

    if (onSubmit) {
      const newPayment = {
        invoiceId: formData.invoiceNo,
        client: formData.client,
        phone: formData.phone,
        vehicle: formData.vehicle,
        model: formData.model,
        amount: finalAmount,
        mode: formData.mode,
        date: formData.date,
        time: formData.time,
        ref: formData.reference,
        receivedBy: formData.receivedBy,
        notes: formData.notes,
      };
      onSubmit(newPayment);
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-50/95 rounded-2xl w-full max-w-[1100px] shadow-2xl border border-slate-200/80 max-h-[92vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Top Bar */}
        <div className="bg-white px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4 shrink-0">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Record Payment</h2>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">Home &gt; Payments &gt; Record Payment</p>
          </div>

          <div className="flex items-center gap-3">
            {currentTime && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-mono font-bold text-slate-700">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                {currentTime}
              </div>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Modal Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Section 1: Select Invoice & Info Cards */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
              SELECT INVOICE <span className="text-slate-400 font-normal lowercase">(customer &amp; vehicle info)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              {/* Invoice Dropdown */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  Invoice <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formData.invoiceNo}
                    onChange={(e) => handleInvoiceSelect(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold text-slate-900 bg-white"
                  >
                    <option value="">Select Invoice...</option>
                    {availableInvoices.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.id} — {inv.client} (₹{((inv.amount||0)+(inv.gst||0)-(inv.discount||0)).toLocaleString("en-IN")})
                      </option>
                    ))}
                  </select>
                </div>
                {formData.invoiceNo && (
                  <button
                    type="button"
                    onClick={() => alert(`Viewing Invoice ${formData.invoiceNo}`)}
                    className="text-xs font-bold text-blue-600 hover:underline mt-1.5 inline-block"
                  >
                    View Invoice
                  </button>
                )}
              </div>

              {/* Customer Info Card */}
              <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-3.5 flex items-center gap-3.5">
                <div className="p-3 bg-purple-100 text-purple-600 rounded-xl shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">CUSTOMER</p>
                  <p className="text-base font-extrabold text-slate-900 truncate">{formData.client || "—"}</p>
                  <p className="text-xs font-bold text-slate-500 font-mono mt-0.5">{formData.phone || "—"}</p>
                </div>
              </div>

              {/* Vehicle & Job Info Card */}
              <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-3.5 flex items-center gap-3.5">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-xl shrink-0">
                  <Car className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">VEHICLE</p>
                    <p className="text-[11px] font-extrabold text-slate-400 uppercase">JOB CARD NO.</p>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <p className="text-base font-extrabold text-slate-900 uppercase font-mono">{formData.vehicle || "—"}</p>
                    <p className="text-sm font-mono font-extrabold text-slate-800">{formData.jobCardNo || "—"}</p>
                  </div>
                  <p className="text-xs font-medium text-slate-600 truncate mt-0.5">{formData.model || "—"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Invoice Summary & Payment Summary (2 Cards Row) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Invoice Summary Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3.5">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2.5">Invoice Summary</h3>
              
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-500">Invoice Date</span>
                  <span className="font-bold text-slate-900">{formData.date ? formatDate(formData.date) : "—"}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-500">Invoice Amount</span>
                  <span className="font-bold font-mono text-base text-slate-900">₹{Number(formData.totalAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-500">Amount Already Paid</span>
                  <span className="font-bold font-mono text-base text-slate-900">₹{totalPaidBefore.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="flex justify-between items-center pt-2.5 border-t border-slate-100 font-bold text-base">
                  <span className="text-slate-800">Outstanding Balance</span>
                  <span className="font-mono text-red-600 font-black text-lg">₹{remainingBeforePayment.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* Payment Summary Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3.5">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2.5">Payment Summary</h3>
              
              <div className="space-y-3 text-sm">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                    Amount Paying Now <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    max={remainingBeforePayment > 0 ? remainingBeforePayment : undefined}
                    placeholder="Enter amount"
                    className="w-full px-3.5 py-2.5 text-base border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold text-slate-900"
                    required
                  />
                </div>

                <div className="pt-2.5 border-t border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 mb-1">Outstanding Balance (After this payment)</p>
                  <p className="text-2xl font-black font-mono text-emerald-600">
                    ₹{outstandingAfterPayment.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Section 3: Payment Details */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">Payment Details</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  Payment Mode <span className="text-red-500">*</span>
                </label>
                <select
                  name="mode"
                  value={formData.mode}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-semibold text-slate-800"
                >
                  <option value="UPI">UPI</option>
                  <option value="Cash">Cash</option>
                  <option value="Card / POS">Card / POS</option>
                  <option value="Net Banking">Net Banking</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  Reference No. / UTR No. <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="reference"
                  value={formData.reference}
                  onChange={handleChange}
                  placeholder="Enter UTR / Reference No."
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  Payment Date &amp; Time <span className="text-red-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    className="w-full pl-3 pr-2 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-900"
                    required
                  />
                  <input
                    type="text"
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    placeholder="11:23 AM"
                    className="w-28 px-2.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ml-1 font-mono text-slate-900"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  Received By <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="receivedBy"
                  value={formData.receivedBy}
                  readOnly
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 font-semibold text-slate-500 cursor-not-allowed outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">Notes (Optional)</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="e.g. Advance payment for service & parts"
                  rows={2}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-slate-900"
                />
              </div>
            </div>
          </div>

        </form>

        {/* Modal Sticky Footer Action Bar */}
        <div className="bg-white px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-6 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-xs"
          >
            <CreditCard className="w-4 h-4" /> Save Record Payment
          </button>
        </div>

      </div>
    </div>
  );
}
