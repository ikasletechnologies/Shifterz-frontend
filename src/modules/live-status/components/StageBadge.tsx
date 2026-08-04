"use client";

import { LiveStage } from "../types/live-status.types";
import { STAGE_COLORS } from "../constants/live-status.constants";

export function StageBadge({ stage }: { stage: LiveStage }) {
  const colorClass = STAGE_COLORS[stage] || "bg-gray-100 text-gray-600";
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap ${colorClass}`}>
      {stage}
    </span>
  );
}
