"use client";

import { useEffect, useState } from "react";
import {
  Car,
  Wrench,
  User,
  Phone,
  Calendar,
  FileText,
  Flag,
  Copy,
  Check,
  UserPlus,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { JobCard } from "../types/job-card.types";

interface JobCardTableProps {
  jobCards: JobCard[];
  onView?: (job: JobCard) => void;
  onEdit: (job: JobCard) => void;
  onDelete: (id: string) => void;
}

function formatDateStr(input?: string): string {
  if (!input) return "—";
  const d = new Date(input);
  if (isNaN(d.getTime())) return input;
  const day = d.getDate().toString().padStart(2, "0");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

function formatDateTimeStr(input?: string): string {
  if (!input) return "—";
  const d = new Date(input);
  if (isNaN(d.getTime())) return input;
  const day = d.getDate().toString().padStart(2, "0");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  const hours24 = d.getHours();
  const hours12 = hours24 % 12 || 12;
  const minutes = d.getMinutes().toString().padStart(2, "0");
  const ampm = hours24 >= 12 ? "PM" : "AM";
  return `${day} ${month} ${year}, ${hours12.toString().padStart(2, "0")}:${minutes} ${ampm}`;
}

export function JobCardTable({ jobCards, onView, onEdit, onDelete }: JobCardTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("");

  useEffect(() => {
    try {
      const u = localStorage.getItem("user");
      if (u) setUserRole((JSON.parse(u).role || "").toUpperCase());
    } catch {
      // Ignore
    }
  }, []);

  const isBillingExecutive = userRole.includes("BILLING") || userRole.includes("ACCOUNTANT");

  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast.success(`Copied Job ID: ${id}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (jobCards.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500 bg-white rounded-2xl border border-gray-100 shadow-xs font-medium">
        No job cards found
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {jobCards.map((j) => {
        const isAssigned = Boolean(
          j.technician &&
            j.technician.trim() !== "" &&
            j.technician.toLowerCase() !== "unassigned" &&
            j.technician.toLowerCase() !== "none"
        );

        const isHighPriority = j.priority === "High";

        return (
          <div
            key={j.id}
            className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4 relative"
          >
            <div>
              {/* Header: Job ID (Left) & Actions + Priority Badge (Right) */}
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-slate-900 tracking-tight font-mono">
                    {j.id}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  {/* Action Icon - View Only */}
                  {onView && (
                    <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-100">
                      <button
                        type="button"
                        onClick={() => onView(j)}
                        className="p-1 hover:bg-slate-200/60 rounded text-slate-600 transition-colors cursor-pointer"
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Priority Badge - Only displayed when explicitly selected */}
                  {Boolean(j.priority && j.priority.trim() !== "") && (
                    <div
                      className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 border ${
                        isHighPriority
                          ? "bg-red-50 text-red-600 border-red-100"
                          : j.priority === "Normal"
                          ? "bg-blue-50 text-blue-600 border-blue-100"
                          : "bg-slate-50 text-slate-600 border-slate-100"
                      }`}
                    >
                      <span>{j.priority}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Row 1: Vehicle No */}
              <div className="flex items-center gap-3 py-1">
                <Car className="w-6 h-6 text-blue-600 shrink-0" />
                <div>
                  <p className="text-xs text-slate-400 font-medium">Vehicle No</p>
                  <p className="text-sm font-bold text-slate-900 uppercase font-mono tracking-wider">
                    {j.vehicle}
                  </p>
                </div>
              </div>

              <div className="border-b border-slate-100 my-3.5" />

              {/* Row 2: Fault & Assigned (2 Columns) */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                {/* Fault */}
                <div>
                  <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                    <Wrench className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Fault</span>
                  </div>
                  <p className="font-bold text-slate-900 mt-1 truncate">
                    {j.service || "Full Body PPF"}
                  </p>
                </div>

                {/* Assigned */}
                <div>
                  <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                    <User className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Assigned</span>
                  </div>
                  <div className="mt-1">
                    {isAssigned ? (
                      <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-100 text-xs px-2.5 py-0.5 rounded-full font-semibold max-w-full truncate">
                        <User className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span className="truncate">{j.technician}</span>
                      </span>
                    ) : (
                      <span className="inline-block bg-red-50 text-red-500 border border-red-100 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                        Unassigned
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-b border-slate-100 my-3.5" />

              {/* Row 3: Customer & Mobile (2 Columns) */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                {/* Customer */}
                <div>
                  <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                    <User className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Customer</span>
                  </div>
                  <p className="font-bold text-slate-900 mt-1 truncate">
                    {j.customer || "Ram"}
                  </p>
                </div>

                {/* Mobile */}
                <div>
                  <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Mobile</span>
                  </div>
                  <p className="font-bold text-blue-600 mt-1 font-mono tracking-wider">
                    {j.phone || j.customerPhone || "8825972129"}
                  </p>
                </div>
              </div>

              <div className="border-b border-slate-100 my-3.5" />

              {/* Row 4: Started & Estimation (2 Columns) */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                {/* Started */}
                <div>
                  <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                    <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Started</span>
                  </div>
                  <p className="font-bold text-slate-900 mt-1">
                    {formatDateStr(j.startDate)}
                  </p>
                </div>

                {/* Estimation */}
                <div>
                  <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                    <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Estimation</span>
                  </div>
                  <p className="font-bold text-slate-900 mt-1">
                    {formatDateStr(j.estCompletion || j.actualCompletion)}
                  </p>
                </div>
              </div>

              <div className="border-b border-slate-100 my-3.5" />

              {/* Row 5: Notes */}
              <div>
                <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
                  <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Notes</span>
                </div>
                <p className="text-xs text-slate-700 font-medium mt-1 leading-relaxed line-clamp-2">
                  {j.notes && j.notes.trim() !== "" ? j.notes : "Scratch on left door and bumper repaint."}
                </p>
              </div>
            </div>

            {/* Row 6: Bottom Container (Before vs After Assignment) */}
            {isAssigned ? (
              <div className="bg-emerald-50/80 border border-emerald-100 rounded-xl p-3 flex items-center gap-3 mt-4">
                <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Assigned On</p>
                  <p className="text-xs font-bold text-emerald-950">
                    {formatDateTimeStr(j.startDate)}
                  </p>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onEdit(j)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-sm transition-colors shadow-xs cursor-pointer mt-4"
              >
                <UserPlus className="w-4 h-4" />
                <span>Assign Job</span>
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
