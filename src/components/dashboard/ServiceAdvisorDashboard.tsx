"use client";

import { useState, useEffect } from "react";
import {
  Calendar, Car, FileText, Briefcase, List, CheckSquare, PhoneCall
} from "lucide-react";
import { getDashboardData } from "@/lib/api";
import { StatCard } from "./StatCard";

export function ServiceAdvisorDashboard() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const res = await getDashboardData();
        setData(res);
      } catch (err: any) {
        setError(err.message || "Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading dashboard data...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;

  const { crm, workshop, hr } = data || {};

  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          Service Advisor Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Today's Appointments" value={crm?.appointmentsToday || 0} icon={Calendar} color="blue" />
          <StatCard title="Vehicles Received" value={workshop?.carsReceivedToday || 0} icon={Car} color="orange" />
          <StatCard title="Estimates Pending" value={crm?.estimatesPending || 0} icon={FileText} color="yellow" />
          <StatCard title="Job Cards Created" value={workshop?.jobCardsCreated || workshop?.vehiclesInProgress || 0} icon={Briefcase} color="purple" />
          <StatCard title="Assigned Vehicles" value={hr?.jobsAssigned || 0} icon={List} color="blue" />
          <StatCard title="Completed Jobs" value={hr?.jobsCompleted || 0} icon={CheckSquare} color="green" />
          <StatCard title="Customer Follow-ups" value={crm?.followupsToday || 0} icon={PhoneCall} color="red" />
        </div>
      </section>
    </div>
  );
}
