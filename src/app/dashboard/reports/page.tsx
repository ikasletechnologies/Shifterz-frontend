"use client";

import { useState, useEffect } from "react";
import { Download, Wallet, Users, ClipboardList, Wrench, FileText, Calendar, TrendingUp } from "lucide-react";
import { getReports } from "@/lib/api";
import { getInvoiceRegister } from "@/modules/billing/services/billing.service";
import { BillingReportRow } from "@/modules/billing/types/billing.types";

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [billingReports, setBillingReports] = useState<BillingReportRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReports() {
      try {
        setIsLoading(true);
        const [res, registerData] = await Promise.all([
          getReports(),
          getInvoiceRegister()
        ]);
        setData(res);
        setBillingReports(registerData);
      } catch (err: any) {
        setError(err.message || "Failed to load reports");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchReports();
  }, []);

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading reports...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">Error: {error}</div>;
  }

  // Fallback to empty values if backend hasn't populated them
  const reports = data || {};
  const billingData = reports.billingData || [];
  const serviceRevenue = reports.serviceRevenue || [];
  const leadSources = reports.leadSources || [];
  const jobSummary = reports.jobSummary || [];
  const inventoryValue = reports.inventoryValue || [];

  const totalInvoiced = reports.totalInvoiced || 0;
  const totalCollected = reports.totalCollected || 0;
  const leadConversion = reports.leadConversion || 0;
  const franchiseRevenue = reports.franchiseRevenue || 0;
  const totalInventoryValue = inventoryValue.reduce((sum: number, item: any) => sum + item.value, 0);

  // Calculate Billing KPIs from register data
  const today = new Date().toISOString().split("T")[0];
  const thisMonth = today.substring(0, 7);
  let dailySales = 0;
  let monthlySales = 0;
  let gstCollected = 0;

  billingReports.forEach(row => {
    if (row.date === today) dailySales += row.total || 0;
    if (row.date?.startsWith(thisMonth)) monthlySales += row.total || 0;
    gstCollected += row.gst || 0;
  });

  const handleExportReport = (reportType: string) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    
    // Map UI button labels to valid backend /reports/export?type= values
    const typeMap: Record<string, string> = {
      "Revenue Report":    "service-wise",
      "Employee Report":   "employee-wise",
      "All Jobs":          "jobs",
      "Open Jobs":         "open-jobs",
      "Completed Jobs":    "completed-jobs",
      "Pending Jobs":      "pending-jobs",
      "Franchise P&L":     "branch-wise",
      "Job Summary":       "jobs",
    };

    const typeParam = typeMap[reportType] || "jobs";
    const url = `${apiBase}/reports/export?type=${typeParam}&token=${token || ""}`;
    window.open(url, "_blank");
  };

  // 13.13: Invoice Register, Daily/Monthly Sales, Customer/Franchise-wise Revenue, GST Summary.
  // Separate handler + endpoint namespace (/reports/billing/export) from the report above,
  // which points at a different, unrelated /reports/export endpoint.
  const handleExportBillingReport = (type: string) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    const url = `${apiBase}/reports/billing/export?type=${type}&token=${token || ""}`;
    window.open(url, "_blank");
  };

  return (
    <div className="p-8 space-y-6 bg-gray-50">
      {/* Top Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <p className="text-[11px] font-bold text-gray-400 tracking-wider mb-2 uppercase">
            Total Invoiced
          </p>
          <p className="text-3xl font-black text-yellow-600">
            ₹{totalInvoiced.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <p className="text-[11px] font-bold text-green-400 tracking-wider mb-2 uppercase">
            Total Collected
          </p>
          <p className="text-3xl font-black text-green-600">
            ₹{totalCollected.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <p className="text-[11px] font-bold text-gray-400 tracking-wider mb-2 uppercase">
            Lead Conversion
          </p>
          <p className="text-3xl font-black text-gray-900">{leadConversion}%</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <p className="text-[11px] font-bold text-purple-400 tracking-wider mb-2 uppercase">
            Franchise Revenue
          </p>
          <p className="text-3xl font-black text-purple-600">
            ₹{franchiseRevenue.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-2 gap-6">
        {/* Revenue by Service */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-yellow-500" /> Revenue by Service
          </h3>
          <div className="space-y-4">
            {serviceRevenue.length === 0 ? (
              <p className="text-sm text-gray-500">No data available.</p>
            ) : (
              serviceRevenue.map((item: any) => (
                <div key={item.service}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-semibold text-gray-700">
                      {item.service}
                    </span>
                    <span className="text-sm font-bold text-gray-600">
                      ₹{item.amount.toLocaleString("en-IN")} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full"
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Lead Source Analysis */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" /> Lead Source Analysis
          </h3>
          <div className="space-y-4">
            {leadSources.length === 0 ? (
              <p className="text-sm text-gray-500">No data available.</p>
            ) : (
              leadSources.map((item: any) => (
                <div key={item.source} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-sm font-semibold text-gray-700 min-w-24">
                      {item.source}
                    </span>
                    <div className="flex-1">
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-yellow-400 h-1.5 rounded-full"
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-700">{item.count}</p>
                    <p className="text-xs text-gray-500">({item.percentage}%)</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-3 gap-6">
        {/* Invoice Aging */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-purple-500" /> Invoice Aging
          </h3>
          <div className="space-y-3">
            {billingData.length === 0 ? (
              <p className="text-sm text-gray-500">No data available.</p>
            ) : (
              billingData.map((item: any) => (
                <div key={item.status} className="flex justify-between items-center pb-3 border-b border-gray-100 last:border-b-0">
                  <div>
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded ${
                        item.status === "Paid"
                          ? "bg-green-100 text-green-700"
                          : item.status === "Pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : item.status === "Overdue"
                          ? "bg-red-100 text-red-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">₹{item.amount.toLocaleString("en-IN")}</p>
                    <p className="text-xs text-gray-500">{item.count} docs</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Job Summary */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-orange-500" /> Job Summary
          </h3>
          <div className="space-y-3">
            {jobSummary.length === 0 ? (
              <p className="text-sm text-gray-500">No data available.</p>
            ) : (
              jobSummary.map((item: any) => (
                <div key={item.status} className="flex justify-between items-center">
                  <span
                    className={`text-xs font-bold px-3 py-1.5 rounded ${item.color || 'bg-gray-100 text-gray-700'}`}
                  >
                    {item.status}
                  </span>
                  <p className="font-bold text-gray-900">{item.count}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Inventory Value */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Inventory Value</h3>
          <div className="space-y-3">
            {inventoryValue.length === 0 ? (
              <p className="text-sm text-gray-500">No data available.</p>
            ) : (
              inventoryValue.map((item: any) => (
                <div key={item.category} className="flex justify-between items-center pb-3 border-b border-gray-100 last:border-b-0">
                  <span className="text-sm font-semibold text-gray-700">
                    {item.category}
                  </span>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">
                      ₹{item.value.toLocaleString("en-IN")}
                    </p>
                    <p className="text-xs text-gray-500">{item.items} item{item.items > 1 ? "s" : ""}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Billing Reports Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" /> Billing Reports (§13.13)
          </h3>
        </div>
        
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-blue-500" />
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Today's Sales</p>
              </div>
              <p className="text-2xl font-black text-gray-900">₹{dailySales.toLocaleString("en-IN")}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-purple-500" />
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">This Month's Sales</p>
              </div>
              <p className="text-2xl font-black text-gray-900">₹{monthlySales.toLocaleString("en-IN")}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="w-4 h-4 text-green-500" />
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total GST Collected</p>
              </div>
              <p className="text-2xl font-black text-gray-900">₹{gstCollected.toLocaleString("en-IN")}</p>
            </div>
          </div>
        </div>

        <div className="p-6 border-b border-gray-100">
          <h4 className="text-sm font-bold text-gray-700 mb-4">Recent Invoice Register</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/75">
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Doc No</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Vehicle</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">GST</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Discount</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Total</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {billingReports.slice(0, 5).map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-mono text-xs">{row.id}</td>
                    <td className="px-4 py-2 text-gray-600">{row.date}</td>
                    <td className="px-4 py-2 font-medium">{row.client}</td>
                    <td className="px-4 py-2 text-gray-600">{row.vehicle}</td>
                    <td className="px-4 py-2 text-right">₹{(row.amount || 0).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-2 text-right">₹{(row.gst || 0).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-2 text-right text-red-600">₹{(row.discount || 0).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-2 text-right font-bold">₹{(row.total || 0).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-2 text-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        row.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {billingReports.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-gray-500">No invoices found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-6 bg-gray-50/50">
          <h4 className="text-sm font-bold text-gray-700 mb-4">Export Billing Reports</h4>
          <div className="flex flex-wrap gap-3">
            {[
              { label: "Invoice Register", type: "register", color: "blue" },
              { label: "Daily Sales", type: "daily-sales", color: "green" },
              { label: "Monthly Sales", type: "monthly-sales", color: "purple" },
              { label: "Customer Revenue", type: "customer-wise", color: "orange" },
              { label: "Franchise Revenue", type: "franchise-wise", color: "indigo" },
              { label: "GST Summary", type: "gst-summary", color: "red" }
            ].map((report) => (
              <button
                key={report.type}
                onClick={() => handleExportBillingReport(report.type)}
                className={`flex items-center gap-2 px-4 py-2.5 bg-${report.color}-50 hover:bg-${report.color}-100 text-${report.color}-700 font-semibold rounded-lg transition-colors border border-${report.color}-200`}
              >
                <Download className="w-4 h-4" />
                {report.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Export Reports */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Export Reports</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleExportReport("Revenue Report")}
            className="flex items-center gap-2 px-4 py-2.5 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 font-semibold rounded-lg transition-colors border border-yellow-200"
          >
            <Download className="w-4 h-4" />
            Revenue Report (Service-wise)
          </button>
          <button
            onClick={() => handleExportReport("Employee Report")}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-100 hover:bg-purple-200 text-purple-700 font-semibold rounded-lg transition-colors border border-purple-200"
          >
            <Download className="w-4 h-4" />
            Employee Report
          </button>
          <button
            onClick={() => handleExportReport("Franchise P&L")}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-semibold rounded-lg transition-colors border border-indigo-200"
          >
            <Download className="w-4 h-4" />
            Franchise P&L (Branch-wise)
          </button>
          <button
            onClick={() => handleExportReport("All Jobs")}
            className="flex items-center gap-2 px-4 py-2.5 bg-cyan-100 hover:bg-cyan-200 text-cyan-700 font-semibold rounded-lg transition-colors border border-cyan-200"
          >
            <Download className="w-4 h-4" />
            All Jobs
          </button>
          <button
            onClick={() => handleExportReport("Open Jobs")}
            className="flex items-center gap-2 px-4 py-2.5 bg-orange-100 hover:bg-orange-200 text-orange-700 font-semibold rounded-lg transition-colors border border-orange-200"
          >
            <Download className="w-4 h-4" />
            Open Jobs
          </button>
          <button
            onClick={() => handleExportReport("Completed Jobs")}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-100 hover:bg-green-200 text-green-700 font-semibold rounded-lg transition-colors border border-green-200"
          >
            <Download className="w-4 h-4" />
            Completed Jobs
          </button>
          <button
            onClick={() => handleExportReport("Pending Jobs")}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-100 hover:bg-red-200 text-red-700 font-semibold rounded-lg transition-colors border border-red-200"
          >
            <Download className="w-4 h-4" />
            Pending Jobs
          </button>
        </div>
      </div>
    </div>
  );
}
