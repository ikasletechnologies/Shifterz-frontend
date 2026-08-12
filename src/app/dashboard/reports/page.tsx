"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Download, Filter, Calendar, Building2, Wrench, Users, UserCheck, 
  Briefcase, DollarSign, Package, RefreshCw, FileSpreadsheet, 
  TrendingUp, AlertTriangle, ChevronRight, BarChart3, Search, X
} from "lucide-react";
import { 
  getReports, getHQSummaryReport, getCrmReport, getCustomerReport, getEmployeeReport, 
  getFinancialReport, getInventoryReport, getWorkshopReport, downloadReportCsv, getFranchises
} from "@/lib/api";
import { getInvoiceRegister } from "@/modules/billing/services/billing.service";
import { getJobCards } from "@/modules/job-card/services/job-card.service";
import { BillingReportRow } from "@/modules/billing/types/billing.types";

type TabCategory = "executive" | "workshop" | "crm" | "customer" | "employee" | "financial" | "inventory";

export default function ReportsPage() {
  const [activeCategory, setActiveCategory] = useState<TabCategory>("executive");
  const [subReport, setSubReport] = useState<string>("business-summary");
  
  // Global Filters & Search
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  
  // State for loaded tables
  const [tableRows, setTableRows] = useState<any[]>([]);
  const [billingRows, setBillingRows] = useState<BillingReportRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const getTodayISO = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleFromDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val) {
      setFromDate("");
      return;
    }
    if (toDate && val > toDate) {
      setFromDate(toDate);
      setToDate(val);
    } else {
      setFromDate(val);
    }
  };

  const handleToDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val) {
      setToDate("");
      return;
    }
    if (fromDate && val < fromDate) {
      setToDate(fromDate);
      setFromDate(val);
    } else {
      setToDate(val);
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

  // Helper to ensure data is always a valid Array
  const safeArray = (data: any): any[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (typeof data === "object") {
      const keys = ["data", "rows", "items", "reports", "summary", "businessSummary", "revenueAnalysis", "franchiseRevenue", "franchisePerformance", "franchises", "jobSummary"];
      for (const key of keys) {
        if (Array.isArray(data[key])) return data[key];
      }
      if (Object.keys(data).length > 0) return [data];
    }
    return [];
  };

  useEffect(() => {
    fetchReportData();
  }, [activeCategory, subReport, fromDate, toDate]);

  const fetchFranchisePerformanceData = async () => {
    const [franchises, jobs, invoices] = await Promise.all([
      getFranchises().catch(() => []),
      getJobCards().catch(() => []),
      getInvoiceRegister().catch(() => []),
    ]);

    const franList = Array.isArray(franchises) ? franchises : [];
    const jobList = Array.isArray(jobs) ? jobs : [];
    const invList = Array.isArray(invoices) ? invoices : [];

    const filteredJobs = jobList.filter((j: any) => {
      if (!fromDate && !toDate) return true;
      const jDate = (j.createdAt || j.date || "").split("T")[0];
      if (!jDate) return true;
      if (fromDate && jDate < fromDate) return false;
      if (toDate && jDate > toDate) return false;
      return true;
    });

    const filteredInvoices = invList.filter((i: any) => {
      if (!fromDate && !toDate) return true;
      const iDate = (i.date || i.createdAt || "").split("T")[0];
      if (!iDate) return true;
      if (fromDate && iDate < fromDate) return false;
      if (toDate && iDate > toDate) return false;
      return true;
    });

    const branchMap: Record<string, {
      id: string;
      name: string;
      totalJobs: number;
      completedJobs: number;
      customers: Set<string>;
      revenue: number;
    }> = {};

    branchMap["HQ"] = {
      id: "HQ",
      name: "Headquarters (HQ)",
      totalJobs: 0,
      completedJobs: 0,
      customers: new Set(),
      revenue: 0,
    };

    franList.forEach((f: any) => {
      const key = f.id || f.name;
      branchMap[key] = {
        id: f.id,
        name: f.name || "Franchise Branch",
        totalJobs: 0,
        completedJobs: 0,
        customers: new Set(),
        revenue: 0,
      };
    });

    filteredJobs.forEach((j: any) => {
      const fId = j.franchiseId || j.branchId || "HQ";
      let targetKey = fId;
      if (!branchMap[targetKey]) {
        const found = Object.keys(branchMap).find((k) => branchMap[k].name.toLowerCase() === String(j.branch || j.franchiseName || "").toLowerCase());
        targetKey = found || "HQ";
      }

      const b = branchMap[targetKey];
      if (b) {
        b.totalJobs += 1;
        const statusUpper = (j.status || "").toUpperCase();
        const isDone = statusUpper.includes("COMPLETE") || statusUpper.includes("DELIVER") || statusUpper.includes("READY");
        if (isDone) {
          b.completedJobs += 1;
        }

        const cust = j.customerName || j.client || j.customerPhone || j.vehicleNo || j.id;
        if (cust) b.customers.add(cust);

        const amt = Number(j.grandTotal || j.totalAmount || j.total || j.amount || 0);
        b.revenue += amt;
      }
    });

    filteredInvoices.forEach((i: any) => {
      const fId = i.franchiseId || "HQ";
      const b = branchMap[fId] || branchMap["HQ"];
      if (b && b.revenue === 0) {
        b.revenue += Number(i.total || i.amount || 0);
      }
    });

    const branchEntries = Object.values(branchMap).filter((b) => b.totalJobs > 0 || b.revenue > 0 || b.id === "HQ");

    const calculated = branchEntries.map((b) => {
      const completionRatePct = b.totalJobs > 0 ? (b.completedJobs / b.totalJobs) * 100 : 0;
      const avgRevPerJob = b.completedJobs > 0 ? Math.round(b.revenue / b.completedJobs) : (b.totalJobs > 0 ? Math.round(b.revenue / b.totalJobs) : 0);
      const customersCount = b.customers.size;

      const completionPart = (completionRatePct * 0.5);
      const customerPart = Math.min(30, customersCount * 3);
      const revenuePart = Math.min(20, Math.round(b.revenue / 5000));
      const rawScore = Math.min(100, Math.max(10, Math.round(completionPart + customerPart + revenuePart)));

      return {
        id: b.id,
        name: b.name,
        revenue: b.revenue,
        totalJobs: b.totalJobs,
        completedJobs: b.completedJobs,
        customersCount,
        avgRevPerJob,
        completionRatePct,
        score: rawScore,
      };
    });

    calculated.sort((a, b) => b.score - a.score || b.revenue - a.revenue);

    return calculated.map((item, index) => ({
      "Rank": `#${index + 1}`,
      "Franchise / Branch": item.name,
      "Total Revenue": `₹${item.revenue.toLocaleString("en-IN")}`,
      "Total Jobs Completed": item.completedJobs,
      "Total Customers Served": item.customersCount,
      "Average Revenue per Job": `₹${item.avgRevPerJob.toLocaleString("en-IN")}`,
      "Job Completion Rate": `${item.completionRatePct.toFixed(1)}%`,
      "Branch Performance Score": `${item.score} / 100`,
    }));
  };

  const fetchReportData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (activeCategory === "executive") {
        if (subReport === "franchise-performance") {
          const perfRows = await fetchFranchisePerformanceData();
          setTableRows(perfRows);
        } else {
          const res = await getHQSummaryReport().catch(() => null);
          if (res) {
            if (subReport === "business-summary") setTableRows(safeArray(res.summary || res.businessSummary || res));
            else if (subReport === "revenue-analysis") setTableRows(safeArray(res.revenueAnalysis || res.franchiseRevenue || res));
            else setTableRows(safeArray(res.franchisePerformance || res.franchises || res));
          } else {
            const overview = await getReports().catch(() => null);
            setTableRows(safeArray(overview?.jobSummary || overview));
          }
        }
      } else if (activeCategory === "workshop") {
        const rows = await getWorkshopReport(subReport, fromDate, toDate).catch(async () => {
          const res = await getReports().catch(() => null);
          const r = res || {};
          if (subReport === "progress") return r.jobSummary || [];
          if (subReport === "completed") return Array.isArray(r.jobSummary) ? r.jobSummary.filter((j: any) => j.status === "Completed") : [];
          return r.jobSummary || [];
        });
        setTableRows(safeArray(rows));
      } else if (activeCategory === "crm") {
        const rows = await getCrmReport(subReport, fromDate, toDate).catch(() => []);
        setTableRows(safeArray(rows));
      } else if (activeCategory === "customer") {
        const rows = await getCustomerReport(subReport, fromDate, toDate).catch(() => []);
        setTableRows(safeArray(rows));
      } else if (activeCategory === "employee") {
        const rows = await getEmployeeReport(subReport, fromDate, toDate).catch(() => []);
        setTableRows(safeArray(rows));
      } else if (activeCategory === "financial") {
        if (subReport === "invoices") {
          const invs = await getInvoiceRegister().catch(() => []);
          setBillingRows(safeArray(invs));
        } else {
          const rows = await getFinancialReport(subReport, fromDate, toDate).catch(() => []);
          setTableRows(safeArray(rows));
        }
      } else if (activeCategory === "inventory") {
        const rows = await getInventoryReport(subReport, fromDate, toDate).catch(() => []);
        setTableRows(safeArray(rows));
      }
    } catch (err: any) {
      setError(err.message || "Failed to load report data");
      setTableRows([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatHeaderLabel = (key: string): string => {
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/_/g, " ")
      .replace(/^\w/, (c) => c.toUpperCase())
      .trim();
  };

  const handleExportWord = async () => {
    try {
      setIsExporting(true);

      let headers: string[] = [];
      let rowsData: string[][] = [];

      if (activeCategory === "financial" && subReport === "invoices") {
        headers = ["Invoice No", "Date", "Customer", "Phone", "Amount", "GST", "Total", "Status"];
        rowsData = filteredBillingRows.map((row: any) => [
          String(row.invoiceNo || row.id || "-"),
          String(row.date || "-"),
          String(row.customerName || row.client || "-"),
          String(row.phone || "-"),
          String(row.amount || 0),
          String(row.gst || 0),
          String(row.total || 0),
          String(row.status || "-"),
        ]);
      } else if (filteredTableRows.length > 0) {
        const sampleKeys = Object.keys(filteredTableRows[0]).filter(
          (k) => typeof filteredTableRows[0][k] !== "object" && k !== "isDeleted" && k !== "id"
        );
        const keys = sampleKeys.length > 0 ? sampleKeys : Object.keys(filteredTableRows[0]).slice(0, 10);
        headers = keys.map(formatHeaderLabel);
        rowsData = filteredTableRows.map((row: any) =>
          keys.map((k) => {
            const val = row[k];
            if (val === null || val === undefined) return "-";
            if (typeof val === "object") return JSON.stringify(val);
            return String(val);
          })
        );
      }

      const categoryNames: Record<TabCategory, string> = {
        executive: "Executive HQ Reports",
        workshop: "Workshop & Service Reports",
        crm: "CRM & Lead Reports",
        customer: "Customer & Fleet Reports",
        employee: "Employee & HR Reports",
        financial: "Financial & Billing Reports",
        inventory: "Inventory & Spare Parts Reports",
      };

      const title = `${categoryNames[activeCategory] || activeCategory} — ${subReport.replace(/-/g, " ").toUpperCase()}`;
      const headersHtml = headers
        .map((h) => `<th style="background-color:#2563eb;color:#ffffff;padding:8px 10px;border:1px solid #1d4ed8;font-size:10pt;text-align:left;">${h}</th>`)
        .join("");

      const rowsHtml =
        rowsData.length > 0
          ? rowsData
              .map(
                (r, idx) =>
                  `<tr style="background-color:${idx % 2 === 0 ? "#ffffff" : "#f8fafc"};">` +
                  r
                    .map(
                      (cell) =>
                        `<td style="padding:7px 10px;border:1px solid #cbd5e1;font-size:9.5pt;color:#334155;">${cell
                          .replace(/&/g, "&amp;")
                          .replace(/</g, "&lt;")
                          .replace(/>/g, "&gt;")}</td>`
                    )
                    .join("") +
                  `</tr>`
              )
              .join("")
          : `<tr><td colspan="${headers.length || 1}" style="padding:16px;text-align:center;color:#64748b;">No report data available for the selected criteria.</td></tr>`;

      const docxHtml = `
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; margin: 30pt; color: #1e293b; }
  h1 { color: #1e3a8a; font-size: 18pt; margin-bottom: 6pt; border-bottom: 2.5pt solid #2563eb; padding-bottom: 6pt; }
  .meta { color: #475569; font-size: 9.5pt; margin-bottom: 18pt; line-height: 1.5; }
  table { width: 100%; border-collapse: collapse; margin-top: 12pt; }
  .footer { margin-top: 28pt; font-size: 8.5pt; color: #94a3b8; border-top: 1pt solid #e2e8f0; padding-top: 8pt; text-align: right; }
</style>
</head>
<body>
  <h1>${title}</h1>
  <p class="meta">
    <strong>Category:</strong> ${categoryNames[activeCategory] || activeCategory} &nbsp;&nbsp;|&nbsp;&nbsp;
    <strong>Report:</strong> ${subReport} &nbsp;&nbsp;|&nbsp;&nbsp;
    <strong>Filter:</strong> ${fromDate || "Start"} to ${toDate || "Today"} &nbsp;&nbsp;|&nbsp;&nbsp;
    <strong>Exported:</strong> ${new Date().toLocaleString()}
  </p>
  <table>
    <thead>
      <tr>${headersHtml}</tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>
  <div class="footer">
    Confidential &mdash; Generated by Shifterz Auto Management System
  </div>
</body>
</html>
      `;

      const blob = new Blob(["\ufeff" + docxHtml], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `report_${subReport}_${fromDate || "all"}.docx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert("Export Word failed: " + (err.message || "Unknown error"));
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
      { id: "invoices", label: "Billing / Invoice Register" },
      { id: "payment-register", label: "Payment Register" },
      { id: "pending-payments", label: "Pending Payments" },
      { id: "gst-report", label: "GST Report" }
    ],
    inventory: [
      { id: "register", label: "Inventory Stock Register" },
      { id: "valuation", label: "Valuation Report" },
      { id: "consumption", label: "Spare Consumption" },
      { id: "reorder", label: "Reorder / Low Stock List" }
    ]
  };

  const filteredBillingRows = useMemo(() => {
    if (!searchTerm.trim()) return billingRows;
    const query = searchTerm.toLowerCase();
    return billingRows.filter((r: any) =>
      Object.values(r || {}).some((val) =>
        String(val || "").toLowerCase().includes(query)
      )
    );
  }, [billingRows, searchTerm]);

  const filteredTableRows = useMemo(() => {
    const arr = safeArray(tableRows);
    if (!searchTerm.trim()) return arr;
    const query = searchTerm.toLowerCase();
    return arr.filter((r: any) =>
      Object.values(r || {}).some((val) =>
        typeof val === "object"
          ? JSON.stringify(val).toLowerCase().includes(query)
          : String(val || "").toLowerCase().includes(query)
      )
    );
  }, [tableRows, searchTerm]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header (§16.1) */}
      <div className="flex items-center justify-between">
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
          onClick={handleExportWord}
          disabled={isExporting || isLoading}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          {isExporting ? "Generating CSV..." : "Export CSV"}
        </button>
      </div>

      {/* Search & Date Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        {/* Search Bar on Left */}
        <div className="relative min-w-[240px] max-w-md flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search report details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Date Filters on Right (Car In Style) */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* From Date Filter */}
          <div className="flex items-center gap-1.5 bg-white border border-gray-300 rounded-lg px-2.5 py-2 shrink-0">
            <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">From:</span>
            <input
              type="date"
              value={fromDate}
              max={getTodayISO()}
              onChange={handleFromDateChange}
              className="bg-transparent border-none text-xs text-gray-800 focus:outline-none cursor-pointer p-0"
            />
            <button
              type="button"
              disabled={!fromDate}
              onClick={() => setFromDate("")}
              className={`p-0.5 rounded transition-colors flex items-center justify-center shrink-0 ${
                fromDate
                  ? "text-gray-600 hover:text-gray-900 hover:bg-gray-100 cursor-pointer"
                  : "text-gray-300 cursor-not-allowed opacity-50"
              }`}
              title={fromDate ? "Clear From Date" : ""}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* To Date Filter */}
          <div className="flex items-center gap-1.5 bg-white border border-gray-300 rounded-lg px-2.5 py-2 shrink-0">
            <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">To:</span>
            <input
              type="date"
              value={toDate}
              max={getTodayISO()}
              onChange={handleToDateChange}
              className="bg-transparent border-none text-xs text-gray-800 focus:outline-none cursor-pointer p-0"
            />
            <button
              type="button"
              disabled={!toDate}
              onClick={() => setToDate("")}
              className={`p-0.5 rounded transition-colors flex items-center justify-center shrink-0 ${
                toDate
                  ? "text-gray-600 hover:text-gray-900 hover:bg-gray-100 cursor-pointer"
                  : "text-gray-300 cursor-not-allowed opacity-50"
              }`}
              title={toDate ? "Clear To Date" : ""}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={fetchReportData}
            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
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
                {filteredBillingRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No invoices found for the selected search or date range.
                    </td>
                  </tr>
                ) : (
                  filteredBillingRows.map((r: any, idx: number) => (
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
            {filteredTableRows.length === 0 ? (
              <div className="py-16 text-center text-slate-400 font-medium">
                No report records found for the selected filters.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-xs font-semibold uppercase tracking-wider">
                    {Object.keys(filteredTableRows[0] || {}).map((col, idx) => (
                      <th key={idx} className="py-3.5 px-4 capitalize">
                        {col.replace(/([A-Z])/g, " $1")}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredTableRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition">
                      {Object.values(row || {}).map((val: any, vIdx) => (
                        <td key={vIdx} className="py-3 px-4 text-slate-700">
                          {typeof val === "number" && (Object.keys(row || {})[vIdx]?.toLowerCase().includes("price") ||
                           Object.keys(row || {})[vIdx]?.toLowerCase().includes("amount") ||
                           Object.keys(row || {})[vIdx]?.toLowerCase().includes("value") ||
                           Object.keys(row || {})[vIdx]?.toLowerCase().includes("revenue")) ? (
                            <span className="font-mono font-semibold">₹{val.toLocaleString("en-IN")}</span>
                          ) : typeof val === "number" ? (
                            <span className="font-mono">{val.toLocaleString("en-IN")}</span>
                          ) : typeof val === "object" && val !== null ? (
                            <span className="text-xs text-slate-600 font-mono">
                              {Array.isArray(val)
                                ? val.map((item) => (typeof item === "object" && item !== null ? JSON.stringify(item) : String(item ?? ''))).join(", ")
                                : Object.entries(val).map(([k, v]) => `${k}: ${typeof v === 'object' && v !== null ? JSON.stringify(v) : (v ?? '')}`).join(", ")}
                            </span>
                          ) : (
                            String(val ?? "N/A")
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
