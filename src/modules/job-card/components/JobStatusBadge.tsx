"use client";

import { useEffect, useState } from "react";
import { STATUS_COLORS } from "../constants/job-card.constants";

interface JobStatusBadgeProps {
  status: string;
}

export function JobStatusBadge({ status }: JobStatusBadgeProps) {
  const [userRole, setUserRole] = useState<string>("");

  useEffect(() => {
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        setUserRole(user.role || "");
      }
    } catch {
      // Ignore
    }
  }, []);

  const roleUpper = userRole.toUpperCase();
  const isSuperAdmin =
    roleUpper === "SUPER_ADMIN" ||
    roleUpper === "SUPERADMIN";
  const isBillingExecutive =
    roleUpper.includes("BILLING") ||
    roleUpper.includes("ACCOUNTANT");

  // For Billing login, hide in-progress status badges (e.g. "In Progress", "Waiting for Parts", "Pending", "Assigned", "Paused", "Rework")
  if (
    isBillingExecutive &&
    (status === "In Progress" ||
      status === "Waiting for Parts" ||
      status === "Pending" ||
      status === "Assigned" ||
      status === "Paused" ||
      status === "Rework")
  ) {
    return null;
  }

  const displayStatus =
    isSuperAdmin && status === "Assigned" ? "In Progress" : status;

  const colorClass =
    STATUS_COLORS[displayStatus] || STATUS_COLORS[status] || "bg-gray-100 text-gray-600";

  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap ${colorClass}`}>
      {displayStatus}
    </span>
  );
}
