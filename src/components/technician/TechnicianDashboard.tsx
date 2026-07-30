"use client";

import { useEffect, useState } from "react";
import { getTechnicianDashboardStats } from "@/lib/api";
import { 
  Clock, CheckCircle, Clock3, LogOut, CheckCircle2, AlertCircle, 
  Settings, CheckSquare, List, BarChart3, Bell, XCircle
} from "lucide-react";

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
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  if (!data) {
    return <div className="p-6 text-red-500">Failed to load data.</div>;
  }

  const formatTime = (isoString: string | null) => {
    if (!isoString || isoString === "--:--") return "--:--";
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return isoString;
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return isoString;
    }
  };

  const { attendance, jobsSummary, performance, notifications } = data;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Technician Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Overview of your daily metrics and jobs</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Attendance & Performance */}
        <div className="space-y-6 lg:col-span-1">
          
          {/* 1. Attendance Card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-yellow-100">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Attendance Card</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                <span className="text-sm font-semibold text-gray-600">Status</span>
                <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                  attendance?.status === "Present" ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-700"
                }`}>
                  {attendance?.status}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-center">
                  <span className="block text-xs font-semibold text-gray-500 mb-1">Check In</span>
                  <span className="text-sm font-bold text-gray-900">{formatTime(attendance?.clockIn)}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-center">
                  <span className="block text-xs font-semibold text-gray-500 mb-1">Check Out</span>
                  <span className="text-sm font-bold text-gray-900">{formatTime(attendance?.clockOut)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Today's Performance */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-yellow-100">
                <BarChart3 className="w-5 h-5 text-yellow-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Today's Performance</h2>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 border border-gray-100 rounded-xl">
                <span className="text-sm text-gray-600 font-medium">Jobs Completed</span>
                <span className="text-sm font-bold text-gray-900">{performance?.jobsCompleted ?? jobsSummary?.completedToday ?? 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 border border-gray-100 rounded-xl">
                <span className="text-sm text-gray-600 font-medium">Avg Completion Time</span>
                <span className="text-sm font-bold text-gray-900">{performance.avgCompletionTime}</span>
              </div>
              <div className="flex justify-between items-center p-3 border border-gray-100 rounded-xl">
                <span className="text-sm text-gray-600 font-medium">QC Pass Rate</span>
                <span className="text-sm font-bold text-green-600">{performance.qcPassRate}</span>
              </div>
              <div className="flex justify-between items-center p-3 border border-gray-100 rounded-xl">
                <span className="text-sm text-gray-600 font-medium">Rework Count</span>
                <span className="text-sm font-bold text-red-600">{performance.reworkCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Jobs & Notifications */}
        <div className="space-y-6 lg:col-span-2">
          
          {/* 2. My Jobs Summary */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-yellow-100">
                <List className="w-5 h-5 text-yellow-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">My Jobs Summary</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col items-center">
                <span className="text-3xl font-black text-gray-900 mb-1">{jobsSummary.totalAssigned}</span>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Assigned</span>
              </div>
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex flex-col items-center">
                <span className="text-3xl font-black text-blue-700 mb-1">{jobsSummary.inProgress}</span>
                <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">In Progress</span>
              </div>
              <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex flex-col items-center">
                <span className="text-3xl font-black text-green-700 mb-1">{jobsSummary.completedToday}</span>
                <span className="text-xs font-semibold text-green-600 uppercase tracking-wide">Completed Today</span>
              </div>
              <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 flex flex-col items-center">
                <span className="text-3xl font-black text-yellow-700 mb-1">{jobsSummary.waitingMaterial}</span>
                <span className="text-xs font-semibold text-yellow-600 uppercase tracking-wide text-center">Waiting Material</span>
              </div>
              <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 flex flex-col items-center">
                <span className="text-3xl font-black text-purple-700 mb-1">{jobsSummary.waitingCustomer}</span>
                <span className="text-xs font-semibold text-purple-600 uppercase tracking-wide text-center">Waiting Approval</span>
              </div>
              <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex flex-col items-center">
                <span className="text-3xl font-black text-orange-700 mb-1">{jobsSummary.waitingQC}</span>
                <span className="text-xs font-semibold text-orange-600 uppercase tracking-wide text-center">Waiting QC</span>
              </div>
            </div>
          </div>

          {/* 4. Notifications */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-yellow-100">
                  <Bell className="w-5 h-5 text-yellow-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Notifications</h2>
              </div>
            </div>

            <div className="space-y-3">
              {notifications.map((notif: any) => {
                let IconType = AlertCircle;
                let colorClass = "text-gray-600 bg-gray-50 border-gray-100";
                
                if (notif.type === "info") {
                  IconType = AlertCircle;
                  colorClass = "text-blue-700 bg-blue-50 border-blue-100";
                } else if (notif.type === "warning") {
                  IconType = AlertCircle;
                  colorClass = "text-orange-700 bg-orange-50 border-orange-100";
                } else if (notif.type === "error") {
                  IconType = XCircle;
                  colorClass = "text-red-700 bg-red-50 border-red-100";
                } else if (notif.type === "success") {
                  IconType = CheckCircle2;
                  colorClass = "text-green-700 bg-green-50 border-green-100";
                }

                return (
                  <div key={notif.id} className={`flex items-start gap-3 p-3 rounded-xl border ${colorClass}`}>
                    <IconType className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{notif.text}</p>
                      <p className="text-xs opacity-80 mt-1">{notif.time}</p>
                    </div>
                  </div>
                );
              })}
              {notifications.length === 0 && (
                <div className="text-center py-6 text-gray-400 text-sm">
                  No new notifications.
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
