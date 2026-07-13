"use client";

import { useState } from "react";
import { X, Send } from "lucide-react";
import { WorkshopJob } from "../types/workshop.types";

interface SendToQCDialogProps {
  job: WorkshopJob | null;
  isOpen: boolean;
  onClose: () => void;
  onSend: (notes?: string) => Promise<boolean>;
}

export function SendToQCDialog({ job, isOpen, onClose, onSend }: SendToQCDialogProps) {
  const [notes, setNotes] = useState("");
  const [isSending, setIsSending] = useState(false);

  if (!isOpen || !job) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    const success = await onSend(notes);
    setIsSending(false);
    if (success) { setNotes(""); onClose(); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Send className="w-5 h-5 text-purple-500" /> Send to QC — {job.vehicle}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="bg-purple-50 border border-purple-100 rounded-lg px-4 py-3 space-y-1">
            <p className="text-sm font-semibold text-purple-800">Handover Summary</p>
            <div className="text-xs text-purple-600 space-y-0.5">
              <p>Job: <span className="font-bold">{job.id}</span></p>
              <p>Vehicle: <span className="font-bold">{job.vehicle}</span></p>
              <p>Service: <span className="font-bold">{job.service}</span></p>
              <p>Technician: <span className="font-bold">{job.technician}</span></p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Handover Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything QC should check or be aware of..."
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none h-28"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSending}
              className="px-4 py-2 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg flex items-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {isSending ? "Sending..." : "Send to QC"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
