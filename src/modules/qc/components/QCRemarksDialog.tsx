"use client";

import { useState } from "react";
import { X, MessageSquare, Save } from "lucide-react";
import { QCJob } from "../types/qc.types";

interface QCRemarksDialogProps {
  job: QCJob | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (notes: string) => Promise<boolean>;
}

export function QCRemarksDialog({ job, isOpen, onClose, onSave }: QCRemarksDialogProps) {
  const [notes, setNotes] = useState(job?.qcNotes || "");
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen || !job) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) return;
    setIsSaving(true);
    const success = await onSave(notes.trim());
    setIsSaving(false);
    if (success) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-500" /> QC Remarks — {job.vehicle}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Inspector Remarks
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add QC observations, defects found, measurements, or any notes for the record..."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none h-36"
            />
            <p className="text-[10px] text-gray-400 text-right">{notes.length}/2000</p>
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !notes.trim()}
              className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? "Saving..." : "Save Remarks"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
