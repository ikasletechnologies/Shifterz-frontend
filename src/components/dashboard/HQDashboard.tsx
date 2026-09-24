"use client";

import { useState, useEffect } from "react";
import { getHQDashboardData } from "@/lib/api";
import { StatusTone, TONE_TEXT } from "@/lib/statusTone";
import { DashboardToolbar, PeriodOverview, rangeForPreset, DateRange } from "./DashboardInsights";

export function HQDashboard({ allowedModules }: { allowedModules?: string[] | null }) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<DateRange>(() => rangeForPreset("7d"));

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const res = await getHQDashboardData();
        setData(res);
      } catch (err: any) {
        setError(err.message || "Failed to load HQ dashboard data");
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  if (isLoading) return <div className="p-12 text-center text-gray-500 font-medium">Loading Headquarters Consolidated Dashboard...</div>;
  if (error) return <div className="p-8 text-center text-red-500 font-medium">Error: {error}</div>;

  const bs = data?.businessSummary || {};
  const rev = data?.revenueSummary || {};
  const leads = data?.leadSummary || {};
  const ws = data?.workshopSummary || {};
  const inv = data?.inventorySummary || {};

  const inr = (n?: number) => `₹${(n || 0).toLocaleString("en-IN")}`;

  return (
    <div className="space-y-6">
      {/* Date filter + quick actions, then figures and charts for the chosen period */}
      <DashboardToolbar range={range} onRangeChange={setRange} />
      <PeriodOverview range={range} />

      <h2 className="pt-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">Overall</h2>

      {/* 1. BUSINESS SUMMARY (§16.3) — headline numbers across the full width */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Metric label="Total Franchises" value={bs.totalFranchises || 0} boxed />
        <Metric label="Total Employees" value={bs.totalEmployees || 0} boxed />
        <Metric label="Total Customers" value={bs.totalCustomers || 0} boxed />
        <Metric label="Active Job Cards" value={bs.activeJobCards || 0} boxed />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* 2. REVENUE SUMMARY (§16.3) */}
        <Panel title="Revenue & Financial Summary" className="xl:col-span-7" cols="sm:grid-cols-3">
          <Metric label="Today's Revenue" value={inr(rev.todayRevenue)} />
          <Metric label="Monthly Revenue" value={inr(rev.monthlyRevenue)} />
          <Metric label="Outstanding Payments" value={inr(rev.outstandingPayments)} tone={(rev.outstandingPayments || 0) > 0 ? "bad" : "neutral"} />
        </Panel>

        {/* 5. INVENTORY OVERVIEW (§16.3) */}
        <Panel title="Inventory Summary" className="xl:col-span-5" cols="sm:grid-cols-2">
          <Metric label="Low Stock Alerts" value={inv.lowStock || 0} tone={(inv.lowStock || 0) > 0 ? "bad" : "neutral"} />
          <Metric label="Inventory Valuation" value={inr(inv.inventoryValuation)} />
        </Panel>

        {/* 3. WORKSHOP & OPERATIONAL SUMMARY (§16.3) */}
        <Panel title="Workshop Operations" className="xl:col-span-6" cols="grid-cols-2 sm:grid-cols-4">
          <Metric label="In Progress" value={ws.vehiclesInProgress || 0} />
          <Metric label="QC Pending" value={ws.qcPending || 0} />
          <Metric label="Ready For Delivery" value={ws.readyForDelivery || 0} tone={(ws.readyForDelivery || 0) > 0 ? "good" : "neutral"} />
          <Metric label="Delayed" value={ws.delayedVehicles || 0} tone={(ws.delayedVehicles || 0) > 0 ? "bad" : "neutral"} />
        </Panel>

        {/* 4. CRM & LEAD SUMMARY (§16.3) */}
        <Panel title="Lead Summary & Conversion" className="xl:col-span-6" cols="grid-cols-2 sm:grid-cols-4">
          <Metric label="New Leads" value={leads.newLeads || 0} />
          <Metric label="Converted" value={leads.convertedLeads || 0} tone={(leads.convertedLeads || 0) > 0 ? "good" : "neutral"} />
          <Metric label="Pending Follow-ups" value={leads.pendingFollowups || 0} />
          <Metric label="Lost Leads" value={leads.lostLeads || 0} tone={(leads.lostLeads || 0) > 0 ? "bad" : "neutral"} />
        </Panel>
      </div>
    </div>
  );
}

// A titled white panel whose metrics sit side by side, separated by thin dividers.
function Panel({ title, className = "", cols, children }: { title: string; className?: string; cols: string; children: React.ReactNode }) {
  return (
    <section className={`bg-white border border-slate-200 rounded-lg ${className}`}>
      <h2 className="px-5 py-3.5 text-sm font-bold text-slate-900 border-b border-slate-200">{title}</h2>
      <div className={`grid ${cols} sm:divide-x divide-slate-100`}>{children}</div>
    </section>
  );
}

function Metric({ label, value, boxed = false, tone = "neutral" }: { label: string; value: React.ReactNode; boxed?: boolean; tone?: StatusTone }) {
  return (
    <div className={boxed ? "bg-white border border-slate-200 rounded-lg px-5 py-4" : "px-5 py-4"}>
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-800">{label}</p>
      <p className={`text-2xl font-semibold mt-1.5 ${tone === "neutral" ? "text-slate-900" : TONE_TEXT[tone]}`}>{value}</p>
    </div>
  );
}
