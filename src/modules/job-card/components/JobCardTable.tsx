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
                  <div>
                    <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                      <Wrench className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>Fault</span>
                    </div>
                    <p className="font-bold text-slate-900 mt-1 truncate">
                      {j.service || "—"}
                    </p>
                  </div>

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
                  <div>
                    <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                      <User className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>Customer</span>
                    </div>
                    <p className="font-bold text-slate-900 mt-1 truncate">
                      {j.customer || "—"}
                    </p>
                  </div>

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
                  <div>
                    <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                      <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>Started</span>
                    </div>
                    <p className="font-bold text-slate-900 mt-1">
                      {formatDateStr(j.startDate)}
                    </p>
                  </div>

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

              {/* Row 6: Bottom Actions */}
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
                ) : isAssigned && !needsBilling ? (
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
                ) : !isAssigned && !needsBilling ? (
                  <button
                    type="button"
                    onClick={() => onEdit(j)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-sm transition-colors shadow-xs cursor-pointer mt-4"
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

                {/* Sequential Lifecycle Actions for Ready for Billing */}
                {needsBilling && (
                  <>
                    {!matchedInv ? (
                      <button
                        type="button"
                        onClick={() => router.push("/dashboard/billing")}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs transition-colors shadow-xs cursor-pointer mt-2"
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
                        className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs transition-colors shadow-xs cursor-pointer mt-2"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Record Payment</span>
                      </button>
                    ) : hasOutPass ? (
                      <div className="w-full bg-purple-50 text-purple-700 border border-purple-200 font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs mt-2">
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
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs transition-colors shadow-xs cursor-pointer mt-2"
                      >
                        <Ticket className="w-3.5 h-3.5" />
                        <span>Generate Out Pass</span>
                      </button>
                    )}
                  </>
                )}
              </>
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

