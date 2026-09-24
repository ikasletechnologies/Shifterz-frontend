"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { X, ClipboardList, Calendar, Clock, User, Wrench, AlertCircle, FileText, Edit, Trash2, ShieldCheck, Camera, ClipboardCheck, Receipt } from "lucide-react";
import { JobCard } from "../types/job-card.types";
import { JobStatusBadge } from "./JobStatusBadge";
import { PriorityBadge } from "./PriorityBadge";
import { CarEntry } from "@/modules/vehicle-checkin/types/vehicle-checkin.types";
import { getInspections, passQC, failQC } from "@/modules/qc/services/qc.service";
import { QCInspection } from "@/modules/qc/types/qc.types";
import { PassDialog } from "@/modules/qc/components/PassDialog";
import { FailDialog } from "@/modules/qc/components/FailDialog";
import { getInvoices } from "@/modules/billing/services/billing.service";
import { BillingDocument } from "@/modules/billing/types/billing.types";
import { toast } from "react-hot-toast";
import { READY_FOR_BILLING_STATUSES } from "../constants/job-card.constants";
import { QC_QUICK_DECIDE_STATUSES, ensureSentToQCAndChecklistSubmitted } from "../lib/qcQuickDecide";

interface ViewJobCardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  job: JobCard | null;
  onEdit?: (job: JobCard) => void;
  onDelete?: (id: string) => void;
  // The vehicle check-in record matched to this job's vehicle, if any — carries
  // the inspection details/photos recorded before the technician was assigned.
  inspectionCar?: CarEntry | null;
  // Called after a Super Admin uses the Pass QC shortcut, so the parent can
  // refetch the job list (this dialog holds its own snapshot of `job`).
  onRefresh?: () => void;
}

const INSPECTION_PHOTO_SLOTS: { key: keyof CarEntry; label: string }[] = [
  { key: "photoFront", label: "Front" },
  { key: "photoRear", label: "Rear" },
  { key: "photoLeft", label: "Left Side" },
  { key: "photoRight", label: "Right Side" },
  { key: "photoDashboard", label: "Dashboard" },
  { key: "photoOdometer", label: "Odometer" },
];

const INSPECTION_DETAIL_FIELDS: { key: keyof CarEntry; label: string }[] = [
  { key: "fuelLevel", label: "Fuel Level" },
  { key: "scratches", label: "Scratches" },
  { key: "dents", label: "Dents" },
  { key: "brokenParts", label: "Broken Parts" },
  { key: "glassDamage", label: "Glass Damage" },
  { key: "wheelDamage", label: "Wheel Damage" },
  { key: "interiorCondition", label: "Interior Condition" },
];

function resolveUploadUrl(url: string): string {
  const uploadOrigin = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");
  return url.startsWith("http") ? url : `${uploadOrigin}${url}`;
}

function normalizeVehicle(v?: string | null): string {
  return (v || "").replace(/[^A-Z0-9]/gi, "").toUpperCase();
}

const QC_RESULT_STYLES: Record<string, string> = {
  Passed: "bg-emerald-100 text-emerald-700",
  Failed: "bg-red-100 text-red-700",
  Pending: "bg-amber-100 text-amber-700",
};

const CHECKLIST_RESULT_STYLES: Record<string, string> = {
  Passed: "bg-emerald-500",
  Failed: "bg-red-500",
  Unanswered: "bg-gray-300",
};

function formatDateOnly(dateStr?: string) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
  });
}

function formatTimeOnly(dateStr?: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function ViewJobCardDialog({ isOpen, onClose, job, onEdit, onDelete, inspectionCar, onRefresh }: ViewJobCardDialogProps) {
  const router = useRouter();
  const [history, setHistory] = useState<any[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'details' | 'timeline'>('details');
  const [qcInspections, setQcInspections] = useState<QCInspection[]>([]);
  const [invoices, setInvoices] = useState<BillingDocument[]>([]);
  const [showPassDialog, setShowPassDialog] = useState(false);
  const [showFailDialog, setShowFailDialog] = useState(false);

  // Load chronological timeline history from backend
  useEffect(() => {
    if (isOpen && job?.id) {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      // Phase 0.10 — auth travels via httpOnly cookie now; credentials:
      // "include" is required for the browser to attach it cross-origin.
      fetch(`${apiBase}/jobs/${job.id}/history`, { credentials: "include" })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setHistory(data);
        })
        .catch(console.error);
    }
  }, [isOpen, job?.id]);

  // QC attempts for this job — newest first, per getInspections' contract.
  useEffect(() => {
    if (isOpen && job?.id) {
      getInspections(job.id).then(setQcInspections).catch(console.error);
    } else {
      setQcInspections([]);
    }
  }, [isOpen, job?.id]);

  // Billing has no per-vehicle/job endpoint — fetch all and match client-side by
  // vehicle number, mirroring the convention in live-status/deriveLiveStatus.ts.
  useEffect(() => {
    if (isOpen) {
      getInvoices().then(setInvoices).catch(console.error);
    } else {
      setInvoices([]);
    }
  }, [isOpen]);

  const vehicleInvoices = useMemo(() => {
    if (!job) return [];
    return invoices
      .filter(
        (inv) =>
          normalizeVehicle(inv.vehicle) === normalizeVehicle(job.vehicle) &&
          inv.status !== "Cancelled"
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [invoices, job]);

  if (!isOpen || !job) return null;

  const latestQC = qcInspections[0];
  const priorQCAttempts = qcInspections.length - 1;

  const needsBilling = READY_FOR_BILLING_STATUSES.has(job.status);

  const handleGoToBilling = () => {
    onClose();
    router.push("/dashboard/billing");
  };

  const isDelivered =
    job.status === "Completed" ||
    job.status === "Delivered" ||
    job.status === "Out";

  const handlePrint = (copy: 'workshop' | 'customer') => {
    if (!job) return;
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    // Phase 0.10 — the token is no longer passed in the URL (it would leak
    // into server access logs and browser history); the httpOnly cookie is
    // sent automatically on this top-level navigation instead.
    window.open(`${apiBase}/jobs/${job.id}/print?copy=${copy}`, "_blank");
  };

  const currentUser = (() => {
    try {
      if (typeof window !== "undefined") {
        const u = localStorage.getItem("user");
        if (u) return JSON.parse(u);
      }
    } catch {
      // Ignore
    }
    return null;
  })();

  const userRole = (currentUser?.role || "").toUpperCase().replace(/[\s_]+/g, "_");
  const isManagement = ['SUPER_ADMIN', 'HQ_USER', 'FRANCHISE_ADMIN', 'BRANCH_MANAGER'].includes(userRole);
  const isSuperAdmin = userRole === "SUPER_ADMIN" || userRole === "SUPERADMIN";
  const canDecideQC = isSuperAdmin && QC_QUICK_DECIDE_STATUSES.has(job.status);

  const handleConfirmPassQC = async (notes?: string) => {
    try {
      await ensureSentToQCAndChecklistSubmitted(job);
      await passQC(job.id, notes);
      toast.success("QC passed — job moved to Ready For Billing");
      onRefresh?.();
      onClose();
      return true;
    } catch (err: any) {
      toast.error(err.message || "Failed to pass QC");
      return false;
    }
  };

  const handleConfirmFailQC = async (notes: string) => {
    try {
      await ensureSentToQCAndChecklistSubmitted(job);
      await failQC(job.id, notes);
      toast.error("QC failed — job requires rework");
      onRefresh?.();
      onClose();
      return true;
    } catch (err: any) {
      toast.error(err.message || "Failed to record QC failure");
      return false;
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100">
          {/* Header */}
          <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-yellow-50 text-yellow-600 rounded-xl">
                <ClipboardList className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-yellow-600">{job.id}</span>
                  <JobStatusBadge status={job.status} />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mt-0.5">{job.vehicle}</h2>
              </div>
            </div>

            {/* Action Row */}
            <div className="flex items-center gap-2">


              {onEdit && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onEdit(job);
                  }}
                  className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors border border-blue-100 cursor-pointer"
                  title="Edit Job Card"
                >
                  <Edit className="w-4 h-4" />
                </button>
              )}

              {onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onDelete(job.id);
                  }}
                  className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors border border-red-100 cursor-pointer"
                  title="Delete Job Card"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 text-gray-500 cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex border-b border-gray-100 px-6">
            <button
              onClick={() => setActiveSubTab('details')}
              className={`py-3 px-4 text-sm font-semibold border-b-2 transition-colors ${activeSubTab === 'details' ? 'border-yellow-500 text-yellow-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              Details & Materials
            </button>
            <button
              onClick={() => setActiveSubTab('timeline')}
              className={`py-3 px-4 text-sm font-semibold border-b-2 transition-colors ${activeSubTab === 'timeline' ? 'border-yellow-500 text-yellow-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              Activity Timeline ({history.length})
            </button>
          </div>

          {/* Content Body */}
          <div className="p-6">
            {activeSubTab === 'details' ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Customer Details */}
                  <div className="bg-gray-50/75 p-4 rounded-xl border border-gray-100 space-y-1">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-gray-500" /> Customer Name
                    </span>
                    <p className="text-sm font-bold text-gray-900">{job.customer || "Walk-in Customer"}</p>
                  </div>

                  {/* Service Requested */}
                  <div className="bg-gray-50/75 p-4 rounded-xl border border-gray-100 space-y-1">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Wrench className="w-3.5 h-3.5 text-gray-500" /> Service Requested
                    </span>
                    <p className="text-sm font-bold text-gray-900">{job.service || "—"}</p>
                  </div>

                  {/* Technician */}
                  <div className="bg-gray-50/75 p-4 rounded-xl border border-gray-100 space-y-1">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-gray-500" /> Assigned Technician
                    </span>
                    <p className="text-sm font-bold text-gray-900">{job.technician || "Unassigned"}</p>
                  </div>

                  {/* Priority */}
                  <div className="bg-gray-50/75 p-4 rounded-xl border border-gray-100 space-y-1">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-gray-500" /> Priority Level
                    </span>
                    {job.priority ? (
                      <PriorityBadge priority={job.priority} />
                    ) : (
                      <span className="text-xs text-gray-400 font-medium">None</span>
                    )}
                  </div>

                  {/* Start Date & Time */}
                  <div className="bg-gray-50/75 p-4 rounded-xl border border-gray-100 space-y-1">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-gray-500" /> Started Date & Time
                    </span>
                    <p className="text-sm font-semibold text-gray-900">{formatDateOnly(job.startDate)}</p>
                    {formatTimeOnly(job.startDate) && (
                      <p className="text-xs text-gray-500 font-mono font-medium">{formatTimeOnly(job.startDate)}</p>
                    )}
                  </div>

                  {/* Est Completion */}
                  <div className="bg-gray-50/75 p-4 rounded-xl border border-gray-100 space-y-1">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-gray-500" /> Est. Completion
                    </span>
                    <p className="text-sm font-semibold text-gray-900">{formatDateOnly(job.estCompletion || job.actualCompletion)}</p>
                    {formatTimeOnly(job.estCompletion || job.actualCompletion) && (
                      <p className="text-xs text-gray-500 font-mono font-medium">{formatTimeOnly(job.estCompletion || job.actualCompletion)}</p>
                    )}
                  </div>
                </div>

                {/* Notes / Instructions */}
                <div className="bg-gray-50/75 p-4 rounded-xl border border-gray-100 space-y-1.5">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-gray-500" /> Notes & Instructions
                  </span>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {job.notes && job.notes.trim() ? job.notes : "No notes provided for this job card."}
                  </p>
                </div>

                {/* Technician Instructions */}
                {job.technicianInstructions && (
                  <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 space-y-1.5">
                    <span className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Wrench className="w-3.5 h-3.5" /> Technician Instructions
                    </span>
                    <p className="text-sm text-amber-900 whitespace-pre-wrap leading-relaxed">{job.technicianInstructions}</p>
                  </div>
                )}

                {/* Internal Remarks */}
                {isManagement && job.internalRemarks && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Internal Remarks (Staff Only)
                    </span>
                    <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{job.internalRemarks}</p>
                  </div>
                )}

                {/* Vehicle Inspection (from Check-In) */}
                {inspectionCar && (
                  <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 space-y-3">
                    <span className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" /> Vehicle Inspection
                    </span>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {INSPECTION_DETAIL_FIELDS.filter(({ key }) => inspectionCar[key]).map(({ key, label }) => (
                        <div key={String(key)}>
                          <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider">{label}</p>
                          <p className="text-xs font-bold text-amber-950 truncate">{inspectionCar[key] as string}</p>
                        </div>
                      ))}
                    </div>

                    {inspectionCar.remarks && (
                      <p className="text-xs text-amber-900 whitespace-pre-wrap leading-relaxed">{inspectionCar.remarks}</p>
                    )}

                    {(() => {
                      const photos = [
                        ...INSPECTION_PHOTO_SLOTS
                          .filter(({ key }) => inspectionCar[key])
                          .map(({ key, label }) => ({ url: inspectionCar[key] as string, label })),
                        ...(inspectionCar.photoDamages || []).map((url) => ({ url, label: "Damage" })),
                      ];
                      if (photos.length === 0) return null;
                      return (
                        <div>
                          <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                            <Camera className="w-3 h-3" /> Photos
                          </p>
                          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                            {photos.map(({ url, label }, idx) => (
                              <img
                                key={`${url}-${idx}`}
                                src={resolveUploadUrl(url)}
                                alt={label}
                                title={label}
                                className="w-full h-16 object-cover rounded-lg border border-amber-200"
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Technician Update — mirrors JobActionDialog's own three fields exactly
                  (Current Status / Work Notes & Progress / Vehicle Photos (Before/After)),
                  all written to job.status / job.notes / job.photos by that dialog and by
                  Workshop's uploadPhotos. checkInPhotos/workProgressPhotos/completionPhotos
                  below are never written by any current flow. Shown whenever the job has
                  been assigned, so the technician's own update is visible here as they see it. */}
                {job.technician && job.technician.trim() !== "" && job.technician.toLowerCase() !== "unassigned" && (
                  <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-3">
                    <span className="text-xs font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Wrench className="w-3.5 h-3.5" /> Technician Update — {job.technician}
                    </span>

                    <div>
                      <p className="text-[10px] font-semibold text-blue-700 uppercase tracking-wider mb-1">Current Status</p>
                      <JobStatusBadge status={job.status} />
                    </div>

                    <div>
                      <p className="text-[10px] font-semibold text-blue-700 uppercase tracking-wider mb-1">Work Notes & Progress</p>
                      <p className="text-xs text-blue-950 whitespace-pre-wrap leading-relaxed">
                        {job.notes && job.notes.trim() ? job.notes : "No work notes added yet."}
                      </p>
                    </div>

                    {job.photos && job.photos.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-blue-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                          <Camera className="w-3 h-3" /> Vehicle Photos (Before/After)
                        </p>
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                          {job.photos.map((url, idx) => (
                            <img
                              key={idx}
                              src={resolveUploadUrl(url)}
                              alt={`Technician update ${idx + 1}`}
                              className="w-full h-16 object-cover rounded-lg border border-blue-200"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* QC Check — the job's QCInspection attempts (src/modules/qc), keyed by
                  jobId === job.id (strict link, unlike billing below), plus the Service
                  Advisor's qcInspector assignment (a separate, earlier field — see
                  AssignQCDialog). Rendered once QC has started OR an inspector has been
                  assigned OR a Super Admin can use the Pass/Fail override. */}
                {(latestQC || job.qcInspector || canDecideQC) && (
                  <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100 space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-xs font-bold text-purple-800 uppercase tracking-wider flex items-center gap-1.5">
                        <ClipboardCheck className="w-3.5 h-3.5" /> QC Check
                        {latestQC && priorQCAttempts > 0 && (
                          <span className="normal-case font-medium text-purple-500">
                            (attempt {latestQC.attemptNumber}, {priorQCAttempts} prior)
                          </span>
                        )}
                      </span>
                      {latestQC && (
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${QC_RESULT_STYLES[latestQC.result] || "bg-gray-100 text-gray-600"}`}>
                          {latestQC.result}
                        </span>
                      )}
                    </div>

                    {job.qcInspector && (
                      <p className="text-xs text-purple-900">
                        <span className="font-semibold">Assigned QC Inspector:</span> {job.qcInspector}
                      </p>
                    )}

                    {latestQC && (latestQC.inspectorName || latestQC.decidedAt) && (
                      <p className="text-xs text-purple-900">
                        {latestQC.inspectorName && <span className="font-semibold">{latestQC.inspectorName}</span>}
                        {latestQC.inspectorName && latestQC.decidedAt && " · "}
                        {latestQC.decidedAt && `${formatDateOnly(latestQC.decidedAt)} ${formatTimeOnly(latestQC.decidedAt)}`}
                      </p>
                    )}

                    {latestQC && (latestQC.reason || latestQC.remarks) && (
                      <p className="text-xs text-purple-900 whitespace-pre-wrap leading-relaxed">
                        {latestQC.reason || latestQC.remarks}
                      </p>
                    )}

                    {latestQC?.checklist && latestQC.checklist.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {latestQC.checklist.map((item) => (
                          <div key={item.id} className="flex items-center gap-2 text-xs">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${CHECKLIST_RESULT_STYLES[item.result] || "bg-gray-300"}`} />
                            <span className="text-purple-900 truncate">{item.label || item.id}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {latestQC?.photos && latestQC.photos.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-purple-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                          <Camera className="w-3 h-3" /> Photos
                        </p>
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                          {latestQC.photos.map((p) => (
                            <img
                              key={p.id}
                              src={resolveUploadUrl(p.url)}
                              alt={p.category}
                              title={p.category}
                              className="w-full h-16 object-cover rounded-lg border border-purple-200"
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Super Admin override — bypasses Send to QC + the checklist and
                      records the decision directly, without needing to open
                      /dashboard/qc or click through a separate Send to QC step. */}
                    {canDecideQC && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowPassDialog(true)}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <ClipboardCheck className="w-3.5 h-3.5" />
                          Pass QC (Super Admin)
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowFailDialog(true)}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                          Fail QC (Super Admin)
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Billing — no direct jobId link is reliably populated on invoices, so
                  match by normalized vehicle number, the same convention deriveLiveStatus.ts
                  uses. Shows every non-cancelled document (Invoice/Estimate/Quotation) for
                  this vehicle, newest first, plus a way into the Billing module once QC has
                  passed the job — whether or not an invoice has been generated yet. */}
                {(vehicleInvoices.length > 0 || needsBilling) && (
                  <div className="bg-green-50/50 p-4 rounded-xl border border-green-100 space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-xs font-bold text-green-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Receipt className="w-3.5 h-3.5" /> Billing Lifecycle
                      </span>
                      {needsBilling && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={handleGoToBilling}
                            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-[11px] font-bold rounded-lg flex items-center gap-1.5 transition-colors"
                          >
                            <Receipt className="w-3 h-3" />
                            Go to Billing
                          </button>
                        </div>
                      )}
                    </div>

                    {vehicleInvoices.length === 0 && needsBilling && (
                      <p className="text-xs text-green-700">No invoice generated yet — this job is ready for billing.</p>
                    )}

                    <div className="space-y-2">
                      {vehicleInvoices.map((inv) => (
                        <div key={inv.id} className="flex items-center justify-between gap-2 bg-white/70 rounded-lg px-3 py-2 border border-green-100 flex-wrap">
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-gray-900 truncate">{inv.type} · {formatDateOnly(inv.date)}</p>
                            <p className="text-[11px] text-gray-500 font-mono truncate">{inv.id}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs font-bold text-gray-900">₹{inv.total?.toLocaleString?.("en-IN") ?? inv.total}</span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${inv.status === "Paid"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : inv.status === "Overdue"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-amber-100 text-amber-700"
                                }`}
                            >
                              {inv.status}
                            </span>
                            {inv.status !== "Paid" && inv.status !== "Completed" && (
                              <button
                                type="button"
                                onClick={() => router.push(`/dashboard/billing?action=pay&invoiceId=${inv.id}`)}
                                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold rounded flex items-center gap-1 transition-colors"
                              >
                                Record Payment
                              </button>
                            )}
                            {(inv.status === "Paid" || inv.status === "Completed") && (
                              <button
                                type="button"
                                onClick={() => router.push(`/dashboard/billing`)}
                                className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold rounded flex items-center gap-1 transition-colors"
                              >
                                Out Pass
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Segmented Photo Galleries */}
                <div className="space-y-4">
                  {job.checkInPhotos && job.checkInPhotos.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Check-in Photographs</span>
                      <div className="grid grid-cols-4 gap-2">
                        {job.checkInPhotos.map((url, idx) => (
                          <img key={idx} src={url} alt={`Check-in ${idx + 1}`} className="w-full h-20 object-cover rounded-lg border border-gray-200" />
                        ))}
                      </div>
                    </div>
                  )}

                  {job.workProgressPhotos && job.workProgressPhotos.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Work Progress Photographs</span>
                      <div className="grid grid-cols-4 gap-2">
                        {job.workProgressPhotos.map((url, idx) => (
                          <img key={idx} src={url} alt={`Progress ${idx + 1}`} className="w-full h-20 object-cover rounded-lg border border-gray-200" />
                        ))}
                      </div>
                    </div>
                  )}

                  {job.completionPhotos && job.completionPhotos.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Completion / Final Photographs</span>
                      <div className="grid grid-cols-4 gap-2">
                        {job.completionPhotos.map((url, idx) => (
                          <img key={idx} src={url} alt={`Completion ${idx + 1}`} className="w-full h-20 object-cover rounded-lg border border-gray-200" />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Chronological Timeline */
              <div className="space-y-6 max-h-[55vh] overflow-y-auto pr-2">
                {history.length === 0 ? (
                  <p className="text-center text-gray-500 py-8 text-sm">No activity logged yet.</p>
                ) : (
                  <div className="relative border-l-2 border-slate-100 ml-4 space-y-6 py-2">
                    {history.map((item, idx) => {
                      const timeStr = new Date(item.createdAt).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true
                      });
                      const dateStr = new Date(item.createdAt).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric"
                      });
                      return (
                        <div key={item.id || idx} className="relative pl-6">
                          {/* Timeline node dot */}
                          <div className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-yellow-500 border-2 border-white ring-4 ring-yellow-50" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-400">{dateStr} at {timeStr}</span>
                              <span className="text-xs bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded uppercase">{item.event}</span>
                            </div>
                            <p className="text-sm font-semibold text-gray-900 mt-1">
                              {item.payload?.newValue?.status || item.event.replace(/_/g, " ")}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Performed By: <span className="font-semibold">{item.performedBy || 'System'}</span>
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <PassDialog
        job={job}
        checklist={latestQC?.checklist}
        checklistDefinition={latestQC?.checklistDefinition}
        isOpen={showPassDialog}
        onClose={() => setShowPassDialog(false)}
        onPass={handleConfirmPassQC}
      />

      <FailDialog
        job={job}
        checklist={latestQC?.checklist}
        isOpen={showFailDialog}
        onClose={() => setShowFailDialog(false)}
        onFail={handleConfirmFailQC}
      />
    </>
  );
}
