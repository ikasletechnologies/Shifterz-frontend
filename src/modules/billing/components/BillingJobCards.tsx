"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, X, FileText, CheckCircle2, AlertCircle, Printer, CreditCard } from "lucide-react";
import { getJobs, getInvoices, getPayments } from "@/lib/api";
import { useRouter } from "next/navigation";
import NewDocumentDialog from "./NewDocumentDialog";
import RecordPaymentDialog from "../../payment/components/RecordPaymentDialog";

export default function BillingJobCards() {
  const router = useRouter();
  const [jobs, setJobs] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Dialogs
  const [isNewDocOpen, setIsNewDocOpen] = useState(false);
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  
  const [selectedContext, setSelectedContext] = useState<any>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [jobsData, invoicesData] = await Promise.all([
        getJobs(),
        getInvoices()
      ]);
      setJobs(jobsData || []);
      setInvoices(invoicesData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Process data
  const mappedJobs = jobs
    .filter(j => ["QC Passed", "Ready For Billing", "Completed"].includes(j.status))
    .map(job => {
      // Find the most recent non-cancelled invoice for this vehicle
      const invs = invoices
        .filter(i => i.vehicle === job.vehicle && i.status !== "Cancelled")
        .sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());
      
      const inv = invs.length > 0 ? invs[0] : null;
      
      let billingStatus = "Waiting Billing";
      if (inv) {
        if (inv.status === "Paid") billingStatus = "Fully Paid";
        else if (inv.status === "Pending" || inv.status === "Overdue" || inv.status === "Partially Paid") billingStatus = "Payment Pending";
        else billingStatus = "Invoice Created";
      }

      return { ...job, invoice: inv, billingStatus };
    });

  // Filter
  const displayJobs = mappedJobs.filter(j => {
    const matchStatus = statusFilter === "All" || j.billingStatus === statusFilter;
    const searchLower = searchQuery.toLowerCase();
    const matchSearch = !searchQuery || 
      j.id.toLowerCase().includes(searchLower) ||
      j.vehicle.toLowerCase().includes(searchLower) ||
      j.customer.toLowerCase().includes(searchLower) ||
      (j.invoice?.id && j.invoice.id.toLowerCase().includes(searchLower));
    
    return matchStatus && matchSearch;
  });

  // KPIs
  const stats = {
    waiting: mappedJobs.filter(j => j.billingStatus === "Waiting Billing").length,
    created: mappedJobs.filter(j => j.billingStatus === "Invoice Created").length,
    pending: mappedJobs.filter(j => j.billingStatus === "Payment Pending").length,
    paid: mappedJobs.filter(j => j.billingStatus === "Fully Paid").length,
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading Billing Queue...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-gray-900">Ready For Billing</h1>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl border border-gray-100 border-l-4 border-l-gray-400 p-4 shadow-sm flex flex-col justify-between h-24">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Waiting Billing</span>
          <span className="text-2xl font-bold text-gray-900">{stats.waiting}</span>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 border-l-4 border-l-blue-500 p-4 shadow-sm flex flex-col justify-between h-24">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Invoice Created</span>
          <span className="text-2xl font-bold text-blue-600">{stats.created}</span>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 border-l-4 border-l-yellow-500 p-4 shadow-sm flex flex-col justify-between h-24">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Payment Pending</span>
          <span className="text-2xl font-bold text-amber-600">{stats.pending}</span>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 border-l-4 border-l-green-500 p-4 shadow-sm flex flex-col justify-between h-24">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Fully Paid</span>
          <span className="text-2xl font-bold text-emerald-600">{stats.paid}</span>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
        <div className="rounded-lg px-2 py-1.5 flex items-center gap-1 w-fit" style={{ backgroundColor: "#ebebebff" }}>
          {["All", "Waiting Billing", "Invoice Created", "Payment Pending", "Fully Paid"].map(level => (
            <button
              key={level}
              onClick={() => setStatusFilter(level)}
              className={`text-sm px-3 py-1 rounded-md transition-colors whitespace-nowrap ${statusFilter === level
                ? 'bg-white text-gray-900 font-bold shadow-sm'
                : 'text-gray-600 hover:text-gray-900 font-medium'
                }`}
            >
              {level}
            </button>
          ))}
        </div>
        <div className="relative w-full max-w-lg">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Job Card, Invoice No, Vehicle No, Customer Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-9 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {displayJobs.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-12 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">🎉 No vehicles are currently waiting for billing.</h3>
          <p className="text-gray-500">All completed jobs have been billed. Check back later when technicians finish more jobs.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[900px]">
              <thead className="bg-gray-50/50 border-b border-gray-100 text-[11px] text-gray-500 uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-4 py-4 whitespace-nowrap">Job Card</th>
                  <th className="px-4 py-4 whitespace-nowrap">Vehicle</th>
                  <th className="px-4 py-4 whitespace-nowrap">Customer</th>
                  <th className="px-4 py-4 whitespace-nowrap">Service</th>
                  <th className="px-4 py-4 whitespace-nowrap text-right">Bill Amount</th>
                  <th className="px-4 py-4 whitespace-nowrap">Invoice</th>
                  <th className="px-4 py-4 whitespace-nowrap">Payment</th>
                  <th className="px-4 py-4 text-right whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {displayJobs.map(j => {
                  const inv = j.invoice;
                  
                  // Compute Action Button
                  let actionBtn = null;
                  if (!inv) {
                    actionBtn = (
                      <button 
                        onClick={() => setIsNewDocOpen(true)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded shadow-sm flex items-center gap-1 transition-colors whitespace-nowrap"
                      >
                        <FileText className="w-3.5 h-3.5" /> Generate Invoice
                      </button>
                    );
                  } else if (j.billingStatus === "Payment Pending") {
                    actionBtn = (
                      <button 
                        onClick={() => {
                          setSelectedContext(inv);
                          setIsRecordPaymentOpen(true);
                        }}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded shadow-sm flex items-center gap-1 transition-colors whitespace-nowrap"
                      >
                        <CreditCard className="w-3.5 h-3.5" /> Record Payment
                      </button>
                    );
                  } else if (j.billingStatus === "Fully Paid") {
                    actionBtn = (
                      <button 
                        onClick={() => router.push('/dashboard/billing')}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 text-xs font-bold rounded shadow-sm flex items-center gap-1 transition-colors whitespace-nowrap"
                      >
                        <Printer className="w-3.5 h-3.5" /> Print Receipt
                      </button>
                    );
                  } else {
                    actionBtn = (
                      <button 
                        onClick={() => router.push('/dashboard/billing')}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 text-xs font-bold rounded shadow-sm flex items-center gap-1 transition-colors whitespace-nowrap"
                      >
                        <FileText className="w-3.5 h-3.5" /> View Invoice
                      </button>
                    );
                  }

                  return (
                    <tr key={j.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-4 font-mono text-xs font-bold whitespace-nowrap text-blue-600">{j.id}</td>
                      <td className="px-4 py-4 font-bold text-gray-900 whitespace-nowrap">{j.vehicle}</td>
                      <td className="px-4 py-4 text-gray-600 whitespace-nowrap">{j.customer}</td>
                      <td className="px-4 py-4 text-gray-600">{j.service}</td>
                      <td className="px-4 py-4 font-bold text-gray-900 text-right whitespace-nowrap">
                        {inv ? `₹${(inv.total || (inv.amount + (inv.gst || 0) - (inv.discount || 0))).toLocaleString("en-IN")}` : "—"}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {inv ? (
                          <span className="font-mono text-xs font-bold text-gray-600">{inv.id}</span>
                        ) : (
                          <span className="text-xs font-semibold text-gray-400">Not Generated</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          j.billingStatus === 'Fully Paid' ? 'bg-green-100 text-green-700' :
                          j.billingStatus === 'Payment Pending' ? 'bg-amber-100 text-amber-700' :
                          j.billingStatus === 'Invoice Created' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {inv ? inv.status : "Pending"}
                        </span>
                      </td>
                      <td className="px-4 py-4 flex justify-end">
                        {actionBtn}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <NewDocumentDialog 
        isOpen={isNewDocOpen}
        onClose={() => setIsNewDocOpen(false)}
        onSubmit={async () => {
          setIsNewDocOpen(false);
          await loadData();
        }}
        existingDocuments={invoices}
      />

      <RecordPaymentDialog
        isOpen={isRecordPaymentOpen}
        onClose={() => {
          setIsRecordPaymentOpen(false);
          setSelectedContext(null);
        }}
        onSubmit={async () => {
          setIsRecordPaymentOpen(false);
          await loadData();
        }}
        invoiceData={selectedContext || undefined}
      />
    </div>
  );
}
