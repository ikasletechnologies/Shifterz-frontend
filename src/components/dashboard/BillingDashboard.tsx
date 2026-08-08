"use client";

import { useState, useEffect } from "react";
import {
  FileText, Wallet, Clock, Search, Plus, Printer, CreditCard, ChevronRight, CheckCircle2, AlertCircle
} from "lucide-react";
import { getInvoices, getPayments } from "@/lib/api";
import NewDocumentDialog from "@/modules/billing/components/NewDocumentDialog";
import RecordPaymentDialog from "@/modules/payment/components/RecordPaymentDialog";
import PaymentHistoryDialog from "@/modules/payment/components/PaymentHistoryDialog";
import { useRouter } from "next/navigation";

export default function BillingDashboard() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog states
  const [isNewDocOpen, setIsNewDocOpen] = useState(false);
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [isPrintReceiptOpen, setIsPrintReceiptOpen] = useState(false);
  
  // Selected contexts for actions
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const [invData, payData] = await Promise.all([
          getInvoices(),
          getPayments()
        ]);
        setInvoices(invData || []);
        setPayments(payData || []);
      } catch (err) {
        console.error("Failed to load operational data", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayInvoices = invoices.filter(i => i.date === todayStr);
  const todayPayments = payments.filter(p => p.date === todayStr);
  
  // KPIs
  const invoicesCreatedToday = todayInvoices.length;
  const paymentsCollectedToday = todayPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  
  const pendingInvoices = invoices.filter(i => i.status === "Pending" || i.status === "Partially Paid" || i.status === "Overdue");
  const pendingCollectionsCount = pendingInvoices.length;
  
  // Outstanding amount total
  const totalOutstanding = pendingInvoices.reduce((sum, doc) => {
    const total = doc.total || (doc.amount + (doc.gst || 0) - (doc.discount || 0));
    const paid = doc.paidAmount || 0;
    return sum + (total - paid);
  }, 0);

  // ── Recent Payments ──
  const recentPayments = [...payments].sort((a, b) => b.id.localeCompare(a.id)).slice(0, 5);

  // ── Outstanding Invoices ──
  const outstandingList = pendingInvoices.map(inv => {
    const total = inv.total || (inv.amount + (inv.gst || 0) - (inv.discount || 0));
    const paid = inv.paidAmount || 0;
    const outstanding = total - paid;
    
    // Days pending
    const invDate = new Date(inv.date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - invDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return { ...inv, outstanding, diffDays };
  }).sort((a, b) => b.outstanding - a.outstanding).slice(0, 5);

  // ── Today's Activity Timeline ──
  const activities = [
    ...todayInvoices.map(i => ({ type: 'Invoice Generated', time: i.createdAt || `${todayStr}T09:00:00Z`, ref: i.id, label: `Invoice ${i.id} generated` })),
    ...todayPayments.map(p => ({ type: 'Payment Received', time: p.createdAt || `${todayStr}T10:00:00Z`, ref: p.id, label: `₹${Number(p.amount).toLocaleString("en-IN")} received via ${p.mode}` }))
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 8);

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500 font-semibold">Loading Operational Dashboard...</div>;
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* LEFT COLUMN - MAIN WORKFLOW */}
      <div className="flex-1 space-y-6">
        
        {/* 1. Today's Billing */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" /> Today's Billing
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex flex-col justify-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Invoices Created</p>
              <p className="text-2xl font-black text-gray-900">{invoicesCreatedToday}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex flex-col justify-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Payments Collected</p>
              <p className="text-2xl font-black text-emerald-600">₹{paymentsCollectedToday.toLocaleString("en-IN")}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex flex-col justify-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Pending Collections</p>
              <p className="text-2xl font-black text-amber-600">{pendingCollectionsCount}</p>
            </div>
          </div>
        </section>

        {/* 2. Outstanding Payments */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-amber-500" /> Outstanding Payments
            </h2>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total: <span className="text-amber-600">₹{totalOutstanding.toLocaleString("en-IN")}</span></div>
          </div>
          <div className="bg-white border border-gray-100 shadow-sm rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-[11px]">
                  <th className="px-4 py-3 text-left font-bold uppercase tracking-wider">Customer</th>
                  <th className="px-4 py-3 text-left font-bold uppercase tracking-wider">Invoice</th>
                  <th className="px-4 py-3 text-right font-bold uppercase tracking-wider">Outstanding</th>
                  <th className="px-4 py-3 text-center font-bold uppercase tracking-wider">Days</th>
                  <th className="px-4 py-3 text-right font-bold uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {outstandingList.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-gray-400 text-xs font-medium">No outstanding payments</td></tr>
                ) : (
                  outstandingList.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-gray-900">{item.client}</td>
                      <td className="px-4 py-3 font-mono font-bold text-blue-600 text-xs">{item.id}</td>
                      <td className="px-4 py-3 font-bold text-red-600 text-right">₹{item.outstanding.toLocaleString("en-IN")}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.diffDays > 30 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                          {item.diffDays} Days
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button 
                          onClick={() => {
                            setSelectedInvoice(item);
                            setIsRecordPaymentOpen(true);
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded shadow-sm transition-colors whitespace-nowrap"
                        >
                          Receive Payment
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* 3. Recent Payments */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Recent Payments
            </h2>
          </div>
          <div className="bg-white border border-gray-100 shadow-sm rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-[11px]">
                  <th className="px-4 py-3 text-left font-bold uppercase tracking-wider">Receipt</th>
                  <th className="px-4 py-3 text-left font-bold uppercase tracking-wider">Customer</th>
                  <th className="px-4 py-3 text-right font-bold uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-center font-bold uppercase tracking-wider">Mode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentPayments.length === 0 ? (
                  <tr><td colSpan={4} className="p-8 text-center text-gray-400 text-xs font-medium">No recent payments</td></tr>
                ) : (
                  recentPayments.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setIsPrintReceiptOpen(true)}>
                      <td className="px-4 py-3 font-mono font-bold text-blue-600 text-xs">{item.id}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900">{item.client}</td>
                      <td className="px-4 py-3 font-bold text-emerald-600 text-right">₹{Number(item.amount).toLocaleString("en-IN")}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 uppercase">{item.mode}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* RIGHT COLUMN - QUICK ACTIONS & TIMELINE */}
      <div className="w-full lg:w-72 space-y-6">
        
        {/* Quick Actions */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button 
              onClick={() => setIsNewDocOpen(true)}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors"><Plus className="w-4 h-4" /></div>
                <span className="text-sm font-bold text-gray-800">New Invoice</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500" />
            </button>
            <button 
              onClick={() => setIsRecordPaymentOpen(true)}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors"><CreditCard className="w-4 h-4" /></div>
                <span className="text-sm font-bold text-gray-800">Record Payment</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-500" />
            </button>
            <button 
              onClick={() => setIsPrintReceiptOpen(true)}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors"><Printer className="w-4 h-4" /></div>
                <span className="text-sm font-bold text-gray-800">Print Receipt</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-purple-500" />
            </button>
            <button 
              onClick={() => router.push('/dashboard/billing')}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-gray-500 hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gray-100 text-gray-600 group-hover:bg-gray-600 group-hover:text-white transition-colors"><Search className="w-4 h-4" /></div>
                <span className="text-sm font-bold text-gray-800">Search Invoice</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500" />
            </button>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-5">Today's Activity</h3>
          
          <div className="space-y-5 relative">
            <div className="absolute left-2.5 top-2 bottom-2 w-px bg-gray-200"></div>
            
            {activities.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No activity yet</p>
            ) : (
              activities.map((act, i) => (
                <div key={i} className="relative flex items-start gap-4 z-10">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${act.type === 'Invoice Generated' ? 'bg-blue-100 text-blue-600 border border-blue-200' : 'bg-emerald-100 text-emerald-600 border border-emerald-200'}`}>
                    {act.type === 'Invoice Generated' ? <FileText className="w-2.5 h-2.5" /> : <CreditCard className="w-2.5 h-2.5" />}
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-[10px] font-bold text-gray-500">{new Date(act.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      <span className="text-xs font-bold text-gray-900">{act.type}</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-0.5 font-medium">{act.label}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
      </div>

      {/* Modals */}
      <NewDocumentDialog 
        isOpen={isNewDocOpen}
        onClose={() => setIsNewDocOpen(false)}
        onSubmit={async () => {
          setIsNewDocOpen(false);
          // reload logic
        }}
        existingDocuments={invoices}
      />

      <RecordPaymentDialog
        isOpen={isRecordPaymentOpen}
        onClose={() => {
          setIsRecordPaymentOpen(false);
          setSelectedInvoice(null);
        }}
        onSubmit={async () => {
          setIsRecordPaymentOpen(false);
          // reload logic
        }}
        invoiceData={selectedInvoice || undefined}
      />

      <PaymentHistoryDialog
        isOpen={isPrintReceiptOpen}
        onClose={() => setIsPrintReceiptOpen(false)}
      />
    </div>
  );
}
