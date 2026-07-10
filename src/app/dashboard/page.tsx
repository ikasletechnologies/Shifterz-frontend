"use client";

import { useState, useEffect } from "react";
import { FranchiseDashboard } from "@/components/dashboard/FranchiseDashboard";
import { HQDashboard } from "@/components/dashboard/HQDashboard";
import EmployeeDashboard from "@/components/technician/EmployeeDashboard";

export default function DashboardPage() {
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

  if (!userRole) {
    return <div className="p-8 text-center text-gray-500">Loading dashboard layout...</div>;
  }

  // Parse custom role serialization
  let baseRole = userRole;
  let allowedModules: string[] | null = userPermissions;
  
  // Fallback for legacy database rows without permissions column:
  if (!allowedModules && baseRole.includes("|")) {
    const parts = baseRole.split("|");
    baseRole = parts[0];
    allowedModules = parts[1].split(",").filter(Boolean);
  }

  const isHQ = baseRole === "SUPER_ADMIN" || baseRole === "HQ_USER";
  
  // Default permissions fallback matrix
  const defaultPermissions: Record<string, string[]> = {
    SUPER_ADMIN: ["dashboard", "carin", "jobs", "outpass", "leads", "customers", "billing", "payments", "inventory", "reports", "employees", "attendance", "settings", "roles"],
    HQ_USER: ["dashboard", "carin", "jobs", "outpass", "leads", "customers", "billing", "payments", "inventory", "reports", "employees", "attendance", "settings"],
    FRANCHISE_ADMIN: ["dashboard", "carin", "jobs", "outpass", "leads", "customers", "billing", "payments", "inventory", "reports", "employees", "attendance"],
    BRANCH_MANAGER: ["dashboard", "carin", "jobs", "outpass", "leads", "customers", "billing", "payments", "inventory", "reports", "attendance"],
    RECEPTION_EXECUTIVE: ["dashboard", "carin", "outpass", "customers", "leads"],
    SERVICE_ADVISOR: ["dashboard", "carin", "jobs", "customers", "leads"],
    TECHNICIAN: ["dashboard", "jobs", "attendance"],
    QUALITY_INSPECTOR: ["dashboard", "jobs", "carin"],
    BILLING_EXECUTIVE: ["dashboard", "billing", "payments", "reports"],
    INVENTORY_EXECUTIVE: ["dashboard", "inventory", "reports"],
  };

  const effectivePermissions = allowedModules || defaultPermissions[baseRole] || [];

  const hasBusinessModules = 
    effectivePermissions.includes("leads") ||
    effectivePermissions.includes("customers") ||
    effectivePermissions.includes("billing") ||
    effectivePermissions.includes("payments") ||
    effectivePermissions.includes("inventory") ||
    effectivePermissions.includes("reports") ||
    effectivePermissions.includes("employees") ||
    effectivePermissions.includes("settings");

  const onlyJobsDashboard = !hasBusinessModules && effectivePermissions.includes("jobs");

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {isHQ ? (
        <HQDashboard allowedModules={allowedModules} />
      ) : onlyJobsDashboard ? (
        <EmployeeDashboard />
      ) : (
        <FranchiseDashboard allowedModules={allowedModules} />
      )}
    </div>
  );
}
