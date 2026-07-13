"use client";

import { QCStats } from "../types/qc.types";
import { ClipboardCheck, CheckCircle2, XCircle, RefreshCw, Clock } from "lucide-react";

interface QCCardProps {
  stats: QCStats;
}

export function QCCard({ stats }: QCCardProps) {
  const cards = [
    {
      label: "Waiting QC",
      value: stats.waitingQC,
      icon: Clock,
      color: "bg-yellow-50 border-yellow-200",
      textColor: "text-yellow-700",
      iconColor: "text-yellow-500",
    },
    {
      label: "Passed Today",
      value: stats.passedToday,
      icon: CheckCircle2,
      color: "bg-green-50 border-green-200",
      textColor: "text-green-700",
      iconColor: "text-green-500",
    },
    {
      label: "Failed Today",
      value: stats.failedToday,
      icon: XCircle,
      color: "bg-red-50 border-red-200",
      textColor: "text-red-700",
      iconColor: "text-red-500",
    },
    {
      label: "Rework Pending",
      value: stats.reworkPending,
      icon: RefreshCw,
      color: "bg-orange-50 border-orange-200",
      textColor: "text-orange-700",
      iconColor: "text-orange-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(({ label, value, icon: Icon, color, textColor, iconColor }) => (
        <div key={label} className={`rounded-xl border p-5 flex items-center gap-4 ${color}`}>
          <div className={`p-2 rounded-lg bg-white/70`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
            <p className={`text-2xl font-black ${textColor}`}>{value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
