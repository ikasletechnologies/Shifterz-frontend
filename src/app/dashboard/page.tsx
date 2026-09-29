"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FranchiseDashboard } from "@/components/dashboard/FranchiseDashboard";
import { HQDashboard } from "@/components/dashboard/HQDashboard";
import EmployeeDashboard from "@/components/technician/EmployeeDashboard";
import BillingDashboard from "@/components/dashboard/BillingDashboard";
import { ServiceAdvisorDashboard } from "@/components/dashboard/ServiceAdvisorDashboard";

import { usePermissions } from "@/lib/permissions";

export default function DashboardPage() {
  const router = useRouter();
  const { role, permissions, isSuperAdmin, loading } = usePermissions();

  const baseRole = role;
  const allowedModules: string[] | null = isSuperAdmin ? null : permissions;

  const isHQ = baseRole === "SUPER_ADMIN" || baseRole === "HQ_USER";
  const isBilling = baseRole === "BILLING_EXECUTIVE";
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

  if (loading || !baseRole || isQualityInspector) {
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
