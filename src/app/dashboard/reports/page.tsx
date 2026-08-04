"use client";

import { useState, useEffect } from "react";
import { 
  Download, Filter, Calendar, Building2, Wrench, Users, UserCheck, 
  Briefcase, DollarSign, Package, RefreshCw, FileSpreadsheet, 
  TrendingUp, AlertTriangle, ChevronRight, BarChart3
} from "lucide-react";
import { 
  getReports, getHQSummaryReport, getCrmReport, getCustomerReport, getEmployeeReport, 
  getFinancialReport, getInventoryReport, getWorkshopReport, downloadReportCsv 
} from "@/lib/api";
import { getInvoiceRegister } from "@/modules/billing/services/billing.service";
import { BillingReportRow } from "@/modules/billing/types/billing.types";

type TabCategory = "executive" | "workshop" | "crm" | "customer" | "employee" | "financial" | "inventory";

export default function ReportsPage() {
  const [activeCategory, setActiveCategory] = useState<TabCategory>("executive");
  const [subReport, setSubReport] = useState<string>("business-summary");
  
  // Global Filters (§16.12)
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [datePreset, setDatePreset] = useState<string>("month");
  
  // State for loaded tables
  const [tableRows, setTableRows] = useState<any[]>([]);
  const [billingRows, setBillingRows] = useState<BillingReportRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Set default date range on mount
  useEffect(() => {
    applyDatePreset("month");
  }, []);

  const applyDatePreset = (preset: string) => {
    setDatePreset(preset);
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0] || '';
    if (preset === "today") {
      setFromDate(todayStr);
      setToDate(todayStr);
    } else if (preset === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(today.getDate() - 7);
      setFromDate(weekAgo.toISOString().split("T")[0] || '');
      setToDate(todayStr);
    } else if (preset === "month") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setFromDate(firstDay.toISOString().split("T")[0] || '');
      setToDate(todayStr);
    } else if (preset === "all") {
      setFromDate("");
      setToDate("");
    }
  };

  // Change default sub-report when switching tabs
  const handleTabChange = (cat: TabCategory) => {
    setActiveCategory(cat);
    switch (cat) {
      case "executive": setSubReport("business-summary"); break;
      case "workshop":  setSubReport("progress"); break;
      case "crm":       setSubReport("register"); break;
      case "customer":  setSubReport("register"); break;
      case "employee":  setSubReport("attendance"); break;
      case "financial": setSubReport("payment-register"); break;
      case "inventory": setSubReport("register"); break;
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [activeCategory, subReport, fromDate, toDate]);

  const fetchReportData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (activeCategory === "executive") {
        const res = await getHQSummaryReport().catch(() => null);
        if (res) {
          if (subReport === "business-summary") setTableRows(res.summary || res.businessSummary || [res]);
          else if (subReport === "revenue-analysis") setTableRows(res.revenueAnalysis || res.franchiseRevenue || [res]);
          else setTableRows(res.franchisePerformance || res.franchises || [res]);
        } else {
          const overview = await getReports();
          setTableRows(overview?.jobSummary || []);
        }
      } else if (activeCategory === "workshop") {
        const rows = await getWorkshopReport(subReport, fromDate, toDate).catch(async () => {
          const res = await getReports();
          const r = res || {};
          if (subReport === "progress") return r.jobSummary || [];
          if (subReport === "completed") return r.jobSummary?.filter((j: any) => j.status === "Completed") || [];
          return r.jobSummary || [];
        });
        setTableRows(Array.isArray(rows) ? rows : []);
      } else if (activeCategory === "crm") {
        const rows = await getCrmReport(subReport, fromDate, toDate);
        setTableRows(Array.isArray(rows) ? rows : []);
      } else if (activeCategory === "customer") {
        const rows = await getCustomerReport(subReport, fromDate, toDate);
        setTableRows(Array.isArray(rows) ? rows : []);
      } else if (activeCategory === "employee") {
        const rows = await getEmployeeReport(subReport, fromDate, toDate);
        setTableRows(Array.isArray(rows) ? rows : []);
      } else if (activeCategory === "financial") {
        if (subReport === "invoices") {
          const invs = await getInvoiceRegister();
          setBillingRows(invs || []);
        } else {
          const rows = await getFinancialReport(subReport, fromDate, toDate);
          setTableRows(Array.isArray(rows) ? rows : []);
        }
      } else if (activeCategory === "inventory") {
        const rows = await getInventoryReport(subReport, fromDate, toDate);
        setTableRows(Array.isArray(rows) ? rows : []);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load report data");
      setTableRows([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      setIsExporting(true);
      if (activeCategory === "financial" && subReport === "invoices") {
        // Export billing register CSV
        const headers = ["Invoice No", "Date", "Customer", "Phone", "Amount", "GST", "Total", "Status"];
        const csvRows = [
          headers.join(","),
          ...billingRows.map((row: any) => [
            `"${row.invoiceNo || row.id || ''}"`,
            `"${row.date || ''}"`,
            `"${String(row.customerName || row.client || '').replace(/"/g, '""')}"`,
            `"${row.phone || ''}"`,
            row.amount || 0,
            row.gst || 0,
            row.total || 0,
            `"${row.status || ''}"`
          ].join(","))
        ];
        const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `billing_invoices_${fromDate || 'all'}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        await downloadReportCsv(
          activeCategory === "executive" ? "hq-summary" : activeCategory, 
          subReport, 
          fromDate, 
          toDate
        );
      }
    } catch (err: any) {
      alert("Export failed: " + (err.message || "Unknown error"));
    } finally {
      setIsExporting(false);
    }
  };

  // Sub-report button configurations for each category tab (§16)
  const subReportOptions: Record<TabCategory, { id: string; label: string }[]> = {
    executive: [
      { id: "business-summary", label: "Business Summary" },
      { id: "revenue-analysis", label: "Revenue Analysis" },
      { id: "franchise-performance", label: "Franchise Performance" }
    ],
    workshop: [
      { id: "progress", label: "Workshop Progress Report" },
      { id: "workload", label: "Technician Workload" },
      { id: "completed", label: "Completed Jobs" },
      { id: "pending", label: "Pending Jobs" },
      { id: "materials", label: "Material Consumption" },
      { id: "delays", label: "Delay Analysis" }
    ],
    crm: [
      { id: "register", label: "Lead Register" },
      { id: "sources", label: "Source Analysis" },
      { id: "conversion", label: "Conversion Report" },
      { id: "followup-performance", label: "Follow-up Performance" },
      { id: "lost", label: "Lost Lead Report" }
    ],
    customer: [
      { id: "register", label: "Customer Register" },
      { id: "visits", label: "Visit Analysis" },
      { id: "revenue", label: "Revenue Contribution" },
      { id: "history", label: "Service History" }
    ],
    employee: [
      { id: "attendance", label: "Attendance Report" },
      { id: "productivity", label: "Technician Productivity" },
      { id: "contribution", label: "Revenue Contribution" }
    ],
    financial: [
      { id: "payment-register", label: "Payment Register" },
      { id: "outstanding", label: "Outstanding Report" },
      { id: "collection", label: "Collection Summary" },
      { id: "payment-modes", label: "Payment Modes Summary" },
      { id: "invoices", label: "Invoice Register" }
    ],
    inventory: [
      { id: "register", label: "Product Register" },
      { id: "summary", label: "Stock Summary" },
      { id: "ledger", label: "Stock Ledger" },
      { id: "low-stock", label: "Low Stock Alert" },
      { id: "valuation", label: "Inventory Valuation" }
    ]
  };

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
      {/* Page Title & Global Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-7 h-7 text-blue-600" />
            Reports & Analytics Center
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            PRD §16 — Comprehensive financial, CRM, operational, employee, and inventory reporting
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          disabled={isExporting || isLoading}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          {isExporting ? "Generating CSV..." : "Export CSV"}
        </button>
      </div>

      {/* Global Filter Bar (§16.12) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
          <Filter className="w-4 h-4 text-blue-600" />
          <span>Filter Criteria:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Quick Preset Buttons */}
          <div className="inline-flex bg-slate-100 rounded-lg p-1">
            {[
              { id: "today", label: "Today" },
              { id: "week", label: "Last 7 Days" },
              { id: "month", label: "This Month" },
              { id: "all", label: "All Time" },
            ].map(preset => (
              <button
                key={preset.id}
                onClick={() => applyDatePreset(preset.id)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                  datePreset === preset.id
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Custom From Date */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-medium text-slate-500">From:</label>
            <input
              type="date"
              value={fromDate}
              onChange={e => { setFromDate(e.target.value); setDatePreset("custom"); }}
              className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Custom To Date */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-medium text-slate-500">To:</label>
            <input
              type="date"
              value={toDate}
              onChange={e => { setToDate(e.target.value); setDatePreset("custom"); }}
              className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={fetchReportData}
            className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg transition"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-blue-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* Main Categories Tab Bar (§16.5) */}
      <div className="flex flex-wrap border-b border-slate-200 gap-2">
        {[
          { id: "executive", label: "Executive Reports", icon: BarChart3 },
          { id: "workshop", label: "Workshop & QC", icon: Wrench },
          { id: "crm", label: "CRM & Leads", icon: TrendingUp },
          { id: "customer", label: "Customer Analytics", icon: UserCheck },
          { id: "employee", label: "Employee Reports", icon: Users },
          { id: "financial", label: "Financial & Billing", icon: DollarSign },
          { id: "inventory", label: "Inventory & Stock", icon: Package },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeCategory === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as TabCategory)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition ${
                isActive
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Sub-report selector buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {subReportOptions[activeCategory].map(opt => {
          const isSelected = subReport === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => setSubReport(opt.id)}
              className={`px-4 py-2 text-xs font-semibold rounded-xl border transition ${
                isSelected
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
          Error: {error}
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center text-slate-500 font-medium">
            Loading report records...
          </div>
        ) : activeCategory === "financial" && subReport === "invoices" ? (
          // Invoice Register Table Display
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Invoice No</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Phone</th>
                  <th className="py-3.5 px-4 text-right">Amount (₹)</th>
                  <th className="py-3.5 px-4 text-right">GST (₹)</th>
                  <th className="py-3.5 px-4 text-right">Total (₹)</th>
                  <th className="py-3.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {billingRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No invoices found for the selected date range.
                    </td>
                  </tr>
                ) : (
                  billingRows.map((r: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 px-4 font-semibold text-blue-600">{String(r.invoiceNo || r.id || '')}</td>
                      <td className="py-3 px-4 text-slate-600">{String(r.date || '')}</td>
                      <td className="py-3 px-4 font-medium text-slate-900">{String(r.customerName || r.client || '')}</td>
                      <td className="py-3 px-4 text-slate-600">{String(r.phone || '')}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-700">{(r.amount || 0).toLocaleString("en-IN")}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-700">{(r.gst || 0).toLocaleString("en-IN")}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{(r.total || 0).toLocaleString("en-IN")}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                          r.status === "Paid" ? "bg-emerald-100 text-emerald-700" :
                          r.status === "Partially Paid" ? "bg-amber-100 text-amber-700" :
                          r.status === "Cancelled" ? "bg-red-100 text-red-700" :
                          "bg-slate-100 text-slate-700"
                        }`}>
                          {String(r.status || '')}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          // Dynamic JSON Array Table Display
          <div className="overflow-x-auto">
            {tableRows.length === 0 ? (
              <div className="py-16 text-center text-slate-400 font-medium">
                No report records found for the selected filters.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-xs font-semibold uppercase tracking-wider">
                    {Object.keys(tableRows[0] || {}).map((col, idx) => (
                      <th key={idx} className="py-3.5 px-4 capitalize">
                        {col.replace(/([A-Z])/g, " $1")}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {tableRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition">
                      {Object.values(row).map((val: any, vIdx) => (
                        <td key={vIdx} className="py-3 px-4 text-slate-700">
                          {typeof val === "number" && Object.keys(row)[vIdx].toLowerCase().includes("price") ||
                           typeof val === "number" && Object.keys(row)[vIdx].toLowerCase().includes("amount") ||
                           typeof val === "number" && Object.keys(row)[vIdx].toLowerCase().includes("value") ||
                           typeof val === "number" && Object.keys(row)[vIdx].toLowerCase().includes("revenue") ? (
                            <span className="font-mono font-semibold">₹{val.toLocaleString("en-IN")}</span>
                          ) : typeof val === "number" ? (
                            <span className="font-mono">{val.toLocaleString("en-IN")}</span>
                          ) : (
                            val || "N/A"
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
