"use client";

import { useState, useEffect } from "react";
import { FranchiseDashboard } from "@/components/dashboard/FranchiseDashboard";
import { HQDashboard } from "@/components/dashboard/HQDashboard";
import EmployeeDashboard from "@/components/technician/EmployeeDashboard";
import BillingDashboard from "@/components/dashboard/BillingDashboard";

export default function DashboardPage() {
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserRole(user.role);
      } catch (e) {
        console.error("Failed to parse user role for dashboard");
      }
    }
  }, []);

  if (!userRole) {
    return <div className="p-8 text-center text-gray-500">Loading dashboard layout...</div>;
  }

  // Parse custom role serialization
  let baseRole = userRole;
  let allowedModules: string[] | null = null;
  if (baseRole.includes("|")) {
    const parts = baseRole.split("|");
    baseRole = parts[0];
    allowedModules = parts[1].split(",").filter(Boolean);
  }

  const isHQ = baseRole === "SUPER_ADMIN" || baseRole === "HQ_USER";
  const isBilling = baseRole === "BILLING";
  const isFranchiseAdmin = baseRole === "FRANCHISE_ADMIN" || baseRole === "BRANCH_MANAGER";
  
  // Decide if they should see the detailed Technician Dashboard (assigned jobs list)
  // If the user's base role is TECHNICIAN or QUALITY_INSPECTOR, OR if their allowedModules
  // only includes "jobs" (and "dashboard"/"attendance" but no other business modules),
  // we show the jobs-focused EmployeeDashboard.
  const onlyJobsDashboard =
    baseRole === "TECHNICIAN" ||
    baseRole === "QUALITY_INSPECTOR" ||
    (allowedModules &&
      allowedModules.includes("jobs") &&
      !allowedModules.includes("carin") &&
      !allowedModules.includes("leads") &&
      !allowedModules.includes("customers") &&
      !allowedModules.includes("billing") &&
      !allowedModules.includes("inventory"));

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {isBilling ? (
        <BillingDashboard />
      ) : isHQ ? (
        <HQDashboard />
      ) : onlyJobsDashboard ? (
        <EmployeeDashboard />
      ) : (
        <FranchiseDashboard allowedModules={allowedModules} />
      )}
    </div>
  );
}
