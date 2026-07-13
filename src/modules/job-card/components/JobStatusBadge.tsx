"use client";

import { STATUS_COLORS } from "../constants/job-card.constants";

interface JobStatusBadgeProps {
  status: string;
}

export function JobStatusBadge({ status }: JobStatusBadgeProps) {
  const colorClass = STATUS_COLORS[status] || "bg-gray-100 text-gray-600";
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap ${colorClass}`}>
      {status}
    </span>
  );
}
