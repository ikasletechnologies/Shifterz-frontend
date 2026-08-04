"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { PhoneInput } from "@/components/common/PhoneInput";
import { useState, useEffect } from "react";
import { X, CreditCard } from "lucide-react";

interface RecordPaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (payment: any) => void;
  invoiceData?: {
    id: string;
    client: string;
    phone?: string;
    amount: number;
    gst?: number;
    discount?: number;
    paidAmount?: number;
    date?: string;
  };
}

export default function RecordPaymentDialog({
  isOpen,
  onClose,
  onSubmit,
  invoiceData,
}: RecordPaymentDialogProps) {
  const [formData, setFormData] = useState({
    client: "",
    phone: "",
    invoiceNo: "",
    totalAmount: "",
    amount: "",
    mode: "UPI",
    date: new Date().toISOString().split("T")[0],
    reference: "",
    notes: "",
  });

  const [existingPayments, setExistingPayments] = useState<any[]>([]);
  const [isSplitMode, setIsSplitMode] = useState(false);
  const [splitModes, setSplitModes] = useState<Array<{ mode: string; amount: number }>>([
    { mode: "Cash", amount: 0 },
    { mode: "UPI", amount: 0 },
  ]);

  useEffect(() => {
    if (isOpen && invoiceData) {
      const total = (invoiceData.amount || 0) + (invoiceData.gst || 0) - (invoiceData.discount || 0);
      const paid = invoiceData.paidAmount || 0;
      const remaining = Math.max(0, total - paid);

      setFormData({
        client: invoiceData.client || "",
        phone: invoiceData.phone || "",
        invoiceNo: invoiceData.id || "",
        totalAmount: total.toString(),
        amount: remaining.toString(),
        mode: "UPI",
        date: invoiceData.date || new Date().toISOString().split("T")[0],
        reference: "",
        notes: "",
      });
      setIsSplitMode(false);
      setSplitModes([
        { mode: "Cash", amount: Math.floor(remaining / 2) },
        { mode: "UPI", amount: remaining - Math.floor(remaining / 2) },
      ]);

      import("@/lib/api").then(({ getPayments }) => {
        getPayments().then((payments: any[]) => {
          setExistingPayments(payments.filter(p => p.invoiceId === invoiceData.id));
        }).catch(err => console.error(err));
      });
    }
  }, [isOpen, invoiceData]);

  const totalPaidBefore = existingPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const remainingBeforePayment = (Number(formData.totalAmount) || 0) - totalPaidBefore;
  
  const calculateOutstanding = () => {
    const paidNow = isSplitMode
      ? splitModes.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
      : Number(formData.amount) || 0;
    return Math.max(0, remainingBeforePayment - paidNow);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    
    if (name === "amount") {
      const numValue = Number(value);
      const maxAmount = remainingBeforePayment;
      if (numValue > maxAmount) {
        setFormData((prev) => ({ ...prev, [name]: maxAmount.toString() }));
        return;
      }
    }
    
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSplitChange = (index: number, field: "mode" | "amount", value: any) => {
    setSplitModes(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: field === "amount" ? Number(value) : value };
      return copy;
    });
  };

  const handleAddSplit = () => {
    setSplitModes(prev => [...prev, { mode: "Card", amount: 0 }]);
  };

  const handleRemoveSplit = (index: number) => {
    setSplitModes(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmount = isSplitMode
      ? splitModes.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
      : Number(formData.amount);

    if (!formData.client.trim() || !finalAmount) {
      alert("Client name and amount are required");
      return;
    }

    if (onSubmit) {
      const newPayment = {
        invoiceId: formData.invoiceNo,
        client: formData.client,
        amount: finalAmount,
        mode: isSplitMode ? "Split" : formData.mode,
        multipleModes: isSplitMode ? splitModes : undefined,
        date: formData.date,
        ref: formData.reference,
        notes: formData.notes,
      };
      onSubmit(newPayment);
    }

    setFormData({
      client: "",
      phone: "",
      invoiceNo: "",
      totalAmount: "",
      amount: "",
      mode: "UPI",
      date: new Date().toISOString().split("T")[0],
      reference: "",
      notes: "",
    });
    setIsSplitMode(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-2xl p-3 sm:p-4 md:p-6 lg:p-8 w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg shadow-2xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-400 p-2 rounded-lg">
              <CreditCard className="w-6 h-6 text-gray-900" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Record Payment</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Invoice Info Header */}
        {invoiceData && (
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <p className="text-xs text-blue-600 font-bold uppercase mb-2">Fetched Invoice Data</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <p className="text-xs text-gray-500">Client</p>
                <p className="text-sm font-bold text-gray-900">{formData.client}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Phone</p>
                <p className="text-sm font-bold text-gray-900">{formData.phone || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Invoice ID</p>
                <p className="text-sm font-bold text-yellow-600">{formData.invoiceNo}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Amount Due</p>
                <p className="text-sm font-bold text-green-600">₹{Number(formData.amount).toLocaleString("en-IN")}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          {/* Row 1: Client Name & Invoice No (Read-only) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                Client Name
              </label>
              <input
                type="text"
                name="client"
                value={formData.client}
                onChange={handleChange}
                placeholder="Full name"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-gray-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                Invoice No.
              </label>
              <input
                type="text"
                name="invoiceNo"
                value={formData.invoiceNo}
                onChange={handleChange}
                placeholder="INV-XXXX"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-gray-900"
              />
            </div>
          </div>

          {/* Row 2: Phone & Total Amount (Read-only) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                Phone Number
              </label>
              <PhoneInput
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="XXXXX XXXXX"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                Total Invoice Amount (₹)
              </label>
              <input
                type="number"
                name="totalAmount"
                value={formData.totalAmount}
                readOnly
                placeholder="0"
                className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-default font-bold text-sm"
              />
            </div>
          </div>

          {/* Row 3: Paid Amount (Editable) & Outstanding (Read-only) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                Amount Paying Now (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                max={remainingBeforePayment}
                placeholder="0"
                className="w-full px-3 py-2 sm:py-2.5 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent bg-green-50 text-gray-900 font-bold text-sm"
              />
              <p className="text-xs text-green-600 mt-1">Remaining to pay: ₹{remainingBeforePayment.toLocaleString("en-IN")}</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                Outstanding Balance (₹)
              </label>
              <input
                type="text"
                value={`₹${calculateOutstanding().toLocaleString("en-IN")}`}
                className="w-full px-3 py-2 sm:py-2.5 border border-red-300 rounded-lg bg-red-50 text-red-700 cursor-default font-bold text-sm"
                readOnly
              />
              <p className="text-xs text-red-600 mt-1">Auto-calculated</p>
            </div>
          </div>

          {/* Row 4: Payment Mode & Date (Editable) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">
                  Payment Mode <span className="text-red-500">*</span>
                </label>
                <label className="flex items-center gap-1.5 text-xs text-blue-600 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSplitMode}
                    onChange={(e) => setIsSplitMode(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-400"
                  />
                  Split Modes
                </label>
              </div>

              {!isSplitMode ? (
                <select
                  name="mode"
                  value={formData.mode}
                  onChange={handleChange}
                  className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent bg-white text-gray-900 text-sm"
                >
                  <option>UPI</option>
                  <option>Cash</option>
                  <option>Debit Card</option>
                  <option>Credit Card</option>
                  <option>Bank Transfer</option>
                  <option>Cheque</option>
                </select>
              ) : (
                <div className="space-y-2 border border-blue-200 bg-blue-50/50 p-2.5 rounded-lg">
                  {splitModes.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <select
                        value={item.mode}
                        onChange={(e) => handleSplitChange(idx, "mode", e.target.value)}
                        className="w-1/2 px-2 py-1.5 text-xs border border-gray-300 rounded bg-white text-gray-900"
                      >
                        <option>Cash</option>
                        <option>UPI</option>
                        <option>Debit Card</option>
                        <option>Credit Card</option>
                        <option>Bank Transfer</option>
                        <option>Cheque</option>
                      </select>
                      <input
                        type="number"
                        value={item.amount}
                        onChange={(e) => handleSplitChange(idx, "amount", e.target.value)}
                        placeholder="Amount"
                        className="w-1/2 px-2 py-1.5 text-xs border border-gray-300 rounded bg-white text-gray-900"
                      />
                      {splitModes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSplit(idx)}
                          className="text-red-500 font-bold px-1"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddSplit}
                    className="text-xs text-blue-600 font-bold hover:underline"
                  >
                    + Add Payment Mode
                  </button>
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent bg-white text-gray-900 text-sm"
              />
            </div>
          </div>

          {/* Row 5: Reference No. (Editable) */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
              Reference No.
            </label>
            <input
              type="text"
              name="reference"
              value={formData.reference}
              onChange={handleChange}
              placeholder="UPI ref / cheque no. / UTR"
              className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent bg-white text-gray-900 text-sm"
            />
          </div>

          {/* Row 5: Notes */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Partial payment, advance, etc."
              rows={2}
              className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent bg-white resize-none text-gray-900 text-sm"
            />
          </div>

          {/* Existing Payments List */}
          {existingPayments.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4 mt-2">
              <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Previous Payments Split</p>
              <div className="space-y-2">
                {existingPayments.map((p, idx) => (
                  <div key={p.id || idx} className="flex justify-between items-center bg-white p-2 border border-gray-100 rounded text-xs sm:text-sm">
                    <div>
                      <span className="font-bold text-gray-800">{p.mode}</span>
                      <span className="text-gray-500 ml-2">{p.date}</span>
                    </div>
                    <span className="font-bold text-green-600">₹{(p.amount || 0).toLocaleString("en-IN")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payment Summary */}
          <div className="bg-linear-to-r from-blue-50 to-purple-50 rounded-lg p-3 sm:p-4 mt-4 sm:mt-6 border-2 border-blue-200">
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2 sm:mb-3">Payment Summary</p>

            <div className="space-y-2">
              {/* Total Amount */}
              <div className="flex justify-between items-center gap-2">
                <span className="text-xs sm:text-sm text-gray-600">Total Amount Due:</span>
                <span className="text-sm sm:text-lg font-bold text-gray-900 text-right">
                  ₹{Number(formData.totalAmount || 0).toLocaleString("en-IN")}
                </span>
              </div>

              {/* Divider */}
              <div className="border-t border-blue-200"></div>

              {/* Partial Amount */}
              <div className="flex justify-between items-center gap-2">
                <span className="text-xs sm:text-sm text-green-700 font-semibold">Amount Paying Now:</span>
                <span className="text-sm sm:text-lg font-black text-green-600 text-right">
                  ₹{Number(formData.amount || 0).toLocaleString("en-IN")}
                </span>
              </div>

              {/* Remaining Balance */}
              <div className="flex justify-between items-center pt-1 gap-2">
                <span className="text-xs sm:text-sm text-red-700 font-semibold">Remaining Balance:</span>
                <span className="text-sm sm:text-lg font-black text-red-600 text-right">
                  ₹{calculateOutstanding().toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-2 sm:py-3 rounded-lg transition-colors flex items-center justify-center gap-2 mt-4 sm:mt-6 text-sm sm:text-base"
          >
            ✓ Save Payment
          </button>
        </form>
      </div>
    </div>
  );
}
