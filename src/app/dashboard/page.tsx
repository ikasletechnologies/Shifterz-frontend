"use client";

import { useState, useEffect } from "react";
import { FranchiseDashboard } from "@/components/dashboard/FranchiseDashboard";
import { HQDashboard } from "@/components/dashboard/HQDashboard";
import EmployeeDashboard from "@/components/technician/EmployeeDashboard";

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

  const isHQ = userRole === "SUPER_ADMIN" || userRole === "HQ_USER";
  const isFranchiseAdmin = userRole === "FRANCHISE_ADMIN" || userRole === "BRANCH_MANAGER";

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {isHQ ? <HQDashboard /> : isFranchiseAdmin ? <FranchiseDashboard /> : <EmployeeDashboard />}
    </div>
  );
}
