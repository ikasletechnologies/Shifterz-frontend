"use client";

import { useState } from "react";
import { X, CheckCircle2 } from "lucide-react";
import { QCJob } from "../types/qc.types";

interface PassDialogProps {
  job: QCJob | null;
  isOpen: boolean;
  onClose: () => void;
  onPass: (notes?: string) => Promise<boolean>;
}

export function PassDialog({ job, isOpen, onClose, onPass }: PassDialogProps) {
  const [notes, setNotes] = useState("");
  const [isPassing, setIsPassing] = useState(false);

  if (!isOpen || !job) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPassing(true);
    const success = await onPass(notes || undefined);
    setIsPassing(false);
    if (success) { setNotes(""); onClose(); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" /> Pass QC — {job.vehicle}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
            <p className="text-sm font-semibold text-green-800">Confirming QC Pass</p>
            <p className="text-xs text-green-600 mt-0.5">
              This job will move to <strong>Ready For Billing</strong>. This action confirms the vehicle meets all quality standards.
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg px-4 py-3 space-y-1 text-xs text-gray-600">
            <div className="flex justify-between"><span>Job</span><span className="font-bold text-gray-800">{job.id}</span></div>
            <div className="flex justify-between"><span>Vehicle</span><span className="font-bold text-gray-800">{job.vehicle}</span></div>
            <div className="flex justify-between"><span>Service</span><span className="font-bold text-gray-800">{job.service}</span></div>
            {job.checklist && (
              <div className="flex justify-between">
                <span>Checklist</span>
                <span className="font-bold text-green-700">
                  {job.checklist.filter((i) => i.passed).length}/{job.checklist.length} passed
                </span>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Pass Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any final observations for the record..."
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none h-24"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPassing}
              className="px-4 py-2 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg flex items-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isPassing ? "Confirming..." : "✓ Confirm QC Pass"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
