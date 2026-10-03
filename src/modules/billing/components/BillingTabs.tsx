"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  User,
  Phone,
  Car,
  Calendar,
  Wallet,
  CheckCircle,
  Eye,
  Pencil,
  Receipt,
  Clock,
  ArrowRight,
  FileCheck,
} from "lucide-react";
import { BillingDocument } from "../types/billing.types";
import { StatusText } from "@/components/common/StatusText";
import { ShareInvoiceMenu } from "./ShareInvoiceMenu";

interface BillingTabsProps {
  docs: BillingDocument[];
  hasOutPass: (doc: BillingDocument) => boolean;
  onGenerateOutPass: (doc: BillingDocument) => void;
  onMarkAsPaid: (id: string) => void;
  onPreview: (doc: BillingDocument) => void;
  onEdit: (doc: BillingDocument) => void;
  onConvertToCarIn: (doc: BillingDocument) => void;
  renderMoreMenu?: (doc: BillingDocument) => React.ReactNode;
  onLogShare?: (id: string, channel: "whatsapp" | "email") => void;
}

export function BillingTabs({
  docs,
  hasOutPass,
  onGenerateOutPass,
  onMarkAsPaid,
  onPreview,
  onEdit,
  onConvertToCarIn,
  renderMoreMenu,
  onLogShare,
}: BillingTabsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"All" | "Invoices" | "Estimates" | "Pending" | "Paid">("All");

  const invoiceDocs = useMemo(() => docs.filter((d) => d.type === "Invoice"), [docs]);
  const estimateDocs = useMemo(() => docs.filter((d) => d.type === "Estimate" || d.type === "Quotation"), [docs]);
  const pendingDocs = useMemo(() => {
    return docs.filter((d) => {
      const total = (d.amount || 0) + (d.gst || 0) - (d.discount || 0);
      const paid = d.paidAmount || 0;
      return total - paid > 0 && d.status !== "Cancelled" && d.status !== "Converted";
    });
  }, [docs]);
  const paidDocs = useMemo(() => {
    return docs.filter((d) => d.status === "Paid" || d.status === "Completed");
  }, [docs]);

  const displayedDocs = useMemo(() => {
    if (activeTab === "Invoices") return invoiceDocs;
    if (activeTab === "Estimates") return estimateDocs;
    if (activeTab === "Pending") return pendingDocs;
    if (activeTab === "Paid") return paidDocs;
    return docs;
  }, [activeTab, docs, invoiceDocs, estimateDocs, pendingDocs, paidDocs]);

  if (docs.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 shadow-xs">
        <Receipt className="w-10 h-10 mx-auto text-slate-300 mb-3" />
        <p className="text-sm font-medium text-slate-700">No billing documents found</p>
        <p className="text-xs text-slate-400 mt-1">Invoices, estimates, and quotations created in the system will appear here.</p>
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
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === "All"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
        >
          <span>All Documents</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">{docs.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("Invoices")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === "Invoices"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
        >
          <span>Invoices</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">{invoiceDocs.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("Estimates")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === "Estimates"
              ? "bg-purple-600 text-white shadow-xs"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
        >
          <span>Estimates </span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">{estimateDocs.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("Pending")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === "Pending"
              ? "bg-amber-500 text-white shadow-xs"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Pending Payment</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">{pendingDocs.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("Paid")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === "Paid"
              ? "bg-emerald-600 text-white shadow-xs"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
        >
          <CheckCircle className="w-3.5 h-3.5" />
          <span>Paid</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">{paidDocs.length}</span>
        </button>
      </div>

      {/* Cards Grid */}
      {displayedDocs.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-500 text-sm">
          No documents in this category.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {displayedDocs.map((doc) => {
            const totalAmount = (doc.amount || 0) + (doc.gst || 0) - (doc.discount || 0);
            const rawPaidAmount = doc.paidAmount || 0;
            const paidAmount = (rawPaidAmount === 0 && (doc.status === "Paid" || doc.status === "Completed"))
              ? totalAmount
              : rawPaidAmount;
            const remainingAmount = Math.max(0, totalAmount - paidAmount);

            const formattedDate = doc.date
              ? (() => {
                const d = new Date(doc.date);
                return isNaN(d.getTime()) ? doc.date : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
              })()
              : "—";

            const serviceLabel = doc.service && doc.service !== "—" && doc.service !== "-"
              ? doc.service
              : (doc.serviceCategory || (doc.items && doc.items.find((i: any) => i.desc && i.desc.trim())?.desc) || "General Service");

            const isEstimate = doc.type === "Estimate";
            const isCarInCreated = Boolean(doc.status === "Converted to Car In" || doc.jobId);
            const canConvertToCarIn = Boolean(
              isEstimate &&
              doc.client && doc.client.trim() &&
              doc.vehicle && doc.vehicle.trim() &&
              doc.status !== "Cancelled" &&
              !isCarInCreated
            );

            return (
              <div
                key={doc.id}
                className="bg-white rounded-xl border border-gray-200/90 shadow-xs hover:shadow-md hover:border-yellow-400 transition-all p-4 flex flex-col justify-between gap-3"
              >
                {/* Header: Type Badge + ID + Status */}
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                        {doc.id}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                        {doc.type}
                      </span>
                    </div>
                    <StatusText status={doc.status} />
                  </div>

                  {/* Vehicle Number & Service */}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs uppercase tracking-wider text-gray-900 bg-slate-50 border border-slate-200/80 px-2 py-0.5 rounded">
                        {doc.vehicle || "—"}
                      </span>
                      <span className="text-xs text-gray-600 font-medium truncate" title={serviceLabel}>
                        {serviceLabel}
                      </span>
                    </div>
                  </div>

                  {/* Customer Information */}
                  <div className="pt-2 border-t border-gray-100 space-y-1 text-xs">
                    <div className="flex items-center gap-1.5 text-gray-800 font-semibold truncate">
                      <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="truncate">{doc.client || "—"}</span>
                    </div>
                    {doc.phone && (
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>{doc.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Financial Breakdown */}
                  <div className="pt-2 border-t border-gray-100 bg-gray-50/60 p-2.5 rounded-lg space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 text-[11px] font-medium">Total:</span>
                      <strong className="text-gray-900 font-black text-sm">
                        ₹{totalAmount.toLocaleString("en-IN")}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-gray-600">
                      <span>Paid:</span>
                      <span className="font-semibold text-emerald-700">₹{paidAmount.toLocaleString("en-IN")}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-500">Pending:</span>
                      <span className={`font-bold ${remainingAmount > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                        ₹{remainingAmount.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="pt-1 text-[11px] text-gray-500 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      Date:
                    </span>
                    <strong className="text-gray-700 font-medium">{formattedDate}</strong>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="pt-2.5 border-t border-gray-100 flex items-center justify-between gap-1.5 mt-auto">
                  <div className="flex items-center gap-1.5 flex-1">
                    {/* Primary Button */}
                    {doc.type === "Invoice" && doc.status !== "Paid" && doc.status !== "Cancelled" ? (
                      <button
                        type="button"
                        onClick={() => onMarkAsPaid(doc.id)}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-gray-950 font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Wallet className="w-3.5 h-3.5" />
                        <span>Add Payment</span>
                      </button>
                    ) : (doc.status === "Paid" || doc.status === "Completed") && !hasOutPass(doc) ? (
                      <button
                        type="button"
                        onClick={() => onGenerateOutPass(doc)}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>Out Pass</span>
                      </button>
                    ) : isEstimate && canConvertToCarIn ? (
                      <button
                        type="button"
                        onClick={() => onConvertToCarIn(doc)}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-gray-950 font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Car className="w-3.5 h-3.5" />
                        <span>Convert to Car In</span>
                      </button>
                    ) : isEstimate && isCarInCreated ? (
                      <button
                        type="button"
                        onClick={() => router.push("/dashboard/carin")}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Car className="w-3.5 h-3.5 text-emerald-600" />
                        <span>View Car In</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onPreview(doc)}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 font-semibold text-xs shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-gray-500" />
                        <span>View</span>
                      </button>
                    )}
                  </div>

                  {/* Secondary Actions */}
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => onPreview(doc)}
                      className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                      title="Preview Document"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>

                    {doc.status !== "Converted" && doc.status !== "Cancelled" && (
                      <button
                        type="button"
                        onClick={() => onEdit(doc)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit Document"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <ShareInvoiceMenu doc={doc} onLogShare={onLogShare || (() => { })} />

                    {renderMoreMenu && renderMoreMenu(doc)}
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

export default BillingTabs;
