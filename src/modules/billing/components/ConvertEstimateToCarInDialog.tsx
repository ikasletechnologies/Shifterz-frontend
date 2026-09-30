"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Car, CheckCircle2, AlertTriangle, Loader2, ArrowRight } from "lucide-react";
import { toast } from "react-hot-toast";
import { BillingDocument } from "../types/billing.types";
import { createVehicleCheckIn } from "@/modules/vehicle-checkin/services/vehicle-checkin.service";
import { apiCall } from "@/services/api.client";
import { normalizeVehicleNumber } from "@/utils/vehicleNumber";

interface ConvertEstimateToCarInDialogProps {
  isOpen: boolean;
  onClose: () => void;
  document: BillingDocument | null;
  onSuccess: () => void;
}

export default function ConvertEstimateToCarInDialog({
  isOpen,
  onClose,
  document,
  onSuccess,
}: ConvertEstimateToCarInDialogProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolvedModel, setResolvedModel] = useState<string>("");
  const [resolvedCustomerId, setResolvedCustomerId] = useState<string>("");

  useEffect(() => {
    if (isOpen && document?.vehicle) {
      setResolvedModel(document.model || "");
      const norm = normalizeVehicleNumber(document.vehicle);
      if (norm) {
        apiCall(`/vehicle/${norm}`)
          .then((details: any) => {
            if (details) {
              if (details.model && !document.model) setResolvedModel(details.model);
              if (details.customerId) setResolvedCustomerId(details.customerId);
            }
          })
          .catch(() => {});
      }
    } else {
      setResolvedModel("");
      setResolvedCustomerId("");
      setError(null);
      setIsSuccess(false);
    }
  }, [isOpen, document]);

  if (!isOpen || !document) return null;

  const handleClose = () => {
    setIsSuccess(false);
    setError(null);
    onClose();
  };

  const handleConvert = async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      const serviceNames = (document.items || [])
        .map((i: any) => i.desc || i.name)
        .filter(Boolean);

      const primaryService =
        document.service && document.service !== "-" && document.service.trim() !== ""
          ? document.service
          : (serviceNames.length > 0 ? serviceNames.join(", ") : "General Service");

      const notes = document.notes && document.notes.trim()
        ? `${document.notes.trim()} (Converted from Estimate ${document.id})`
        : `Converted from Estimate ${document.id}`;

      const payload = {
        vehicle: document.vehicle,
        model: resolvedModel || document.model || "Unknown",
        customer: document.client,
        phone: document.phone || "",
        service: primaryService,
        odometer: (document as any).odometer || "0",
        notes,
        inTime: new Date().toISOString(),
        estimateId: document.id,
        franchiseId: document.franchiseId || undefined,
        customerId: resolvedCustomerId || (document as any).customerId,
      };

      const result = await createVehicleCheckIn(payload);
      if (result) {
        setIsSuccess(true);
        toast.success("Vehicle successfully checked in.");
        onSuccess();
      }
    } catch (err: any) {
      console.error("Failed to convert Estimate to Car In:", err);
      const errMsg = err?.message || err?.error || "Failed to convert Estimate to Car In. Please try again.";
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewCarIn = () => {
    handleClose();
    router.push("/dashboard/carin");
  };

  const formattedDate = document.date
    ? (() => {
        const d = new Date(document.date);
        return isNaN(d.getTime())
          ? document.date
          : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
      })()
    : "—";

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {!isSuccess ? (
          <div>
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <Car className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Convert Estimate to Car In?</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Move vehicle into workshop &amp; create Job Card
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div className="flex-1 font-medium">{error}</div>
                </div>
              )}

              {/* Estimate Details Card */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 font-medium block">Customer:</span>
                    <span className="text-slate-900 font-bold text-sm truncate block">{document.client}</span>
                    {document.phone && <span className="text-slate-500 text-[11px]">{document.phone}</span>}
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium block">Vehicle:</span>
                    <span className="text-slate-900 font-bold text-sm uppercase block font-mono">
                      {document.vehicle}
                    </span>
                    {(resolvedModel || document.model) && (
                      <span className="text-slate-600 text-[11px] block">{resolvedModel || document.model}</span>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 font-medium block">Estimate:</span>
                    <span className="font-mono font-semibold text-slate-800">{document.id}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium block">Date:</span>
                    <span className="font-medium text-slate-700">{formattedDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium block">Amount:</span>
                    <span className="font-bold text-emerald-600">
                      ₹{Number(document.amount || 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {document.notes && (
                  <div className="pt-2 border-t border-slate-200/60 text-xs">
                    <span className="text-slate-500 font-medium block">Notes:</span>
                    <span className="text-slate-700 italic">{document.notes}</span>
                  </div>
                )}
              </div>

              {/* Items & Services preview */}
              {document.items && document.items.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">
                    Estimated Services &amp; Items to carry over:
                  </label>
                  <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1">
                    {document.items.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs px-3 py-2 bg-slate-100/70 rounded-lg border border-slate-200/60"
                      >
                        <span className="text-slate-800 font-medium truncate">{item.desc || item.name || "Item"}</span>
                        <span className="font-semibold text-slate-700 shrink-0 ml-2">
                          ₹{Number(item.price || item.amount || 0).toLocaleString("en-IN")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConvert}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold bg-amber-400 hover:bg-amber-500 active:bg-amber-600 text-gray-950 rounded-xl transition-all shadow-xs disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Converting...
                  </>
                ) : (
                  <>
                    <Car className="w-3.5 h-3.5" />
                    Convert to Car In
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Success Screen */
          <div className="p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center animate-in zoom-in-50 duration-200">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">Vehicle successfully checked in.</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Car In record and Job Card created for <strong className="text-slate-800 uppercase font-mono">{document.vehicle}</strong> ({document.client}).
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleViewCarIn}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all shadow-xs"
              >
                View Car In
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
