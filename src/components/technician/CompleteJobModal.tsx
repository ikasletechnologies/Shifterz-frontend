"use client";

import { useState } from "react";
import { CheckCircle2, X, AlertTriangle, Loader2, Wrench, FileText, Package } from "lucide-react";

interface CompleteJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  job: any;
  partsUsed: Array<{
    id?: string;
    itemId?: string;
    itemName: string;
    quantity: number;
    unit?: string;
  }>;
  workNotes: string;
}

export default function CompleteJobModal({
  isOpen,
  onClose,
  onConfirm,
  job,
  partsUsed,
  workNotes,
}: CompleteJobModalProps) {
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !job) return null;

  const handleComplete = async () => {
    setSubmitting(true);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border border-slate-200">
        
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Complete Job</h2>
              <p className="text-xs text-slate-500">
                Are you sure this job is ready to be completed?
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-sm">
          
          {/* Summary Box */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 divide-y divide-slate-200/70 space-y-3">
            
            <div className="flex justify-between items-center text-xs pb-1">
              <span className="font-semibold text-slate-500">Vehicle:</span>
              <span className="font-bold text-slate-900 uppercase font-mono">{job.vehicle}</span>
            </div>

            <div className="flex justify-between items-center text-xs pt-2">
              <span className="font-semibold text-slate-500">Service:</span>
              <span className="font-medium text-slate-800 text-right max-w-[240px] truncate">{job.service}</span>
            </div>

            <div className="text-xs pt-2 space-y-1">
              <span className="font-semibold text-slate-500 flex items-center gap-1.5 mb-1.5">
                <Package className="w-3.5 h-3.5 text-slate-400" />
                <span>Parts Used:</span>
              </span>
              {partsUsed && partsUsed.length > 0 ? (
                <div className="bg-white rounded-lg p-2.5 border border-slate-200 space-y-1 max-h-28 overflow-y-auto">
                  {partsUsed.map((p, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <span className="font-medium text-slate-700 truncate pr-2">{p.itemName}</span>
                      <span className="font-mono font-bold text-slate-900 shrink-0">
                        {p.quantity} {p.unit || "units"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic pl-5">No parts required / used</p>
              )}
            </div>

            <div className="text-xs pt-2 space-y-1">
              <span className="font-semibold text-slate-500 flex items-center gap-1.5 mb-1">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>Work Notes:</span>
              </span>
              <div className="bg-white rounded-lg p-2.5 border border-slate-200 max-h-24 overflow-y-auto">
                <p className="text-xs text-slate-700 whitespace-pre-wrap">
                  {workNotes?.trim() || <span className="italic text-slate-400">No work notes entered</span>}
                </p>
              </div>
            </div>

          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Once completed, this job will move to the <strong>Completed</strong> tab and cannot be edited by the technician.
            </span>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleComplete}
            disabled={submitting}
            className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-2xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>Complete Job</span>
          </button>
        </div>

      </div>
    </div>
  );
}
