"use client";

import { WorkshopStats } from "../types/workshop.types";

interface MyJobsCardProps {
  stats: WorkshopStats;
}

export function MyJobsCard({ stats }: MyJobsCardProps) {
  const cards = [
    { label: "My Jobs", value: stats.myJobs, color: "bg-gray-50 border-gray-200", textColor: "text-gray-900" },
    { label: "Pending", value: stats.pending, color: "bg-yellow-50 border-yellow-100", textColor: "text-yellow-700" },
    { label: "In Progress", value: stats.inProgress, color: "bg-blue-50 border-blue-100", textColor: "text-blue-700" },
    { label: "Completed Today", value: stats.completedToday, color: "bg-green-50 border-green-100", textColor: "text-green-700" },
    { label: "Sent to QC", value: stats.sentToQC, color: "bg-purple-50 border-purple-100", textColor: "text-purple-700" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map(({ label, value, color, textColor }) => (
        <div key={label} className={`rounded-xl border p-4 flex flex-col justify-between h-24 ${color}`}>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
          <span className={`text-2xl font-black ${textColor}`}>{value}</span>
        </div>
      ))}
    </div>
  );
}
