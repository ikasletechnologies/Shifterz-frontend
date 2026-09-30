"use client";

import React, { useMemo, useState } from "react";
import {
  Car,
  User,
  Phone,
  Clock,
  Wrench,
  AlertTriangle,
  Eye,
  Edit,
  Printer,
  Calendar,
  CheckCircle2,
  Hourglass,
  SlidersHorizontal,
} from "lucide-react";
import { LiveVehicleRecord, LiveStage } from "../types/live-status.types";
import { PriorityBadge } from "@/modules/job-card/components/PriorityBadge";
import { StatusText } from "@/components/common/StatusText";

interface LiveStatusTabsProps {
  records: LiveVehicleRecord[];
  onOpenJobCard: (record: LiveVehicleRecord) => void;
  onEditJobCard: (record: LiveVehicleRecord) => void;
  onPrintJobCard: (record: LiveVehicleRecord) => void;
}

interface StageCategory {
  id: string;
  label: string;
  tone: "blue" | "amber" | "purple" | "indigo" | "emerald" | "slate";
  stages: LiveStage[];
}

const STAGE_CATEGORIES: StageCategory[] = [
  {
    id: "assigned",
    label: "Work Assigned",
    tone: "blue",
    stages: ["Work Assigned", "Job Card Created"],
  },
  {
    id: "in_progress",
    label: "In Progress",
    tone: "amber",
    stages: ["Work In Progress"],
  },
  {
    id: "waiting",
    label: "Waiting for Parts",
    tone: "purple",
    stages: ["Waiting for Materials"],
  },
  {
    id: "qc",
    label: "Quality Check (QC)",
    tone: "indigo",
    stages: ["Quality Check"],
  },
  {
    id: "delivery",
    label: "Ready for Delivery / Completed",
    tone: "emerald",
    stages: ["Ready for Delivery", "Outpass Generated", "Billing", "Payment Pending", "Estimate Approved"],
  },
  {
    id: "other",
    label: "Check-In / Intake",
    tone: "slate",
    stages: ["Vehicle Check-In", "Estimate Pending", "Unmapped"],
  },
];

export function LiveStatusTabs({
  records,
  onOpenJobCard,
  onEditJobCard,
  onPrintJobCard,
}: LiveStatusTabsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categoryGroups = useMemo(() => {
    return STAGE_CATEGORIES.map((cat) => {
      const items = records.filter((r) => cat.stages.includes(r.stage));
      return {
        ...cat,
        items,
      };
    });
  }, [records]);

  const displayedGroups = useMemo(() => {
    if (selectedCategory === "all") return categoryGroups.filter((g) => g.items.length > 0);
    return categoryGroups.filter((g) => g.id === selectedCategory);
  }, [selectedCategory, categoryGroups]);

  if (records.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 shadow-xs">
        <Car className="w-10 h-10 mx-auto text-slate-300 mb-3" />
        <p className="text-sm font-medium text-slate-700">No vehicles in workshop</p>
        <p className="text-xs text-slate-400 mt-1">Checked-in vehicles and active jobs will display on this live board.</p>
      </div>
    );
  }

  const getToneDot = (tone: string) => {
    switch (tone) {
      case "blue": return "bg-blue-500";
      case "amber": return "bg-amber-500";
      case "purple": return "bg-purple-500";
      case "indigo": return "bg-indigo-500";
      case "emerald": return "bg-emerald-500";
      default: return "bg-slate-400";
    }
  };

  return (
    <div className="space-y-8">
      {/* Category Pills Header */}
      <div className="flex items-center gap-2 border-b border-gray-200/80 pb-3 overflow-x-auto">
        <button
          type="button"
          onClick={() => setSelectedCategory("all")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            selectedCategory === "all"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <span>All Workshop Vehicles</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">{records.length}</span>
        </button>

        {categoryGroups.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === cat.id
                ? "bg-yellow-400 text-gray-900 shadow-xs font-bold"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${getToneDot(cat.tone)}`} />
            <span>{cat.label}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-gray-200 text-gray-800">
              {cat.items.length}
            </span>
          </button>
        ))}
      </div>

      {/* Group Sections */}
      {displayedGroups.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-500 text-sm">
          No vehicles in this operational stage.
        </div>
      ) : (
        displayedGroups.map((group) => (
          <div key={group.id} className="space-y-3.5">
            {/* Stage Title */}
            <div className="flex items-center justify-between gap-3 pb-2 border-b border-gray-200/80">
              <div className="flex items-center gap-2.5">
                <span className={`w-2.5 h-2.5 rounded-full ${getToneDot(group.tone)}`} />
                <h3 className="text-sm sm:text-base font-bold text-gray-900">{group.label}</h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
                  {group.items.length}
                </span>
              </div>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {group.items.map((r) => {
                const vehicleNo = r.vehicle || "—";

                return (
                  <div
                    key={r.id}
                    className="bg-white rounded-xl border border-gray-200/90 shadow-xs hover:shadow-md hover:border-yellow-400 transition-all p-4 flex flex-col justify-between gap-3"
                  >
                    {/* Header: Vehicle + Stage Badge */}
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-sm uppercase tracking-wider text-gray-900 bg-slate-50 border border-slate-200/90 px-2.5 py-1 rounded-md">
                          {vehicleNo}
                        </span>
                        <div className="flex items-center gap-1">
                          {r.priority && <PriorityBadge priority={r.priority} />}
                          <StatusText status={r.stage} />
                        </div>
                      </div>

                      {/* Job Card # & Service */}
                      {r.jobCardId && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500 font-medium">Job Card:</span>
                          <span className="font-mono font-bold text-gray-800 bg-gray-50 px-2 py-0.5 rounded border border-gray-200/60">
                            {r.jobCardId}
                          </span>
                        </div>
                      )}

                      {/* Customer Information */}
                      <div className="pt-2 border-t border-gray-100 space-y-1 text-xs">
                        <div className="flex items-center gap-1.5 text-gray-800 font-semibold truncate">
                          <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="truncate">{r.customer || "—"}</span>
                        </div>
                        {r.phone && (
                          <div className="flex items-center gap-1.5 text-gray-500">
                            <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span>{r.phone}</span>
                          </div>
                        )}
                      </div>

                      {/* Technician */}
                      <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                        <span className="text-gray-500 text-[11px] font-medium flex items-center gap-1">
                          <Wrench className="w-3.5 h-3.5 text-gray-400" />
                          Technician:
                        </span>
                        {r.technician ? (
                          <span className="font-medium text-gray-800 bg-gray-50 px-2 py-0.5 rounded border border-gray-200/60 truncate max-w-[130px]" title={r.technician}>
                            {r.technician}
                          </span>
                        ) : (
                          <span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60 text-[11px]">
                            Unassigned
                          </span>
                        )}
                      </div>

                      {/* Timing & Delay Status */}
                      <div className="pt-2 border-t border-gray-100 space-y-1 text-[11px] text-gray-500">
                        {r.checkInTime && (
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-gray-400" />
                              Checked-in:
                            </span>
                            <strong className="text-gray-700 font-medium">
                              {new Date(r.checkInTime).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}{" "}
                              {new Date(r.checkInTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                            </strong>
                          </div>
                        )}

                        {r.eta && (
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-gray-400" />
                              Expected ETA:
                            </span>
                            <strong className="text-gray-700 font-medium">{r.eta}</strong>
                          </div>
                        )}

                        {r.isDelayed && (
                          <div className="pt-1 flex items-center gap-1 text-rose-600 font-semibold text-[11px]">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Delayed by {r.delayMinutes ? `${r.delayMinutes}m` : "schedule"}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="pt-2.5 border-t border-gray-100 flex items-center justify-between gap-1.5 mt-auto">
                      <button
                        type="button"
                        onClick={() => onOpenJobCard(r)}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-yellow-400 hover:border-yellow-400 hover:text-gray-950 text-gray-800 font-semibold text-xs shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Job</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onEditJobCard(r)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit Job"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onPrintJobCard(r)}
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                        title="Print Job Card"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default LiveStatusTabs;
