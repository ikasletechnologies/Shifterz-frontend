"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FranchiseDashboard } from "@/components/dashboard/FranchiseDashboard";
import { HQDashboard } from "@/components/dashboard/HQDashboard";
import EmployeeDashboard from "@/components/technician/EmployeeDashboard";
import BillingDashboard from "@/components/dashboard/BillingDashboard";
import { ServiceAdvisorDashboard } from "@/components/dashboard/ServiceAdvisorDashboard";

export default function DashboardPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[] | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserRole(user.role);
        setUserPermissions(user.permissions || null);
      } catch (e) {
        console.error("Failed to parse user role for dashboard");
      }
    }
  }, []);

  // Parse custom role serialization
  let baseRole = userRole || "";
  let allowedModules: string[] | null = userPermissions;

  // Fallback for legacy database rows without permissions column:
  if (!allowedModules && baseRole.includes("|")) {
    const parts = baseRole.split("|");
    baseRole = parts[0];
    allowedModules = parts[1].split(",").filter(Boolean);
  }

  const isHQ = baseRole === "SUPER_ADMIN" || baseRole === "HQ_USER";
  const isBilling = baseRole === "BILLING" || baseRole === "BILLING_EXECUTIVE";
  const isServiceAdvisor = baseRole === "SERVICE_ADVISOR";
  const isFranchiseAdmin = baseRole === "FRANCHISE_ADMIN" || baseRole === "BRANCH_MANAGER";
  // Quality Inspectors don't get a jobs-status dashboard — their work happens
  // in the real QC Inspection module (checklist + Pass/Fail), not through a
  // plain status dropdown. Send them straight there instead of EmployeeDashboard.
  const isQualityInspector =
    baseRole === "QUALITY_INSPECTOR" ||
    baseRole === "QUALITY_INSPECTION" ||
    baseRole === "QC_INSPECTOR" ||
    baseRole === "QC" ||
    baseRole === "QUALITY_ASSURANCE";

  useEffect(() => {
    if (isQualityInspector) {
      router.replace("/dashboard/qc");
    }
  }, [isQualityInspector, router]);

  // Decide if they should see the detailed Technician Dashboard (assigned jobs list)
  // If the user's base role is TECHNICIAN, OR if their allowedModules only
  // includes "jobs" (and "dashboard"/"attendance" but no other business
  // modules), we show the jobs-focused EmployeeDashboard.
  const onlyJobsDashboard =
    baseRole === "TECHNICIAN" ||
    (allowedModules &&
      allowedModules.includes("jobs") &&
      !allowedModules.includes("carin") &&
      !allowedModules.includes("leads") &&
      !allowedModules.includes("customers") &&
      !allowedModules.includes("billing") &&
      !allowedModules.includes("inventory"));

  if (!userRole || isQualityInspector) {
    return <div className="p-8 text-center text-gray-500">Loading dashboard layout...</div>;
  }

  return (
    <div className="p-4 sm:p-6 md:p-8">
      {isHQ ? (
        <HQDashboard />
      ) : isBilling ? (
        <BillingDashboard />
      ) : isServiceAdvisor ? (
        <ServiceAdvisorDashboard />
      ) : onlyJobsDashboard ? (
        <EmployeeDashboard />
      ) : (
        <FranchiseDashboard allowedModules={allowedModules} />
      )}
    </div>
  );
}
