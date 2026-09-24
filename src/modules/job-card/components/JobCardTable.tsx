"use client";

import { useEffect, useState, useCallback } from "react";
import { Eye } from "lucide-react";
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

export function JobCardTable({ jobCards, onView, onEdit, onDelete, isInspectionPending, onInspect, onAssignQC, onQuickPass, onQuickFail }: JobCardTableProps) {
  const router = useRouter();
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
    toast.success(`Copied Job ID: ${id}`);
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

  const getJobMeta = (j: JobCard) => {
    const isAssigned = Boolean(
      j.technician &&
        j.technician.trim() !== "" &&
        j.technician.toLowerCase() !== "unassigned" &&
        j.technician.toLowerCase() !== "none"
    );

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

    return { isAssigned, inspectionPending, hasQCInspector, needsQCAssignment, canQuickDecideQC, needsBilling, matchedInv, hasOutPass };
  };


  // The next lifecycle action for a job, as plain text links.
  const renderActions = (j: JobCard, m: ReturnType<typeof getJobMeta>) => (
    <>
      {m.isAssigned && m.needsQCAssignment ? (
        <button type="button" onClick={() => onAssignQC && onAssignQC(j)} title="Assign a QC Inspector for this completed job">
          Assign QC
        </button>
      ) : m.inspectionPending ? (
        <button
          type="button"
          onClick={() => onInspect && onInspect(j)}
          title="Vehicle inspection must be completed before a technician can be assigned"
        >
          Complete Inspection
        </button>
      ) : !m.isAssigned && !m.needsBilling ? (
        <button type="button" onClick={() => onEdit(j)}>
          Assign Job
        </button>
      ) : null}

      {m.canQuickDecideQC && (
        <>
          <button type="button" onClick={() => onQuickPass && onQuickPass(j)}>
            Pass QC
          </button>
          <button type="button" onClick={() => onQuickFail && onQuickFail(j)}>
            Fail QC
          </button>
        </>
      )}

      {m.needsBilling &&
        (!m.matchedInv ? (
          <button type="button" onClick={() => router.push("/dashboard/billing")}>
            Go to Billing
          </button>
        ) : m.matchedInv.status !== "Paid" && m.matchedInv.status !== "Completed" ? (
          <button
            type="button"
            onClick={() => {
              setSelectedInvoiceForPayment(m.matchedInv);
              setIsRecordPaymentOpen(true);
            }}
          >
            Record Payment
          </button>
        ) : m.hasOutPass ? (
          <span className="text-slate-400">Out Pass Generated</span>
        ) : (
          <button
            type="button"
            onClick={() => {
              setOutPassContext({ ...j, invoice: m.matchedInv });
              setIsNewOutPassOpen(true);
            }}
          >
            Generate Out Pass
          </button>
        ))}
    </>
  );

  const renderRow = (j: JobCard) => {
    const m = getJobMeta(j);
    const phone = j.phone || j.customerPhone;
    const empty = <span className="text-slate-400">—</span>;

    return (
      <tr key={j.id}>
        <td className="whitespace-nowrap">
          <button type="button" onClick={(e) => handleCopyId(j.id, e)} title="Click to copy Job ID">
            {j.id}
          </button>
        </td>
        <td className="whitespace-nowrap uppercase">{j.vehicle || empty}</td>
        <td className="max-w-[180px] truncate" title={j.customer}>
          {j.customer || empty}
        </td>
        <td className="whitespace-nowrap">{phone || empty}</td>
        <td className="max-w-[180px] truncate" title={j.service}>
          {j.service || empty}
        </td>
        <td className="max-w-[160px] truncate">
          {m.isAssigned ? j.technician : <span className="text-slate-400">Unassigned</span>}
        </td>
        <td className="whitespace-nowrap">
          <JobStatusBadge status={j.status} neutral />
        </td>
        <td className="whitespace-nowrap">{j.priority && j.priority.trim() !== "" ? j.priority : empty}</td>
        <td className="whitespace-nowrap">{formatDateStr(j.startDate)}</td>
        <td className="whitespace-nowrap">{formatDateStr(j.estCompletion || j.actualCompletion)}</td>
        <td className="max-w-[200px] truncate" title={j.notes}>
          {j.notes && j.notes.trim() !== "" ? j.notes : empty}
        </td>
        <td className="whitespace-nowrap text-right">
          <div className="flex items-center justify-end gap-3">
            {renderActions(j, m)}
            {onView && (
              <button type="button" onClick={() => onView(j)} title="View Details">
                <Eye className="w-4 h-4" />
              </button>
            )}
          </div>
        </td>
      </tr>
    );
  };

  return (
    <>
      {jobCards.length === 0 ? (
        <div className="text-center py-16 text-slate-500 bg-white border border-slate-200 rounded-lg">No job cards found</div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
          <table className="data-table w-full min-w-[1300px] text-left">
            <thead>
              <tr>
                <th>Job ID</th>
                <th>Vehicle Number</th>
                <th>Customer</th>
                <th>Mobile</th>
                <th>Service / Fault</th>
                <th>Technician</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Started</th>
                <th>Est. Completion</th>
                <th>Notes</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>{jobCards.map(renderRow)}</tbody>
          </table>
        </div>
      )}

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

