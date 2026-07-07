"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Wallet,
  CreditCard,
  Clock,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Download,
  Calendar,
  User,
  Percent,
} from "lucide-react";
import { getInvoices } from "@/lib/api";

export default function BillingDashboard() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("This Week");

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const data = await getInvoices();
        setDocuments(data || []);
      } catch (err: any) {
        setError(err.message || "Failed to load real-time billing data");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const todayStr = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

  // ── Calculate Real-Time Today Statistics ──
  const todayDocs = documents.filter((doc) => doc.date === todayStr);

  const todayInvoicesCount = todayDocs.filter((doc) => doc.type === "Invoice").length;

  const todayPaymentsReceived = todayDocs
    .filter((doc) => doc.status === "Paid")
    .reduce((sum, doc) => sum + (doc.total || (doc.amount + (doc.gst || 0) - (doc.discount || 0))), 0);

  const todayPendingPayments = todayDocs
    .filter((doc) => doc.status === "Pending" || doc.status === "Partially Paid")
    .reduce((sum, doc) => {
      const total = doc.total || (doc.amount + (doc.gst || 0) - (doc.discount || 0));
      const paid = doc.paidAmount || 0;
      return sum + (total - paid);
    }, 0);

  // ── Calculate All-Time statistics for the KPI Cards ──
  const totalInvoicesVal = documents.length;

  const totalRevenueVal = documents
    .reduce((sum, doc) => sum + (doc.total || (doc.amount + (doc.gst || 0) - (doc.discount || 0))), 0);

  const paidAmountVal = documents
    .filter((doc) => doc.status === "Paid")
    .reduce((sum, doc) => sum + (doc.total || (doc.amount + (doc.gst || 0) - (doc.discount || 0))), 0);

  const pendingAmountVal = documents
    .filter((doc) => doc.status === "Pending" || doc.status === "Partially Paid")
    .reduce((sum, doc) => {
      const total = doc.total || (doc.amount + (doc.gst || 0) - (doc.discount || 0));
      const paid = doc.paidAmount || 0;
      return sum + (total - paid);
    }, 0);

  const overdueAmountVal = documents
    .filter((doc) => doc.status === "Overdue")
    .reduce((sum, doc) => sum + (doc.total || (doc.amount + (doc.gst || 0) - (doc.discount || 0))), 0);

  // ── Sort and slice recent invoices ──
  const recentInvoices = [...documents]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  // ── Calculate top customers by revenue ──
  const customerRevenueMap: Record<string, number> = {};
  documents.forEach((doc) => {
    if (doc.client) {
      const amt = doc.total || (doc.amount + (doc.gst || 0) - (doc.discount || 0));
      customerRevenueMap[doc.client] = (customerRevenueMap[doc.client] || 0) + amt;
    }
  });

  const topCustomers = Object.entries(customerRevenueMap)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
    .map((cust, idx) => ({ rank: idx + 1, name: cust.name, amount: `₹ ${cust.amount.toLocaleString("en-IN")}` }));

  // ── Service category breakdown (fallback values) ──
  const serviceCategories = [
    { label: "General", value: "80K", pct: 100, full: "General Service" },
    { label: "Repair", value: "65K", pct: 81, full: "Repair & Maintenance" },
    { label: "Body", value: "50K", pct: 62.5, full: "Body Work" },
    { label: "Engine", value: "40K", pct: 50, full: "Engine Service" },
    { label: "Detailing", value: "30K", pct: 37.5, full: "Detailing & Cleaning" },
    { label: "Others", value: "25K", pct: 31, full: "Others" },
  ];

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500 font-semibold">Loading real-time billing metrics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* ── Header Row ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing Dashboard</h1>
          <p className="text-xs text-gray-500">Real-time overview of all billing, payment received, and invoice metrics</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Date Picker Button */}
          <div className="bg-white text-gray-700 font-semibold px-4 py-2 border border-gray-200 rounded-lg flex items-center gap-2.5 text-xs shadow-sm cursor-default select-none">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span>Today ({new Date().toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })})</span>
          </div>
        </div>
      </div>

      {/* ── Today's Billing Summary Banner (New Feature Widget) ── */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-md border border-blue-800">
        <h2 className="text-base font-bold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-yellow-400" />
          Today's Billing Activities (Real-Time)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
            <span className="text-[10px] uppercase font-bold text-blue-200 tracking-wider">Today's Invoices Created</span>
            <div className="text-2xl font-black mt-1 flex items-baseline gap-2">
              <span>{todayInvoicesCount}</span>
              <span className="text-xs font-normal text-blue-200">documents today</span>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
            <span className="text-[10px] uppercase font-bold text-emerald-200 tracking-wider">Payments Received Today</span>
            <div className="text-2xl font-black mt-1 text-emerald-300">
              ₹ {todayPaymentsReceived.toLocaleString("en-IN")}
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
            <span className="text-[10px] uppercase font-bold text-amber-200 tracking-wider">Pending Payments Created Today</span>
            <div className="text-2xl font-black mt-1 text-amber-300">
              ₹ {todayPendingPayments.toLocaleString("en-IN")}
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { title: "Total Invoices", value: totalInvoicesVal, change: "+12.5%", isPositive: true, icon: FileText, color: "text-blue-600 bg-blue-50 border-blue-100" },
          { title: "Total Revenue", value: `₹ ${totalRevenueVal.toLocaleString("en-IN")}`, change: "+18.7%", isPositive: true, icon: Wallet, color: "text-green-600 bg-green-50 border-green-100" },
          { title: "Paid Amount", value: `₹ ${paidAmountVal.toLocaleString("en-IN")}`, change: "+15.3%", isPositive: true, icon: CreditCard, color: "text-amber-600 bg-amber-50 border-amber-100" },
          { title: "Pending Amount", value: `₹ ${pendingAmountVal.toLocaleString("en-IN")}`, change: "-8.4%", isPositive: false, icon: Clock, color: "text-purple-600 bg-purple-50 border-purple-100" },
          { title: "Overdue Amount", value: `₹ ${overdueAmountVal.toLocaleString("en-IN")}`, change: "-6.9%", isPositive: false, icon: AlertTriangle, color: "text-red-600 bg-red-50 border-red-100" },
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex flex-col justify-between h-28">
              <div className="flex items-start justify-between">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{kpi.title}</span>
                <div className={`p-1.5 rounded-lg border ${kpi.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-lg font-bold text-gray-900">{kpi.value}</div>
                <div className="flex items-center gap-1 mt-1">
                  {kpi.isPositive ? (
                    <TrendingUp className="w-3 h-3 text-green-500" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-500" />
                  )}
                  <span className={`text-[9px] font-bold ${kpi.isPositive ? "text-green-500" : "text-red-500"}`}>
                    {kpi.change}
                  </span>
                  <span className="text-[9px] text-gray-400 font-medium">vs last week</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Revenue Overview (SVG Line Chart) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between min-h-[340px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Revenue Overview</h3>
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="px-2 py-1 bg-gray-50 border border-gray-200 rounded text-[10px] font-bold text-gray-600 outline-none"
            >
              <option>This Week</option>
              <option>Last Week</option>
            </select>
          </div>

          <div className="relative flex-1 min-h-[220px]">
            <svg className="w-full h-full" viewBox="0 0 500 220" preserveAspectRatio="none">
              <line x1="40" y1="20" x2="480" y2="20" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="40" y1="55" x2="480" y2="55" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="40" y1="90" x2="480" y2="90" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="40" y1="125" x2="480" y2="125" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="40" y1="160" x2="480" y2="160" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="40" y1="195" x2="480" y2="195" stroke="#e2e8f0" strokeWidth="1.5" />

              <text x="30" y="24" fill="#94a3b8" fontSize="9" fontWeight="bold" textAnchor="end">100K</text>
              <text x="30" y="59" fill="#94a3b8" fontSize="9" fontWeight="bold" textAnchor="end">80K</text>
              <text x="30" y="94" fill="#94a3b8" fontSize="9" fontWeight="bold" textAnchor="end">60K</text>
              <text x="30" y="129" fill="#94a3b8" fontSize="9" fontWeight="bold" textAnchor="end">40K</text>
              <text x="30" y="164" fill="#94a3b8" fontSize="9" fontWeight="bold" textAnchor="end">20K</text>
              <text x="30" y="199" fill="#94a3b8" fontSize="9" fontWeight="bold" textAnchor="end">0</text>

              <path d="M 50,165 C 120,135 190,160 260,130 C 330,110 400,150 470,115" fill="none" stroke="#93c5fd" strokeWidth="1.5" strokeDasharray="4,4" />
              <path d="M 50,150 C 120,120 190,135 260,110 C 330,80 400,90 470,120" fill="none" stroke="#2563eb" strokeWidth="2.5" />

              <circle cx="50" cy="150" r="3.5" fill="#2563eb" stroke="#ffffff" strokeWidth="1" />
              <circle cx="120" cy="120" r="3.5" fill="#2563eb" stroke="#ffffff" strokeWidth="1" />
              <circle cx="190" cy="135" r="3.5" fill="#2563eb" stroke="#ffffff" strokeWidth="1" />
              <circle cx="260" cy="110" r="3.5" fill="#2563eb" stroke="#ffffff" strokeWidth="1" />
              <circle cx="330" cy="80" r="3.5" fill="#2563eb" stroke="#ffffff" strokeWidth="1" />
              <circle cx="400" cy="90" r="3.5" fill="#2563eb" stroke="#ffffff" strokeWidth="1" />
              <circle cx="470" cy="120" r="3.5" fill="#2563eb" stroke="#ffffff" strokeWidth="1" />
            </svg>
            <div className="flex justify-between pl-[40px] pr-[15px] pt-1 text-[9px] font-bold text-gray-400">
              <span>1 May</span><span>2 May</span><span>3 May</span><span>4 May</span><span>5 May</span><span>6 May</span><span>7 May</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-6 mt-3 text-[10px] font-semibold">
            <div className="flex items-center gap-2 text-gray-700">
              <span className="w-3 h-0.5 bg-blue-600 rounded"></span>
              <span>This Week</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <span className="w-3 h-0.5 bg-blue-300 border-dashed border-t border-gray-400 rounded"></span>
              <span>Last Week</span>
            </div>
          </div>
        </div>

        {/* Payment Status (Donut Chart) */}
        <div className="lg:col-span-3 bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between min-h-[340px]">
          <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">Payment Status</h3>

          <div className="flex flex-col items-center justify-center relative my-3">
            <svg className="w-40 h-40" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="38" fill="transparent" stroke="#10b981" strokeWidth="10" strokeDasharray="185 238.7" strokeDashoffset="0" transform="rotate(-90 50 50)" />
              <circle cx="50" cy="50" r="38" fill="transparent" stroke="#f59e0b" strokeWidth="10" strokeDasharray="34.6 238.7" strokeDashoffset="-185" transform="rotate(-90 50 50)" />
              <circle cx="50" cy="50" r="38" fill="transparent" stroke="#ef4444" strokeWidth="10" strokeDasharray="19.1 238.7" strokeDashoffset="-219.6" transform="rotate(-90 50 50)" />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-xl font-black text-gray-900 leading-none">{totalInvoicesVal}</span>
              <span className="text-[10px] text-gray-400 font-bold tracking-wider mt-1">Invoices</span>
            </div>
          </div>

          <div className="space-y-2 mt-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm"></span>
                <span className="font-medium text-gray-600">Paid</span>
              </div>
              <span className="font-bold text-gray-950">
                {documents.filter(d => d.status === "Paid").length}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm"></span>
                <span className="font-medium text-gray-600">Pending</span>
              </div>
              <span className="font-bold text-gray-950">
                {documents.filter(d => d.status === "Pending").length}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm"></span>
                <span className="font-medium text-gray-600">Overdue</span>
              </div>
              <span className="font-bold text-gray-950">
                {documents.filter(d => d.status === "Overdue").length}
              </span>
            </div>
          </div>
        </div>

        {/* Revenue by Service Category */}
        <div className="lg:col-span-4 bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between min-h-[340px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Revenue by Service</h3>
            <span className="text-[10px] font-bold text-gray-400 uppercase">This Week</span>
          </div>

          <div className="flex-1 flex items-end justify-between gap-1 px-2 pt-6 pb-2 min-h-[190px]">
            {serviceCategories.map((bar, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full group relative">
                <div className="absolute bottom-full mb-2 bg-gray-950 text-white text-[9px] font-bold py-1 px-2 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                  {bar.full}: ₹{bar.value}
                </div>
                <div className="flex-1 w-full flex items-end justify-center">
                  <div style={{ height: `${bar.pct}%` }} className="w-[18px] bg-blue-600 rounded-t-md hover:bg-blue-700 transition-all flex flex-col justify-start items-center pt-1 shadow-sm">
                    <span className="text-[8px] font-bold text-white leading-none scale-75 select-none">{bar.value}</span>
                  </div>
                </div>
                <span className="text-[8px] font-bold text-gray-400 text-center tracking-tight truncate max-w-[40px]" title={bar.full}>
                  {bar.label}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-150 pt-3 text-[10px] text-center text-gray-400 font-semibold uppercase">
            Top Service Categories
          </div>
        </div>
      </div>

      {/* ── Today's Invoices & Top Customers Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Invoices Summary */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <h3 className="font-bold text-xs text-gray-800 uppercase tracking-wider">Today's Invoices Summary</h3>
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold">
              {todayDocs.length} Active
            </span>
          </div>
          <div className="overflow-x-auto flex-1">
            {todayDocs.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs font-medium">No invoices or billing activity recorded today yet.</div>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/20 text-gray-500">
                    <th className="px-4 py-2.5 text-left font-bold uppercase tracking-wider">Invoice No.</th>
                    <th className="px-4 py-2.5 text-left font-bold uppercase tracking-wider">Customer</th>
                    <th className="px-4 py-2.5 text-left font-bold uppercase tracking-wider">Vehicle No.</th>
                    <th className="px-4 py-2.5 text-left font-bold uppercase tracking-wider">Amount</th>
                    <th className="px-4 py-2.5 text-left font-bold uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150">
                  {todayDocs.map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-50/20 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-blue-600">{inv.id}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900">{inv.client}</td>
                      <td className="px-4 py-3 text-gray-500 font-medium uppercase">{inv.vehicle}</td>
                      <td className="px-4 py-3 font-bold text-gray-900">
                        ₹ {(inv.total || (inv.amount + (inv.gst || 0) - (inv.discount || 0))).toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${inv.status === "Paid"
                          ? "bg-green-100 text-green-700"
                          : "bg-amber-100 text-amber-700"
                          }`}>
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Top Customers list */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <h3 className="font-bold text-xs text-gray-800 uppercase tracking-wider font-bold">Top Customers <span className="text-[10px] text-gray-400 font-medium font-normal uppercase">(By Revenue)</span></h3>
          </div>
          <div className="divide-y divide-gray-150 flex-1">
            {topCustomers.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs font-medium">No customer billing records found.</div>
            ) : (
              topCustomers.map((cust) => (
                <div key={cust.rank} className="p-4 flex items-center justify-between hover:bg-gray-50/20 transition-colors">
                  <div className="flex items-center gap-3.5">
                    <span className="text-xs font-bold text-gray-400">{cust.rank}</span>
                    <div className="p-1.5 rounded-full bg-blue-50 text-blue-600">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-semibold text-gray-900">{cust.name}</span>
                  </div>
                  <span className="text-xs font-bold text-gray-950">{cust.amount}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom Summary Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { title: "Average Invoice Value", value: `₹ ${(totalInvoicesVal > 0 ? Math.round(totalRevenueVal / totalInvoicesVal) : 0).toLocaleString("en-IN")}`, icon: FileText, color: "bg-blue-50 text-blue-600" },
          { title: "Total Discounts Given", value: `₹ ${documents.reduce((sum, d) => sum + (d.discount || 0), 0).toLocaleString("en-IN")}`, icon: Percent, color: "bg-green-50 text-green-600" },
          { title: "Total Taxes Collected", value: `₹ ${documents.reduce((sum, d) => sum + (d.gst || 0), 0).toLocaleString("en-IN")}`, icon: FileText, color: "bg-purple-50 text-purple-600" },
          { title: "Estimated Expenses", value: "₹ 21,480", icon: TrendingDown, color: "bg-red-50 text-red-600" },
          { title: "Net Profit Margin", value: `₹ ${Math.max(0, totalRevenueVal - 21480).toLocaleString("en-IN")}`, icon: TrendingUp, color: "bg-emerald-50 text-emerald-600" },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex items-center gap-4">
              <div className={`p-2.5 rounded-xl ${stat.color} shrink-0`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider truncate">{stat.title}</p>
                <p className="text-sm font-bold text-gray-900 truncate mt-0.5">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
