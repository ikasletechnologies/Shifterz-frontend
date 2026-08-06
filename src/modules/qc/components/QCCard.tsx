"use client";

import { QCStats } from "../types/qc.types";
import { ShieldCheck, CheckCircle2, RefreshCw, Clock } from "lucide-react";

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
      label: "Inspecting",
      value: stats.inspecting,
      icon: ShieldCheck,
      color: "bg-blue-50 border-blue-200",
      textColor: "text-blue-700",
      iconColor: "text-blue-500",
    },
    {
      label: "Ready for Billing",
      value: stats.readyForBilling,
      icon: CheckCircle2,
      color: "bg-green-50 border-green-200",
      textColor: "text-green-700",
      iconColor: "text-green-500",
    },
    {
      label: "Rework",
      value: stats.rework,
      icon: RefreshCw,
      color: "bg-rose-50 border-rose-200",
      textColor: "text-rose-700",
      iconColor: "text-rose-500",
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
