"use client";

import { useState, useEffect, useCallback } from "react";
import { FileText, AlertCircle, CreditCard, Ticket } from "lucide-react";
import { SummaryCard } from "@/components/common/SummaryCard";
import { ListHeader } from "@/components/common/ListHeader";
import { getJobs, getInvoices, getPayments, createPayment, createOutPass, getOutPasses } from "@/lib/api";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import NewDocumentDialog from "./NewDocumentDialog";
import NewOutPassDialog from "@/components/outpass/NewOutPassDialog";
import RecordPaymentDialog from "../../payment/components/RecordPaymentDialog";
import { createInvoice } from "@/modules/billing/services/billing.service";

export default function BillingJobCards({ onInvoiceGenerated }: { onInvoiceGenerated?: () => void }) {
  const router = useRouter();
  const [jobs, setJobs] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [outPasses, setOutPasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Dialogs
  const [isNewDocOpen, setIsNewDocOpen] = useState(false);
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [isNewOutPassOpen, setIsNewOutPassOpen] = useState(false);
  const [outPassContext, setOutPassContext] = useState<any>(null);

  const [selectedContext, setSelectedContext] = useState<any>(null);

  // A job-linked invoice's GST is computed entirely from Job.services on the
  // backend (gstInvoiceResolver.service.ts) — without at least one priced
  // line item there, "Generate Invoice" is rejected outright. Catching this
  // here (and routing straight to fixing it) avoids the user repeatedly
  // hitting that same backend error with no way to tell what's missing.
  const hasBillingServices = (item: any): boolean => {
    const services = item?.services;
    if (Array.isArray(services)) return services.length > 0;
    if (typeof services === "string") {
      try {
        const parsed = JSON.parse(services);
        return Array.isArray(parsed) && parsed.length > 0;
      } catch {
        return false;
      }
    }
    return false;
  };

  const hasOutPass = (item: any): boolean => {
    if (!item) return false;
    const norm = (v?: string) => (v || "").replace(/[^A-Z0-9]/g, "").toUpperCase();
    const itemVeh = norm(item.vehicle);
    const invId = item.invoice?.id;

    return outPasses.some((op) => {
      if ((op.status || "").toLowerCase() === "rejected") return false;
      if (invId && op.invoiceId === invId) return true;
      if (op.jobCardId && item.id && op.jobCardId === item.id) return true;
      if (itemVeh && op.vehicle && norm(op.vehicle) === itemVeh) return true;
      return false;
    });
  };

  // Opens the real Out Pass form instead of calling the API directly — the
  // previous version hardcoded customerConfirmation:true with no actual user
  // confirmation, and never collected technician/security guard/remarks at
  // all, so every printed pass showed those fields permanently blank.
  const handleGenerateOutPass = (jobItem: any) => {
    setOutPassContext(jobItem);
    setIsNewOutPassOpen(true);
  };

  const handleOutPassSubmit = async (formData: any) => {
    if (!outPassContext) return;
    try {
      const inv = outPassContext.invoice;
      const newOp = await createOutPass({
        ...formData,
        jobCardId: outPassContext.id,
        invoiceId: inv?.id,
      });
      setOutPasses((prev) => [...prev, newOp || { invoiceId: inv?.id, jobCardId: outPassContext.id, vehicle: outPassContext.vehicle, status: "Pending" }]);
      toast.success(`Out pass generated for ${outPassContext.vehicle}`);
      setIsNewOutPassOpen(false);
      setOutPassContext(null);
      await loadData();
    } catch (err: any) {
      toast.error("Failed to generate out pass: " + (err.message || "Error"));
    }
  };

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [jobsData, invoicesData, outPassData] = await Promise.all([
        getJobs(),
        getInvoices(),
        getOutPasses().catch(() => [])
      ]);
      setJobs(jobsData || []);
      setInvoices(invoicesData || []);
      setOutPasses(outPassData || []);
    } catch (err) {
      console.error("Failed to load billing jobs", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Process data
  const mappedJobs = jobs
    .filter(j => ["QC Passed", "Ready For Billing"].includes(j.status))
    .map(job => {
      // Find the most recent non-cancelled invoice for this vehicle
      const invs = invoices
        .filter(i => i.vehicle === job.vehicle && i.status !== "Cancelled")
        .sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());

      const inv = invs.length > 0 ? invs[0] : null;

      let billingStatus = "Waiting Billing";
      if (inv) {
        if (inv.status === "Paid") billingStatus = "Fully Paid";
        else if (inv.status === "Pending" || inv.status === "Overdue" || inv.status === "Partially Paid") billingStatus = "Payment Pending";
        else billingStatus = "Invoice Created";
      }

      return { ...job, invoice: inv, billingStatus };
    });

  // Filter
  const displayJobs = mappedJobs.filter(j => {
    const matchStatus = statusFilter === "All" || j.billingStatus === statusFilter;
    const searchLower = searchQuery.toLowerCase();
    const matchSearch = !searchQuery ||
      j.id.toLowerCase().includes(searchLower) ||
      j.vehicle.toLowerCase().includes(searchLower) ||
      j.customer.toLowerCase().includes(searchLower) ||
      (j.invoice?.id && j.invoice.id.toLowerCase().includes(searchLower));

    return matchStatus && matchSearch;
  });

  // KPIs
  const stats = {
    waiting: mappedJobs.filter(j => j.billingStatus === "Waiting Billing").length,
    created: mappedJobs.filter(j => j.billingStatus === "Invoice Created").length,
    pending: mappedJobs.filter(j => j.billingStatus === "Payment Pending").length,
    paid: mappedJobs.filter(j => j.billingStatus === "Fully Paid").length,
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading Billing Queue...</div>;
  }

  return (
    <div className="space-y-6 pt-2">
      {/* Billing stages — each card also filters the list */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {[
          { id: "All", value: mappedJobs.length },
          { id: "Waiting Billing", value: stats.waiting },
          { id: "Invoice Created", value: stats.created },
          { id: "Payment Pending", value: stats.pending },
          { id: "Fully Paid", value: stats.paid, tone: "good" as const },
        ].map((c) => (
          <SummaryCard
            key={c.id}
            label={c.id === "All" ? "All Jobs" : c.id}
            value={c.value}
            tone={c.tone}
            active={statusFilter === c.id}
            onClick={() => setStatusFilter(c.id)}
          />
        ))}
      </div>

      <ListHeader
        title="Ready for Billing"
        filterLabel={statusFilter}
        count={displayJobs.length}
        hint="Jobs that passed QC. Create the invoice, record the payment, then generate the out pass so the vehicle can leave."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search job card, invoice, vehicle, customer..."
      />

      {/* Table */}
      {displayJobs.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-10 text-center text-sm text-slate-500">
          {searchQuery
            ? `No jobs match "${searchQuery}".`
            : statusFilter === "All"
            ? "No jobs are ready for billing. A job shows up here once it passes QC."
            : `No jobs in "${statusFilter}".`}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table w-full text-sm text-left min-w-[900px]">
              <thead className="bg-gray-50/50 border-b border-gray-100 text-[11px] text-gray-500 uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-4 py-4 whitespace-nowrap">Job Card</th>
                  <th className="px-4 py-4 whitespace-nowrap">Vehicle</th>
                  <th className="px-4 py-4 whitespace-nowrap">Customer</th>
                  <th className="px-4 py-4 whitespace-nowrap">Service</th>
                  <th className="px-4 py-4 whitespace-nowrap text-right">Bill Amount</th>
                  <th className="px-4 py-4 whitespace-nowrap">Invoice</th>
                  <th className="px-4 py-4 whitespace-nowrap">Payment</th>
                  <th className="px-4 py-4 text-right whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {displayJobs.map(j => {
                  const inv = j.invoice;

                  // Compute Action Button
                  let actionBtn = null;
                  if (!inv && !hasBillingServices(j)) {
                    actionBtn = (
                      <button
                        onClick={() => router.push(`/dashboard/jobs?edit=${encodeURIComponent(j.id)}`)}
                        title="This job has no priced services recorded — add at least one under Billing Services before an invoice can be generated"
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded shadow-sm flex items-center gap-1 transition-colors whitespace-nowrap"
                      >
                        <AlertCircle className="w-3.5 h-3.5" /> Add Billing Services
                      </button>
                    );
                  } else if (!inv) {
                    actionBtn = (
                      <button
                        onClick={() => {
                          const initialData = {
                            type: "Invoice",
                            status: "Pending",
                            client: j.customer || "",
                            phone: j.phone || j.customerPhone || "",
                            vehicle: j.vehicle || "",
                            jobId: j.id || "",
                            jobCardNo: j.id || "",
                            serviceAdvisor: j.serviceAdvisor || "",
                            technician: j.technician || "",
                            service: j.service || "",
                            // The job's own priced line items (recorded on the Job Card's
                            // Billing Services section) — lets the invoice dialog seed real
                            // rates directly instead of re-guessing one item from the
                            // free-text `service` label, which is what produced ₹0.00 rows.
                            services: j.services || [],
                          };
                          setSelectedContext(initialData);
                          setIsNewDocOpen(true);
                        }}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded shadow-sm flex items-center gap-1 transition-colors whitespace-nowrap"
                      >
                        <FileText className="w-3.5 h-3.5" /> Generate Invoice
                      </button>
                    );
                  } else if (j.billingStatus === "Payment Pending") {
                    actionBtn = (
                      <button
                        onClick={() => {
                          setSelectedContext(inv);
                          setIsRecordPaymentOpen(true);
                        }}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded shadow-sm flex items-center gap-1 transition-colors whitespace-nowrap"
                      >
                        <CreditCard className="w-3.5 h-3.5" /> Record Payment
                      </button>
                    );
                  } else if (j.billingStatus === "Fully Paid") {
                    if (hasOutPass(j)) {
                      actionBtn = (
                        <span className="px-2.5 py-1 bg-purple-50 text-purple-700 text-xs font-bold rounded border border-purple-200">
                          Outpass Generated
                        </span>
                      );
                    } else {
                      actionBtn = (
                        <button
                          onClick={() => handleGenerateOutPass(j)}
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded shadow-sm flex items-center gap-1 transition-colors whitespace-nowrap"
                        >
                          <Ticket className="w-3.5 h-3.5" /> Generate Out Pass
                        </button>
                      );
                    }
                  } else {
                    actionBtn = (
                      <button
                        onClick={() => router.push('/dashboard/billing')}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 text-xs font-bold rounded shadow-sm flex items-center gap-1 transition-colors whitespace-nowrap"
                      >
                        <FileText className="w-3.5 h-3.5" /> View Invoice
                      </button>
                    );
                  }

                  return (
                    <tr key={j.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-4 font-mono text-xs font-bold whitespace-nowrap text-blue-600">{j.id}</td>
                      <td className="px-4 py-4 font-bold text-gray-900 uppercase font-mono whitespace-nowrap">{j.vehicle}</td>
                      <td className="px-4 py-4 text-gray-600 whitespace-nowrap">{j.customer}</td>
                      <td className="px-4 py-4 text-gray-600">{j.service}</td>
                      <td className="px-4 py-4 font-bold text-gray-900 text-right whitespace-nowrap">
                        {inv ? `₹${(inv.total || (inv.amount + (inv.gst || 0) - (inv.discount || 0))).toLocaleString("en-IN")}` : "—"}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {inv ? (
                          <span className="font-mono text-xs font-bold text-gray-600">{inv.id}</span>
                        ) : (
                          <span className="text-xs font-semibold text-gray-400">Not Generated</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${j.billingStatus === 'Fully Paid' ? 'bg-green-100 text-green-700' :
                          j.billingStatus === 'Payment Pending' ? 'bg-amber-100 text-amber-700' :
                            j.billingStatus === 'Invoice Created' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-500'
                          }`}>
                          {inv ? inv.status : "Pending"}
                        </span>
                      </td>
                      <td className="px-4 py-4 flex justify-end">
                        {actionBtn}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <NewDocumentDialog
        isOpen={isNewDocOpen}
        onClose={() => {
          setIsNewDocOpen(false);
          setSelectedContext(null);
        }}
        initialData={selectedContext}
        onSubmit={async (docData) => {
          try {
            await createInvoice(docData);
            toast.success("Invoice generated successfully");
            setIsNewDocOpen(false);
            setSelectedContext(null);
            await loadData();
            if (onInvoiceGenerated) {
              onInvoiceGenerated();
            }
          } catch (err: any) {
            toast.error("Failed to generate invoice: " + err.message);
          }
        }}
        existingDocuments={invoices}
      />

      <RecordPaymentDialog
        isOpen={isRecordPaymentOpen}
        onClose={() => {
          setIsRecordPaymentOpen(false);
          setSelectedContext(null);
        }}
        onSubmit={async (paymentData) => {
          try {
            const invId = selectedContext?.invoice?.id || paymentData.invoiceId;
            if (!invId) {
              toast.error("Please generate an invoice for this vehicle before recording payment.");
              return;
            }
            const paidAmount = Number(paymentData.amount) || 0;
            await createPayment({
              invoiceId: invId,
              client: selectedContext?.invoice?.client || selectedContext?.customer || paymentData.client || "Walk-in Customer",
              phone: selectedContext?.invoice?.phone || selectedContext?.phone || paymentData.phone || "",
              vehicle: selectedContext?.vehicle || paymentData.vehicle || "",
              amount: paidAmount,
              mode: paymentData.mode || "Cash",
              date: paymentData.date || new Date().toISOString().split("T")[0],
              ref: paymentData.ref || paymentData.reference || invId,
              notes: paymentData.notes || "",
            });
            toast.success("Payment recorded successfully!");
            setIsRecordPaymentOpen(false);
            setSelectedContext(null);
            await loadData();
            if (onInvoiceGenerated) {
              onInvoiceGenerated();
            }
          } catch (err: any) {
            toast.error("Failed to record payment: " + (err.message || "Error"));
          }
        }}
        invoiceData={selectedContext?.invoice || undefined}
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
              customer: outPassContext.customer || "",
              phone: outPassContext.phone || "",
              service: outPassContext.service || "",
              technician: outPassContext.technician || "",
            }
            : null
        }
        isPrefillOnly
      />
    </div>
  );
}
