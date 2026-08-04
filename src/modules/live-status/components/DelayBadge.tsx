"use client";

import { DELAY_COLOR } from "../constants/live-status.constants";

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h <= 0) return `${m}m overdue`;
  return `${h}h ${m}m overdue`;
}

export function DelayBadge({ isDelayed, delayMinutes }: { isDelayed: boolean; delayMinutes?: number }) {
  if (!isDelayed) {
    return <span className="text-[10px] font-semibold text-gray-400">On Track</span>;
  }
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap ${DELAY_COLOR}`}>
      {typeof delayMinutes === "number" ? formatDuration(delayMinutes) : "Delayed"}
    </span>
  );
}
