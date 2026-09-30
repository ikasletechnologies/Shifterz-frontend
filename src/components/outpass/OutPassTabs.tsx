"use client";

import React, { useMemo, useState } from "react";
import {
  FileText,
  User,
  Phone,
  Clock,
  Printer,
  Edit2,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  AlertCircle,
  Briefcase,
  Receipt,
  CreditCard,
} from "lucide-react";
import { formatOutPassId } from "@/utils/outPassFormatter";
import { StatusText } from "@/components/common/StatusText";

export interface OutPass {
  id: string;
  passId?: string;
  vehicle: string;
  model: string;
  customer: string;
  phone: string;
  service: string;
  outTime: string;
  technician?: string;
  technicianName?: string;
  security?: string;
  securityName?: string;
  jobCardId?: string;
  invoiceId?: string;
  paymentStatus?: string;
  status?: string;
  issued?: boolean;
  createdBy?: string;
}

interface OutPassTabsProps {
  outPasses: OutPass[];
  onPrint: (pass: OutPass) => void;
  onDownloadExcel: (pass: OutPass) => void;
  onDownloadPdf: (pass: OutPass) => void;
  onEdit: (pass: OutPass) => void;
  onApprove: (pass: OutPass) => void;
  onReject: (pass: OutPass) => void;
}

export function OutPassTabs({
  outPasses,
  onPrint,
  onDownloadExcel,
  onDownloadPdf,
  onEdit,
  onApprove,
  onReject,
}: OutPassTabsProps) {
  const [activeTab, setActiveTab] = useState<"All" | "Pending" | "Approved" | "Rejected">("All");

  const pendingPasses = useMemo(
    () => outPasses.filter((p) => p.status !== "Approved" && p.status !== "Delivered" && p.issued !== true && p.status !== "Rejected"),
    [outPasses]
  );
  const approvedPasses = useMemo(
    () => outPasses.filter((p) => p.status === "Approved" || p.status === "Delivered" || p.issued === true),
    [outPasses]
  );
  const rejectedPasses = useMemo(
    () => outPasses.filter((p) => p.status === "Rejected"),
    [outPasses]
  );

  const displayedPasses = useMemo(() => {
    if (activeTab === "Pending") return pendingPasses;
    if (activeTab === "Approved") return approvedPasses;
    if (activeTab === "Rejected") return rejectedPasses;
    return outPasses;
  }, [activeTab, outPasses, pendingPasses, approvedPasses, rejectedPasses]);

  if (outPasses.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 shadow-xs">
        <FileText className="w-10 h-10 mx-auto text-slate-300 mb-3" />
        <p className="text-sm font-medium text-slate-700">No out passes found</p>
        <p className="text-xs text-slate-400 mt-1">Out passes appear here when paid vehicles are prepared for exit.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Category Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200/80 pb-3 flex-wrap">
        <button
          type="button"
          onClick={() => setActiveTab("All")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === "All"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <span>All Out Passes</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">{outPasses.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("Pending")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === "Pending"
              ? "bg-amber-500 text-white shadow-xs"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-200 animate-pulse" />
          <span>Pending Approval</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">{pendingPasses.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("Approved")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === "Approved"
              ? "bg-emerald-600 text-white shadow-xs"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <CheckCircle className="w-3.5 h-3.5" />
          <span>Approved / Released</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">{approvedPasses.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("Rejected")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === "Rejected"
              ? "bg-rose-600 text-white shadow-xs"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>Rejected</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">{rejectedPasses.length}</span>
        </button>
      </div>

      {/* Cards Grid */}
      {displayedPasses.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-500 text-sm">
          No out passes in this status category.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {displayedPasses.map((pass, idx) => {
            const isApproved = pass.status === "Approved" || pass.status === "Delivered" || pass.issued === true;
            const isRejected = pass.status === "Rejected";
            const isPending = !isApproved && !isRejected;

            return (
              <div
                key={pass.id}
                className="bg-white rounded-xl border border-gray-200/90 shadow-xs hover:shadow-md hover:border-yellow-400 transition-all p-4 flex flex-col justify-between gap-3"
              >
                {/* Header: Pass ID + Approval Status */}
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                      {formatOutPassId(pass.passId || pass.id, idx)}
                    </span>
                    <StatusText status={pass.status || "Pending"} />
                  </div>

                  {/* Vehicle Number & Model */}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm uppercase tracking-wider text-gray-900 bg-slate-50 border border-slate-200/90 px-2.5 py-1 rounded-md">
                        {pass.vehicle || "—"}
                      </span>
                      {pass.model && (
                        <span className="text-xs text-gray-600 font-medium truncate" title={pass.model}>
                          {pass.model}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Customer Information */}
                  <div className="pt-2 border-t border-gray-100 space-y-1 text-xs">
                    <div className="flex items-center gap-1.5 text-gray-800 font-semibold truncate">
                      <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="truncate">{pass.customer || "—"}</span>
                    </div>
                    {pass.phone && (
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>{pass.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Linked References: Job Card, Invoice, Payment */}
                  <div className="pt-2 border-t border-gray-100 space-y-1 text-xs">
                    <div className="flex items-center justify-between text-gray-600">
                      <span className="flex items-center gap-1 text-[11px] text-gray-500">
                        <Briefcase className="w-3 h-3 text-gray-400" />
                        Job Card:
                      </span>
                      <strong className="text-gray-800 text-[11px] font-mono">{pass.jobCardId || "—"}</strong>
                    </div>

                    <div className="flex items-center justify-between text-gray-600">
                      <span className="flex items-center gap-1 text-[11px] text-gray-500">
                        <Receipt className="w-3 h-3 text-gray-400" />
                        Invoice:
                      </span>
                      <strong className="text-gray-800 text-[11px] font-mono">{pass.invoiceId || "—"}</strong>
                    </div>

                    <div className="flex items-center justify-between text-gray-600 pt-0.5">
                      <span className="flex items-center gap-1 text-[11px] text-gray-500">
                        <CreditCard className="w-3 h-3 text-gray-400" />
                        Payment:
                      </span>
                      <StatusText status={pass.paymentStatus || "Unpaid"} />
                    </div>
                  </div>

                  {/* Out Time & Release Status */}
                  <div className="pt-2 border-t border-gray-100 text-[11px] text-gray-500 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      Out:{" "}
                      <strong className="text-gray-700 font-medium">
                        {pass.outTime
                          ? new Date(pass.outTime).toLocaleString("en-IN", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </strong>
                    </span>
                    <span className="font-semibold text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">
                      {isApproved ? "Ready to Release" : isPending ? "Awaiting Approval" : "Rejected"}
                    </span>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="pt-2.5 border-t border-gray-100 flex items-center justify-between gap-1.5 mt-auto">
                  <div className="flex items-center gap-1.5 flex-1">
                    {isPending ? (
                      <>
                        <button
                          type="button"
                          onClick={() => onApprove(pass)}
                          className="flex-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => onReject(pass)}
                          className="px-2.5 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onPrint(pass)}
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-gray-950 font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Print Pass
                      </button>
                    )}
                  </div>

                  {/* Secondary Icon Actions */}
                  <div className="flex items-center gap-0.5">
                    {isRejected && (
                      <button
                        type="button"
                        onClick={() => onEdit(pass)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit Out Pass"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onDownloadExcel(pass)}
                      className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                      title="Download CSV"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDownloadPdf(pass)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Download PDF"
                    >
                      <FileText className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default OutPassTabs;
