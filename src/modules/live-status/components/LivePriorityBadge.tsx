"use client";

import { LIVE_PRIORITY_COLORS } from "../constants/live-status.constants";

export function LivePriorityBadge({ priority }: { priority: string }) {
  if (!priority || !priority.trim()) {
    return <span className="text-gray-400 font-medium text-xs">—</span>;
  }
  const colorClass = LIVE_PRIORITY_COLORS[priority] || "bg-gray-100 text-gray-700";
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap ${colorClass}`}>
      {priority}
    </span>
  );
}
