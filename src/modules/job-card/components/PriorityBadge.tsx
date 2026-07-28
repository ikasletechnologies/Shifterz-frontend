"use client";

import { PRIORITY_COLORS } from "../constants/job-card.constants";

interface PriorityBadgeProps {
  priority: string;
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  if (!priority || !priority.trim()) {
    return <span className="text-gray-400 font-medium text-xs">—</span>;
  }
  const colorClass = PRIORITY_COLORS[priority] || "bg-gray-100 text-gray-700";
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${colorClass}`}>
      {priority}
    </span>
  );
}
