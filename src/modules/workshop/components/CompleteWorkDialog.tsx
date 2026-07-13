"use client";

import { useState } from "react";
import { X, CheckCircle2 } from "lucide-react";
import { WorkshopJob } from "../types/workshop.types";

interface CompleteWorkDialogProps {
  job: WorkshopJob | null;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: { notes?: string; actualCompletion?: string }) => Promise<boolean>;
}

export function CompleteWorkDialog({ job, isOpen, onClose, onComplete }: CompleteWorkDialogProps) {
  const [notes, setNotes] = useState("");
  const [actualCompletion, setActualCompletion] = useState(new Date().toISOString().slice(0, 10));
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen || !job) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const success = await onComplete({ notes, actualCompletion });
    setIsSaving(false);
    if (success) { setNotes(""); onClose(); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" /> Complete Work — {job.vehicle}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-sm text-gray-600 bg-yellow-50 border border-yellow-100 rounded-lg px-4 py-3">
            ⚠️ Marking as complete will allow this job to be sent to QC. Ensure all work is done before proceeding.
          </p>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Completion Date</label>
            <input
              type="date"
              value={actualCompletion}
              onChange={(e) => setActualCompletion(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Final Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Final observations, quality check notes..."
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none h-28"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg flex items-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSaving ? "Completing..." : "Mark as Complete"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
