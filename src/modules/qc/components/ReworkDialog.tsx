"use client";

import { useState } from "react";
import { X, RefreshCw, XCircle } from "lucide-react";
import { QCJob } from "../types/qc.types";
import { REWORK_REASONS } from "../constants/qc.constants";

interface ReworkDialogProps {
  job: QCJob | null;
  isOpen: boolean;
  onClose: () => void;
  onRework: (reason: string, notes?: string) => Promise<boolean>;
}

export function ReworkDialog({ job, isOpen, onClose, onRework }: ReworkDialogProps) {
  const [reason, setReason] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen || !job) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) { setError("Please select a rework reason"); return; }
    setError("");
    setIsSending(true);
    const success = await onRework(reason, notes || undefined);
    setIsSending(false);
    if (success) { setReason(""); setNotes(""); onClose(); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-orange-500" /> Send for Rework — {job.vehicle}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-3">
            <p className="text-sm font-semibold text-orange-800">Sending to Workshop for Rework</p>
            <p className="text-xs text-orange-600 mt-0.5">
              The vehicle will be returned to the workshop technician with your rework instructions.
              Once corrected, it will re-enter the QC queue.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Rework Reason *
            </label>
            <select
              value={reason}
              onChange={(e) => { setReason(e.target.value); setError(""); }}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              <option value="">Select a reason...</option>
              {REWORK_REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            {error && <p className="text-xs text-red-600">{error}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Rework Instructions (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Specify which area, defect type, or exact correction needed..."
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none h-28"
            />
          </div>

          {job.reworkCount !== undefined && job.reworkCount > 0 && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-xs text-red-700 font-medium">
                This job has been sent for rework {job.reworkCount} time(s) already.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSending || !reason}
              className="px-4 py-2 text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-lg flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4" />
              {isSending ? "Sending..." : "Send for Rework"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
