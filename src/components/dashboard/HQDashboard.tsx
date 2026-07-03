"use client";

import { useState, useEffect } from "react";
import { 
  Building2, DollarSign, Briefcase, AlertTriangle, Users
} from "lucide-react";
import { getHQDashboardData } from "@/lib/api";
import { StatCard } from "./StatCard";

export function HQDashboard() {
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

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading HQ overview...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;

  return (
    <div className="space-y-10">
      
      <section>
        <h2 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Global Operations Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Active Franchises" value={data?.totalFranchises || 0} icon={Users} color="blue" />
          <StatCard title="Global Revenue" value={`₹${(data?.globalRevenue || 0).toLocaleString("en-IN")}`} icon={DollarSign} color="green" />
          <StatCard title="Total Jobs Completed" value={data?.totalJobs || 0} icon={Briefcase} color="purple" />
          <StatCard title="Global Stock Shortages" value={data?.globalLowStock || 0} icon={AlertTriangle} color="red" />
        </div>
      </section>

      <section className="bg-blue-50 border border-blue-100 rounded-xl p-6">
        <h2 className="text-xl font-bold text-blue-900 mb-6 flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Franchise Performance Breakdown
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {data?.franchiseRevenue?.map((f: any, idx: number) => (
            <div key={`${f.location}-${idx}`} className="bg-white rounded-lg p-5 border border-blue-200 shadow-sm">
              <p className="font-semibold text-gray-900 mb-1">{f.location}</p>
              <p className="text-sm text-gray-500 mb-3">{f.jobs}</p>
              <p className="text-2xl font-bold text-blue-700">{f.revenue}</p>
            </div>
          ))}
          {(!data?.franchiseRevenue || data.franchiseRevenue.length === 0) && (
            <p className="text-gray-500">No franchise revenue data available.</p>
          )}
        </div>
      </section>
    </div>
  );
}
