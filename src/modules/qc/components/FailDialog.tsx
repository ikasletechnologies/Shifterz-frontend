"use client";

import { useState } from "react";
import { X, XCircle } from "lucide-react";
import { QCJob } from "../types/qc.types";

interface FailDialogProps {
  job: QCJob | null;
  isOpen: boolean;
  onClose: () => void;
  onFail: (notes: string) => Promise<boolean>;
}

export function FailDialog({ job, isOpen, onClose, onFail }: FailDialogProps) {
  const [notes, setNotes] = useState("");
  const [isFailing, setIsFailing] = useState(false);

  if (!isOpen || !job) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) return;
    setIsFailing(true);
    const success = await onFail(notes.trim());
    setIsFailing(false);
    if (success) { setNotes(""); onClose(); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-500" /> Fail QC — {job.vehicle}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <p className="text-sm font-semibold text-red-800">Recording QC Failure</p>
            <p className="text-xs text-red-600 mt-0.5">
              This job will move to <strong>QC Failed</strong> and require rework before it can re-enter the QC queue.
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg px-4 py-3 space-y-1 text-xs text-gray-600">
            <div className="flex justify-between"><span>Job</span><span className="font-bold text-gray-800">{job.id}</span></div>
            <div className="flex justify-between"><span>Vehicle</span><span className="font-bold text-gray-800">{job.vehicle}</span></div>
            <div className="flex justify-between"><span>Service</span><span className="font-bold text-gray-800">{job.service}</span></div>
            {job.checklist && (
              <div className="flex justify-between">
                <span>Checklist</span>
                <span className="font-bold text-red-700">
                  {job.checklist.filter((i) => i.passed).length}/{job.checklist.length} passed
                </span>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Failure Reason *
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe what failed and why..."
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none h-24"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isFailing || !notes.trim()}
              className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg flex items-center justify-center disabled:opacity-50"
            >
              {isFailing ? "Recording..." : "Confirm QC Fail"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
