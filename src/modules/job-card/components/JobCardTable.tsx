"use client";

import { useEffect, useState, useCallback } from "react";
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
  CreditCard,
  Ticket,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { JobCard } from "../types/job-card.types";
import { JobStatusBadge } from "./JobStatusBadge";
import { READY_FOR_BILLING_STATUSES } from "../constants/job-card.constants";
import { QC_QUICK_DECIDE_STATUSES } from "../lib/qcQuickDecide";
import { getInvoices, getOutPasses, createPayment, createOutPass } from "@/lib/api";
import RecordPaymentDialog from "@/modules/payment/components/RecordPaymentDialog";
import NewOutPassDialog from "@/components/outpass/NewOutPassDialog";

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
  isInspectionPending?: (job: JobCard) => boolean;
  onInspect?: (job: JobCard) => void;
  onAssignQC?: (job: JobCard) => void;
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

  const [invoices, setInvoices] = useState<any[]>([]);
  const [outPasses, setOutPasses] = useState<any[]>([]);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<any>(null);
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [isNewOutPassOpen, setIsNewOutPassOpen] = useState(false);
  const [outPassContext, setOutPassContext] = useState<any>(null);

  const fetchBillingAndOutPasses = useCallback(async () => {
    try {
      const [invData, opData] = await Promise.all([
        getInvoices().catch(() => []),
        getOutPasses().catch(() => []),
      ]);
      setInvoices(invData || []);
      setOutPasses(opData || []);
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    fetchBillingAndOutPasses();
  }, [fetchBillingAndOutPasses]);

  useEffect(() => {
    try {
      const u = localStorage.getItem("user");
      if (u) setUserRole((JSON.parse(u).role || "").toUpperCase().replace(/[\s_]+/g, "_"));
    } catch {
      // Ignore
    }
  }, []);

  const isSuperAdmin = userRole === "SUPER_ADMIN" || userRole === "SUPERADMIN";

  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast.success(`Copied Job ID: ${id}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOutPassSubmit = async (formData: any) => {
    if (!outPassContext) return;
    try {
      await createOutPass({
        ...formData,
        jobCardId: outPassContext.id,
        invoiceId: outPassContext.invoice?.id || outPassContext.inv?.id,
      });
      toast.success(`Out pass generated for ${outPassContext.vehicle || "vehicle"}`);
      setIsNewOutPassOpen(false);
      setOutPassContext(null);
      await fetchBillingAndOutPasses();
    } catch (err: any) {
      toast.error("Failed to generate out pass: " + (err.message || "Error"));
    }
  };

  const handlePaymentSubmit = async (paymentData: any) => {
    if (!selectedInvoiceForPayment) return;
    try {
      const invId = selectedInvoiceForPayment.id;
      const totalAmount = (selectedInvoiceForPayment.amount || 0) + (selectedInvoiceForPayment.gst || 0) - (selectedInvoiceForPayment.discount || 0);
      const paidAmount = Number(paymentData.amount) || 0;
      const currentPaid = selectedInvoiceForPayment.paidAmount || 0;
      const isFullyPaid = (currentPaid + paidAmount) >= totalAmount;

      await createPayment({
        invoiceId: invId,
        client: selectedInvoiceForPayment.client || "Walk-in Customer",
        phone: selectedInvoiceForPayment.phone || "",
        vehicle: selectedInvoiceForPayment.vehicle || "",
        amount: paidAmount,
        mode: paymentData.mode || "Cash",
        date: paymentData.date || new Date().toISOString().split("T")[0],
        ref: paymentData.ref || paymentData.reference || invId,
        notes: paymentData.notes || "",
      });

      toast.success(isFullyPaid ? "Payment completed! Next step: Generate Out Pass" : "Payment recorded successfully!");
      setIsRecordPaymentOpen(false);
      const invToUse = selectedInvoiceForPayment;
      setSelectedInvoiceForPayment(null);
      await fetchBillingAndOutPasses();

      if (isFullyPaid) {
        const matchedJob = jobCards.find(j => 
          j.id === invToUse.jobId || 
          (j.vehicle && invToUse.vehicle && j.vehicle.replace(/[^A-Z0-9]/g, "").toUpperCase() === invToUse.vehicle.replace(/[^A-Z0-9]/g, "").toUpperCase())
        );
        setOutPassContext(matchedJob ? { ...matchedJob, invoice: invToUse } : { vehicle: invToUse.vehicle, customer: invToUse.client, phone: invToUse.phone, invoice: invToUse });
        setIsNewOutPassOpen(true);
      }
    } catch (err: any) {
      toast.error("Failed to record payment: " + (err.message || "Error"));
    }
  };

  if (jobCards.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500 bg-white rounded-2xl border border-gray-100 shadow-xs font-medium">
        No job cards found
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
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

          const normVeh = (j.vehicle || "").replace(/[^A-Z0-9]/g, "").toUpperCase();
          const matchedInv = invoices
            .filter(i => i.status !== "Cancelled" && (
              (i.jobId && i.jobId === j.id) ||
              (i.vehicle && normVeh && i.vehicle.replace(/[^A-Z0-9]/g, "").toUpperCase() === normVeh)
            ))
            .sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime())[0] || null;

          const hasOutPass = outPasses.some(op => {
            if ((op.status || "").toLowerCase() === "rejected") return false;
            if (matchedInv?.id && op.invoiceId === matchedInv.id) return true;
            if (op.jobCardId && op.jobCardId === j.id) return true;
            if (normVeh && op.vehicle && op.vehicle.replace(/[^A-Z0-9]/g, "").toUpperCase() === normVeh) return true;
            return false;
          });

          return (
            <div
              key={j.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-lg hover:border-slate-300 transition-all duration-200 p-5 flex flex-col justify-between space-y-4 relative group"
            >
              <div className="space-y-4">
                {/* Header: Job ID (Left) + Status & Priority Badges + Actions (Right) */}
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      type="button"
                      onClick={(e) => handleCopyId(j.id, e)}
                      className="font-mono font-black text-sm text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2.5 py-1 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                      title="Click to copy Job ID"
                    >
                      <span>{j.id}</span>
                      {copiedId === j.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-400" />}
                    </button>

                    <JobStatusBadge status={j.status} />
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {Boolean(j.priority && j.priority.trim() !== "") && (
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                          isHighPriority
                            ? "bg-red-50 text-red-600 border-red-200"
                            : j.priority === "Normal"
                            ? "bg-blue-50 text-blue-600 border-blue-200"
                            : "bg-slate-50 text-slate-600 border-slate-200"
                        }`}
                      >
                        {j.priority}
                      </span>
                    )}

                    {onView && (
                      <button
                        type="button"
                        onClick={() => onView(j)}
                        className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition-colors cursor-pointer"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Vehicle Banner Pill */}
                <div className="bg-slate-50/90 border border-slate-200/80 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-blue-100/80 text-blue-600 rounded-lg shrink-0">
                      <Car className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Vehicle Number</span>
                      <span className="text-sm font-bold text-slate-900 uppercase font-mono tracking-wider">
                        {j.vehicle || "—"}
                      </span>
                    </div>
                  </div>
                  {j.carInId && (
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-200/60 px-2 py-0.5 rounded-md">
                      Checked In
                    </span>
                  )}
                </div>

                {/* Details Grid (2 Columns) */}
                <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                  {/* Service / Fault */}
                  <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-1.5 text-slate-400 font-medium mb-1">
                      <Wrench className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-[10px] uppercase tracking-wider font-bold">Service / Fault</span>
                    </div>
                    <p className="font-bold text-slate-900 truncate" title={j.service}>
                      {j.service || "—"}
                    </p>
                  </div>

                  {/* Technician */}
                  <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-1.5 text-slate-400 font-medium mb-1">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-[10px] uppercase tracking-wider font-bold">Technician</span>
                    </div>
                    {isAssigned ? (
                      <span className="inline-flex items-center bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs px-2 py-0.5 rounded-full font-semibold max-w-full truncate">
                        <span className="truncate">{j.technician}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center bg-amber-50 text-amber-800 border border-amber-200 text-xs px-2 py-0.5 rounded-full font-semibold">
                        Unassigned
                      </span>
                    )}
                  </div>

                  {/* Customer */}
                  <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-1.5 text-slate-400 font-medium mb-1">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-[10px] uppercase tracking-wider font-bold">Customer</span>
                    </div>
                    <p className="font-bold text-slate-900 truncate" title={j.customer}>
                      {j.customer || "—"}
                    </p>
                  </div>

                  {/* Mobile */}
                  <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-1.5 text-slate-400 font-medium mb-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-[10px] uppercase tracking-wider font-bold">Mobile</span>
                    </div>
                    {j.phone || j.customerPhone ? (
                      <a
                        href={`tel:${j.phone || j.customerPhone}`}
                        className="font-bold text-blue-600 hover:underline font-mono tracking-wider truncate block"
                      >
                        {j.phone || j.customerPhone}
                      </a>
                    ) : (
                      <span className="font-bold text-slate-400">—</span>
                    )}
                  </div>

                  {/* Started */}
                  <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-1.5 text-slate-400 font-medium mb-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-[10px] uppercase tracking-wider font-bold">Started</span>
                    </div>
                    <p className="font-semibold text-slate-800">
                      {formatDateStr(j.startDate)}
                    </p>
                  </div>

                  {/* Estimation */}
                  <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-1.5 text-slate-400 font-medium mb-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-[10px] uppercase tracking-wider font-bold">Est. Completion</span>
                    </div>
                    <p className="font-semibold text-slate-800">
                      {formatDateStr(j.estCompletion || j.actualCompletion)}
                    </p>
                  </div>
                </div>

                {/* Notes (if present) */}
                {j.notes && j.notes.trim() !== "" && (
                  <div className="bg-slate-50/80 border border-slate-100 p-2.5 rounded-xl text-xs text-slate-600 flex items-start gap-2">
                    <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <p className="line-clamp-2 italic font-medium">{j.notes}</p>
                  </div>
                )}
              </div>

              {/* Action Footer */}
              <div className="pt-2">
                {isAssigned && needsQCAssignment ? (
                  <button
                    type="button"
                    onClick={() => onAssignQC && onAssignQC(j)}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs transition-colors shadow-xs cursor-pointer"
                    title="Assign a QC Inspector for this completed job"
                  >
                    <ClipboardCheck className="w-4 h-4" />
                    <span>Assign QC</span>
                  </button>
                ) : isAssigned && !needsBilling ? (
                  <div className="bg-emerald-50/80 border border-emerald-100 rounded-xl p-2.5 flex items-center gap-2.5">
                    <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg shrink-0">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider truncate">
                        {hasQCInspector ? `QC: ${j.qcInspector}` : "Assigned On"}
                      </p>
                      <p className="text-xs font-bold text-emerald-950 truncate">
                        {formatDateTimeStr(j.startDate)}
                      </p>
                    </div>
                  </div>
                ) : inspectionPending ? (
                  <button
                    type="button"
                    onClick={() => onInspect && onInspect(j)}
                    className="w-full bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs transition-colors shadow-xs cursor-pointer"
                    title="Vehicle inspection must be completed before a technician can be assigned"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Complete Inspection</span>
                  </button>
                ) : !isAssigned && !needsBilling ? (
                  <button
                    type="button"
                    onClick={() => onEdit(j)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs transition-colors shadow-xs cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Assign Job</span>
                  </button>
                ) : null}

                {canQuickDecideQC && (
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => onQuickPass && onQuickPass(j)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 text-xs transition-colors cursor-pointer"
                    >
                      <ClipboardCheck className="w-3.5 h-3.5" />
                      Pass QC
                    </button>
                    <button
                      type="button"
                      onClick={() => onQuickFail && onQuickFail(j)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 text-xs transition-colors cursor-pointer"
                    >
                      <XIcon className="w-3.5 h-3.5" />
                      Fail QC
                    </button>
                  </div>
                )}

                {/* Sequential Lifecycle Actions for Ready for Billing */}
                {needsBilling && (
                  <>
                    {!matchedInv ? (
                      <button
                        type="button"
                        onClick={() => router.push("/dashboard/billing")}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs transition-colors shadow-xs cursor-pointer"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>Go to Billing</span>
                      </button>
                    ) : matchedInv.status !== "Paid" && matchedInv.status !== "Completed" ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedInvoiceForPayment(matchedInv);
                          setIsRecordPaymentOpen(true);
                        }}
                        className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs transition-colors shadow-xs cursor-pointer"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Record Payment</span>
                      </button>
                    ) : hasOutPass ? (
                      <div className="w-full bg-purple-50 text-purple-700 border border-purple-200 font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs">
                        <Ticket className="w-3.5 h-3.5" />
                        <span>Out Pass Generated</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setOutPassContext({ ...j, invoice: matchedInv });
                          setIsNewOutPassOpen(true);
                        }}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs transition-colors shadow-xs cursor-pointer"
                      >
                        <Ticket className="w-3.5 h-3.5" />
                        <span>Generate Out Pass</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <RecordPaymentDialog
        isOpen={isRecordPaymentOpen}
        onClose={() => {
          setIsRecordPaymentOpen(false);
          setSelectedInvoiceForPayment(null);
        }}
        onSubmit={handlePaymentSubmit}
        invoiceData={selectedInvoiceForPayment || undefined}
      />

      <NewOutPassDialog
        isOpen={isNewOutPassOpen}
        onClose={() => {
          setIsNewOutPassOpen(false);
          setOutPassContext(null);
        }}
        onSubmit={handleOutPassSubmit}
        initialData={
          outPassContext
            ? {
                vehicle: outPassContext.vehicle || "",
                model: outPassContext.model || "",
                customer: outPassContext.customer || outPassContext.client || "",
                phone: outPassContext.phone || "",
                service: outPassContext.service || "",
                technician: outPassContext.technician || "",
              }
            : null
        }
        isPrefillOnly
      />
    </>
  );
}

