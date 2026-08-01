"use client";

import { useState, useEffect } from "react";
import { JobCardStats } from "../types/job-card.types";

interface JobCardHeaderProps {
  stats: JobCardStats;
  onNewJobCard: () => void;
}

export function JobCardHeader({ stats, onNewJobCard }: JobCardHeaderProps) {
  const [userRole, setUserRole] = useState<string>("");

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserRole(user.role || "");
      } catch {
        // Ignore parse error
      }
    }
  }, []);

  const roleUpper = (userRole || "").toUpperCase().replace(/[\s_]+/g, "_");
  const isServiceAdvisor = roleUpper.includes("SERVICE_ADVISOR");
  const isBillingExecutive = roleUpper.includes("BILLING") || roleUpper.includes("ACCOUNTANT");

  const isSuperAdminOrQH =
    roleUpper.includes("SUPER") ||
    roleUpper.includes("QH") ||
    roleUpper.includes("QUALITY") ||
    roleUpper.includes("QC");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Job Cards</h1>
        {!isServiceAdvisor && !isBillingExecutive && (
          <button
            onClick={onNewJobCard}
            className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
          >
            + New Job Card
          </button>
        )}
      </div>

      {/* Status KPI Cards */}
      <div className={`grid ${isSuperAdminOrQH ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-2 sm:grid-cols-4"} gap-3 sm:gap-4`}>
        {/* Pending */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex flex-col justify-between h-24">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pending</span>
          <span className="text-2xl font-bold text-gray-900">{stats.pending}</span>
        </div>

        {/* Assigned */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex flex-col justify-between h-24">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Assigned</span>
          <span className="text-2xl font-bold text-gray-900">{stats.assigned}</span>
        </div>

        {/* In Progress */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex flex-col justify-between h-24">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">In Progress</span>
          <span className="text-2xl font-bold text-gray-900">{stats.inProgress}</span>
        </div>

        {/* Complete */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex flex-col justify-between h-24">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Complete</span>
          <span className="text-2xl font-bold text-green-500">{stats.completed}</span>
        </div>

        {/* Delivery (Visible only for Super Admin and QH logins) */}
        {isSuperAdminOrQH && (
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex flex-col justify-between h-24">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Delivery</span>
            <span className="text-2xl font-bold text-purple-600">{stats.delivery}</span>
          </div>
        )}

        {/* Ready for Billing (Visible only for Super Admin and QH logins) */}
        {isSuperAdminOrQH && (
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex flex-col justify-between h-24">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Ready for Billing</span>
            <span className="text-2xl font-bold text-blue-600">{stats.readyForBilling}</span>
          </div>
        )}
      </div>
    </div>
  );
}
