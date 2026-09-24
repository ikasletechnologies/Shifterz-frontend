"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getTechnicianDashboardStats } from "@/lib/api";
import { 
  Clock, CheckCircle2, AlertCircle, 
  Bell, XCircle, Briefcase, Package, TrendingUp, Info, ArrowRight
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";

export default function TechnicianDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const stats = await getTechnicianDashboardStats();
        setData(stats);
      } catch (err) {
        console.error("Failed to fetch dashboard stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-red-500 font-medium bg-red-50 rounded-2xl border border-red-200">
        Failed to load technician dashboard data.
      </div>
    );
  }

  const formatTime = (isoString: string | null) => {
    if (!isoString || isoString === "--:--" || isoString === "Not Checked In") return "--:--";
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return isoString;
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoString;
    }
  };

  const { attendance, jobsSummary, performance, notifications } = data;

  return (
    <div className="space-y-10 p-6 max-w-7xl mx-auto">
      {/* 1. MY JOBS SUMMARY (Matching HQDashboard StatCard System) */}
      <section>
        <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-yellow-500" />
          <span>My Jobs Summary</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          <StatCard
            title="Total Assigned"
            value={jobsSummary?.totalAssigned || 0}
            icon={Briefcase}
            color="blue"
          />
          <StatCard
            title="In Progress"
            value={jobsSummary?.inProgress || 0}
            icon={Clock}
            color="yellow"
          />
          <StatCard
            title="Completed Today"
            value={jobsSummary?.completedToday || 0}
            icon={CheckCircle2}
            color="green"
          />
          <StatCard
            title="Waiting Material"
            value={jobsSummary?.waitingMaterial || 0}
            icon={Package}
            color="purple"
          />
          <StatCard
            title="Waiting QC"
            value={jobsSummary?.waitingQC || 0}
            icon={AlertCircle}
            color="orange"
          />
        </div>
      </section>

      {/* 2. ATTENDANCE & PERFORMANCE + NOTIFICATIONS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Attendance & Performance (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Attendance Card */}
          <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-500" />
                <span>Attendance Status</span>
              </h3>
              <div className="flex items-center gap-2.5">
                <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                  attendance?.status === "Present" 
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                    : "bg-slate-100 text-slate-600 border border-slate-200"
                }`}>
                  {attendance?.status || "Not Checked In"}
                </span>
                <Link 
                  href="/technician/attendance"
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors cursor-pointer"
                >
                  <span>Attendance</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-center">
                <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Check In</span>
                <span className="text-xl font-black text-slate-900">{formatTime(attendance?.clockIn)}</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-center">
                <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Check Out</span>
                <span className="text-xl font-black text-slate-900">{formatTime(attendance?.clockOut)}</span>
              </div>
            </div>

            <Link 
              href="/technician/attendance" 
              className="mt-4 flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold text-amber-800 bg-amber-50/80 hover:bg-amber-100 border border-amber-200/80 rounded-xl transition-all shadow-2xs hover:shadow-xs group"
            >
              <span>Go to Attendance & Check In/Out</span>
              <ArrowRight className="w-4 h-4 text-amber-600 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </section>

          {/* Today's Performance Card */}
          <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs">
            <div className="pb-4 border-b border-gray-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-yellow-500" />
                <span>Today&apos;s Performance</span>
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Jobs Completed</p>
                <p className="text-2xl font-black text-slate-900 mt-1">
                  {performance?.jobsCompleted ?? jobsSummary?.completedToday ?? 0}
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Avg Completion Time</p>
                <p className="text-2xl font-black text-slate-900 mt-1">
                  {performance?.avgCompletionTime || "0.0 hrs"}
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">QC Pass Rate</p>
                <p className="text-2xl font-black text-emerald-600 mt-1">
                  {performance?.qcPassRate || "100%"}
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rework Count</p>
                <p className="text-2xl font-black text-red-600 mt-1">
                  {performance?.reworkCount ?? 0}
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Notifications (6 cols) */}
        <div className="lg:col-span-6">
          <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Bell className="w-5 h-5 text-yellow-500" />
                <span>Recent Notifications</span>
              </h3>
              {notifications && notifications.length > 0 && (
                <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-200">
                  {notifications.length} New
                </span>
              )}
            </div>

            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {notifications && notifications.map((notif: any) => {
                let IconType = Info;
                let badgeClass = "bg-blue-50 text-blue-600 border-blue-200";
                
                if (notif.type === "warning") {
                  IconType = AlertCircle;
                  badgeClass = "bg-amber-50 text-amber-600 border-amber-200";
                } else if (notif.type === "error") {
                  IconType = XCircle;
                  badgeClass = "bg-red-50 text-red-600 border-red-200";
                } else if (notif.type === "success") {
                  IconType = CheckCircle2;
                  badgeClass = "bg-emerald-50 text-emerald-600 border-emerald-200";
                }

                return (
                  <div key={notif.id} className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/60 hover:bg-slate-50 transition-colors">
                    <div className={`p-2 rounded-lg border ${badgeClass} flex-shrink-0 mt-0.5`}>
                      <IconType className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 leading-relaxed">{notif.text}</p>
                      <p className="text-[11px] text-slate-400 font-mono mt-1">{notif.time}</p>
                    </div>
                  </div>
                );
              })}

              {(!notifications || notifications.length === 0) && (
                <div className="text-center py-12 text-slate-400 text-sm font-medium">
                  No new notifications.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

