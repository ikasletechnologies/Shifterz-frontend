"use client";

import React, { useMemo, useState } from "react";
import {
  Receipt,
  User,
  Phone,
  Car,
  Calendar,
  Clock,
  Printer,
  Eye,
  MessageCircle,
  CreditCard,
  Banknote,
  Smartphone,
  Wallet,
  CheckCircle,
} from "lucide-react";

export interface Payment {
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

interface PaymentsTabsProps {
  payments: Payment[];
  onViewReceipt: (payment: Payment) => void;
  onPrintReceipt: (payment: Payment) => void;
  onShareWhatsApp: (payment: Payment) => void;
  renderModeBadge: (mode: string) => React.ReactNode;
  formatDate: (dateStr: string) => string;
}

export function PaymentsTabs({
  payments,
  onViewReceipt,
  onPrintReceipt,
  onShareWhatsApp,
  renderModeBadge,
  formatDate,
}: PaymentsTabsProps) {
  const [activeMode, setActiveMode] = useState<string>("All");

  const displayedPayments = useMemo(() => {
    if (activeMode === "All") return payments;
    return payments.filter((p) => p.mode?.toLowerCase() === activeMode.toLowerCase());
  }, [activeMode, payments]);

  const cashCount = useMemo(() => payments.filter((p) => p.mode?.toLowerCase() === "cash").length, [payments]);
  const upiCount = useMemo(() => payments.filter((p) => p.mode?.toLowerCase() === "upi").length, [payments]);
  const cardCount = useMemo(() => payments.filter((p) => p.mode?.toLowerCase() === "card").length, [payments]);

  if (payments.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 shadow-xs">
        <Receipt className="w-10 h-10 mx-auto text-slate-300 mb-3" />
        <p className="text-sm font-medium text-slate-700">No payments found</p>
        <p className="text-xs text-slate-400 mt-1">Payments recorded against customer invoices will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Category Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200/80 pb-3 flex-wrap">
        <button
          type="button"
          onClick={() => setActiveMode("All")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeMode === "All"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <span>All Payments</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">{payments.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMode("Cash")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeMode === "Cash"
              ? "bg-emerald-600 text-white shadow-xs"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <Banknote className="w-3.5 h-3.5" />
          <span>Cash</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">{cashCount}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMode("UPI")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeMode === "UPI"
              ? "bg-purple-600 text-white shadow-xs"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>UPI</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">{upiCount}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMode("Card")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeMode === "Card"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Card</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">{cardCount}</span>
        </button>
      </div>

      {/* Cards Grid */}
      {displayedPayments.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-500 text-sm">
          No payments match this payment method.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {displayedPayments.map((p) => {
            const vehicleNo = p.vehicle && p.vehicle !== "—" ? p.vehicle : "";

            return (
              <div
                key={p.id}
                className="bg-white rounded-xl border border-gray-200/90 shadow-xs hover:shadow-md hover:border-yellow-400 transition-all p-4 flex flex-col justify-between gap-3"
              >
                {/* Header: Receipt No + Mode Badge */}
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded">
                      {p.id}
                    </span>
                    {renderModeBadge(p.mode)}
                  </div>

                  {/* Amount & Invoice */}
                  <div className="bg-gray-50/70 p-3 rounded-xl border border-gray-100 space-y-1">
                    <div className="flex items-baseline justify-between">
                      <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Amount Paid</span>
                      <strong className="text-xl font-black text-gray-950 font-mono">
                        ₹{Number(p.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-200/60">
                      <span className="text-gray-500 text-[11px]">Invoice:</span>
                      <strong className="font-mono text-blue-600">{p.invoiceId || "—"}</strong>
                    </div>
                  </div>

                  {/* Customer Information */}
                  <div className="pt-2 border-t border-gray-100 space-y-1 text-xs">
                    <div className="flex items-center gap-1.5 text-gray-800 font-semibold truncate">
                      <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="truncate">{p.client || "—"}</span>
                    </div>
                    {p.phone && (
                      <div className="flex items-center gap-1.5 text-gray-500 font-mono">
                        <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>{p.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Vehicle Information */}
                  {vehicleNo && (
                    <div className="pt-2 border-t border-gray-100 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs uppercase tracking-wider text-gray-900 bg-slate-50 border border-slate-200/80 px-2 py-0.5 rounded">
                          {vehicleNo}
                        </span>
                        {p.model && (
                          <span className="text-xs text-gray-600 font-medium truncate" title={p.model}>
                            {p.model}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Date & Received By */}
                  <div className="pt-2 border-t border-gray-100 text-[11px] text-gray-500 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        Date:
                      </span>
                      <span className="font-medium text-gray-700">
                        {formatDate(p.date)} {p.time ? `• ${p.time}` : ""}
                      </span>
                    </div>

                    {p.receivedBy && (
                      <div className="flex items-center justify-between">
                        <span>Received By:</span>
                        <strong className="text-gray-800">{p.receivedBy}</strong>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="pt-2.5 border-t border-gray-100 flex items-center justify-between gap-1.5 mt-auto">
                  <button
                    type="button"
                    onClick={() => onViewReceipt(p)}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-gray-950 font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Receipt</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onPrintReceipt(p)}
                    className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg border border-gray-200 bg-white transition-colors cursor-pointer"
                    title="Print Receipt"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onShareWhatsApp(p)}
                    className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg border border-emerald-200 bg-emerald-50/50 transition-colors cursor-pointer"
                    title="Share via WhatsApp"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default PaymentsTabs;
