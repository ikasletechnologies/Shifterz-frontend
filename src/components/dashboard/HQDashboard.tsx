"use client";

import { useState, useEffect } from "react";
import { 
  Building2, DollarSign, Briefcase, AlertTriangle, Users,
  TrendingUp, Clock, CheckCircle2, UserCheck, Package, Flame
} from "lucide-react";
import { getHQDashboardData } from "@/lib/api";
import { StatCard } from "./StatCard";

export function HQDashboard({ allowedModules }: { allowedModules?: string[] | null }) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="space-y-10">
      {/* 1. BUSINESS SUMMARY (§16.3) */}
      <section>
        <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-blue-600" />
          Business Summary
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Franchises" value={bs.totalFranchises || 0} icon={Building2} color="blue" />
          <StatCard title="Total Employees" value={bs.totalEmployees || 0} icon={Users} color="indigo" />
          <StatCard title="Total Customers" value={bs.totalCustomers || 0} icon={UserCheck} color="purple" />
          <StatCard title="Active Job Cards" value={bs.activeJobCards || 0} icon={Briefcase} color="amber" />
        </div>
      </section>

      {/* 2. REVENUE SUMMARY (§16.3) */}
      <section className="bg-gradient-to-br from-emerald-900 via-slate-900 to-emerald-950 rounded-2xl p-6 text-white shadow-xl">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-emerald-300">
          <DollarSign className="w-6 h-6 text-emerald-400" />
          Revenue & Financial Summary
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/10">
            <p className="text-sm text-emerald-200 font-medium">Today&apos;s Revenue</p>
            <p className="text-3xl font-extrabold text-white mt-1">₹{(rev.todayRevenue || 0).toLocaleString("en-IN")}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/10">
            <p className="text-sm text-emerald-200 font-medium">Monthly Revenue</p>
            <p className="text-3xl font-extrabold text-white mt-1">₹{(rev.monthlyRevenue || 0).toLocaleString("en-IN")}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/10">
            <p className="text-sm text-amber-300 font-medium">Outstanding Payments</p>
            <p className="text-3xl font-extrabold text-amber-200 mt-1">₹{(rev.outstandingPayments || 0).toLocaleString("en-IN")}</p>
          </div>
        </div>

        <h3 className="text-sm font-semibold text-emerald-300 uppercase tracking-wider mb-4">Branch-Wise Revenue Breakdown</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {rev.branchRevenue?.map((b: { branch: string; amount: number }, idx: number) => (
            <div key={idx} className="bg-white/5 rounded-lg p-4 border border-white/10">
              <p className="text-xs text-slate-400 font-semibold uppercase">{b.branch}</p>
              <p className="text-xl font-bold text-emerald-300 mt-1">₹{b.amount.toLocaleString("en-IN")}</p>
            </div>
          ))}
          {(!rev.branchRevenue || rev.branchRevenue.length === 0) && (
            <p className="text-sm text-slate-400">No branch revenue recorded yet.</p>
          )}
        </div>
      </section>

      {/* 3. WORKSHOP & OPERATIONAL SUMMARY (§16.3) */}
      <section>
        <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-indigo-600" />
          Workshop Operations
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Vehicles In Progress" value={ws.vehiclesInProgress || 0} icon={TrendingUp} color="blue" />
          <StatCard title="QC Pending" value={ws.qcPending || 0} icon={Clock} color="amber" />
          <StatCard title="Ready For Delivery" value={ws.readyForDelivery || 0} icon={CheckCircle2} color="green" />
          <StatCard title="Delayed Vehicles" value={ws.delayedVehicles || 0} icon={AlertTriangle} color="red" />
        </div>
      </section>

      {/* 4. CRM & LEAD SUMMARY (§16.3) */}
      <section className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Flame className="w-5 h-5 text-amber-500" />
          Lead Summary & Conversion
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">New Leads</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{leads.newLeads || 0}</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Converted Leads</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{leads.convertedLeads || 0}</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pending Follow-ups</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{leads.pendingFollowups || 0}</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Lost Leads</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{leads.lostLeads || 0}</p>
          </div>
        </div>
      </section>

      {/* 5. INVENTORY OVERVIEW (§16.3) */}
      <section>
        <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Package className="w-5 h-5 text-purple-600" />
          Inventory Summary
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <StatCard title="Low Stock Alerts" value={inv.lowStock || 0} icon={AlertTriangle} color="red" />
          <StatCard title="Total Inventory Valuation" value={`₹${(inv.inventoryValuation || 0).toLocaleString("en-IN")}`} icon={Package} color="purple" />
        </div>
      </section>
    </div>
  );
}
