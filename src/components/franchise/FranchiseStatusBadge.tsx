import React from "react";

export type FranchiseStatusType = "PENDING" | "ACTIVE" | "DEACTIVE";

export function normalizeFranchiseStatus(status?: string | null): FranchiseStatusType {
  if (!status) return "PENDING";
  const s = status.trim().toUpperCase();
  if (s === "ACTIVE") return "ACTIVE";
  if (s === "DEACTIVE" || s === "INACTIVE" || s === "DEACTIVATED") return "DEACTIVE";
  if (s === "PENDING") return "PENDING";
  return "PENDING";
}

interface FranchiseStatusBadgeProps {
  status?: string | null;
  className?: string;
}

export function FranchiseStatusBadge({ status, className = "" }: FranchiseStatusBadgeProps) {
  const normalized = normalizeFranchiseStatus(status);

  switch (normalized) {
    case "ACTIVE":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 tracking-wide ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          ACTIVE
        </span>
      );
    case "DEACTIVE":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 tracking-wide ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          DEACTIVE
        </span>
      );
    case "PENDING":
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 tracking-wide ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          PENDING
        </span>
      );
  }
}

export default FranchiseStatusBadge;
