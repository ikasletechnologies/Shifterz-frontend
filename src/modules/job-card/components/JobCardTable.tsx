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
  ShieldCheck,
  ClipboardCheck,
  X as XIcon,
  Receipt,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { JobCard } from "../types/job-card.types";
import { READY_FOR_BILLING_STATUSES } from "../constants/job-card.constants";
import { QC_QUICK_DECIDE_STATUSES } from "../lib/qcQuickDecide";

// Statuses from technician-marked-Completed through the QC queue, before a
// Pass/Fail decision has been recorded — a Service Advisor should assign a
// QC Inspector to the job sometime in this window.
const QC_ASSIGNABLE_STATUSES = new Set([
  "Completed",
  "Work Completed",
  "Complete",
  "Waiting for Quality Check",
  "Waiting QC",
  "QC Pending",
  "Review for QC",
  "Inspecting",
  "In QC",
]);

interface JobCardTableProps {
  jobCards: JobCard[];
  onView?: (job: JobCard) => void;
  onEdit: (job: JobCard) => void;
  onDelete: (id: string) => void;
  // When provided, a job card whose vehicle has a matched check-in with an
  // incomplete inspection shows "Complete Inspection" instead of "Assign Job" —
  // service advisors must inspect the vehicle before a technician can be assigned.
  // Omitted (e.g. read-only KPI drill-down tables) falls back to always showing Assign Job.
  isInspectionPending?: (job: JobCard) => boolean;
  onInspect?: (job: JobCard) => void;
  // When provided, a job card whose status has reached the QC queue but has no
  // QC Inspector assigned yet shows "Assign QC" instead of the Assigned-On box.
  onAssignQC?: (job: JobCard) => void;
  // Super-Admin-only quick actions, shown in addition to (not instead of) the
  // primary status button above, so "Assign QC" and Pass/Fail can both be
  // available on the same card without opening the detail view.
  onQuickPass?: (job: JobCard) => void;
  onQuickFail?: (job: JobCard) => void;
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

export function JobCardTable({ jobCards, onView, onEdit, onDelete, isInspectionPending, onInspect, onAssignQC, onQuickPass, onQuickFail }: JobCardTableProps) {
  const router = useRouter();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("");

  useEffect(() => {
    try {
      const u = localStorage.getItem("user");
      if (u) setUserRole((JSON.parse(u).role || "").toUpperCase().replace(/[\s_]+/g, "_"));
    } catch {
      // Ignore
    }
  }, []);

  const isBillingExecutive = userRole.includes("BILLING") || userRole.includes("ACCOUNTANT");
  const isSuperAdmin = userRole === "SUPER_ADMIN" || userRole === "SUPERADMIN";

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
        const inspectionPending = !isAssigned && Boolean(isInspectionPending && isInspectionPending(j));
        const hasQCInspector = Boolean(j.qcInspector && j.qcInspector.trim() !== "");
        const needsQCAssignment =
          isAssigned && !hasQCInspector && QC_ASSIGNABLE_STATUSES.has(j.status) && Boolean(onAssignQC);
        const canQuickDecideQC =
          isSuperAdmin && Boolean(onQuickPass) && Boolean(onQuickFail) && QC_QUICK_DECIDE_STATUSES.has(j.status);
        const needsBilling = READY_FOR_BILLING_STATUSES.has(j.status);

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
                    {j.service || "—"}
                  </p>
                </div>

                {/* Assigned / Unassigned Section */}
                <div className="pl-1">
                  {isAssigned ? (
                    <>
                      <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-medium whitespace-nowrap">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="whitespace-nowrap">Assigned Technician</span>
                      </div>
                      <div className="mt-1">
                        <span className="inline-flex items-center bg-emerald-50 text-emerald-800 border border-emerald-100 text-xs px-2.5 py-0.5 rounded-full font-semibold max-w-full truncate">
                          <span className="truncate">{j.technician}</span>
                        </span>
                      </div>
                    </>
                  ) : (
                    <div>
                      <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-medium whitespace-nowrap">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="whitespace-nowrap">Unassigned Technician</span>
                      </div>
                      <p className="font-bold text-slate-900 mt-1 text-center">
                        -
                      </p>
                    </div>
                  )}
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
                    {j.customer || "—"}
                  </p>
                </div>

                {/* Mobile */}
                <div>
                  <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Mobile</span>
                  </div>
                  <p className="font-bold text-blue-600 mt-1 font-mono tracking-wider">
                    {j.phone || j.customerPhone || "—"}
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
                  {j.notes && j.notes.trim() !== "" ? j.notes : "No notes provided."}
                </p>
              </div>
            </div>

            {/* Row 6: Bottom Container (Before vs After Assignment) */}
            <>
            {isAssigned && needsQCAssignment ? (
              <button
                type="button"
                onClick={() => onAssignQC && onAssignQC(j)}
                className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-sm transition-colors shadow-xs cursor-pointer mt-4"
                title="Assign a QC Inspector for this completed job"
              >
                <ClipboardCheck className="w-4 h-4" />
                <span>Assign QC</span>
              </button>
            ) : isAssigned ? (
              <div className="bg-emerald-50/80 border border-emerald-100 rounded-xl p-3 flex items-center gap-3 mt-4">
                <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                    {hasQCInspector ? `QC: ${j.qcInspector}` : "Assigned On"}
                  </p>
                  <p className="text-xs font-bold text-emerald-950">
                    {formatDateTimeStr(j.startDate)}
                  </p>
                </div>
              </div>
            ) : inspectionPending ? (
              <button
                type="button"
                onClick={() => onInspect && onInspect(j)}
                className="w-full bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-sm transition-colors shadow-xs cursor-pointer mt-4"
                title="Vehicle inspection must be completed before a technician can be assigned"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Complete Inspection</span>
              </button>
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

            {/* Super Admin quick action — additive, alongside whichever
                primary button/box rendered above (e.g. "Assign QC" and
                Pass/Fail QC can both show at once). Pass/Fail transparently
                sends the job to QC first if it hasn't been already, so
                there's no separate "Send to QC" click needed. */}
            {canQuickDecideQC && (
              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => onQuickPass && onQuickPass(j)}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-xs transition-colors cursor-pointer"
                >
                  <ClipboardCheck className="w-3.5 h-3.5" />
                  Pass QC
                </button>
                <button
                  type="button"
                  onClick={() => onQuickFail && onQuickFail(j)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-xs transition-colors cursor-pointer"
                >
                  <XIcon className="w-3.5 h-3.5" />
                  Fail QC
                </button>
              </div>
            )}

            {/* Surfaced directly on the card (not just inside View Details) so a
                QC-passed job's next step is visible without opening the dialog. */}
            {needsBilling && (
              <button
                type="button"
                onClick={() => router.push("/dashboard/billing")}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs transition-colors shadow-xs cursor-pointer mt-2"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Go to Billing</span>
              </button>
            )}
            </>
          </div>
        );
      })}
    </div>
  );
}
