"use client";

import { X, ClipboardCheck, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { apiCall } from "@/services/api.client";
import { JobCard } from "../types/job-card.types";

interface QCInspectorOption {
  id: string;
  name: string;
}

interface AssignQCDialogProps {
  isOpen: boolean;
  onClose: () => void;
  job: JobCard | null;
  onAssign: (inspector: QCInspectorOption) => Promise<boolean>;
}

export function AssignQCDialog({ isOpen, onClose, job, onAssign }: AssignQCDialogProps) {
  const [inspectors, setInspectors] = useState<QCInspectorOption[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadInspectors = async () => {
      try {
        const emps = await apiCall("/employees");
        const list = (emps || [])
          .filter((emp: any) => {
            const r = (emp.role || "").toLowerCase();
            const isQCRole = r.includes("qc") || r.includes("quality") || r.includes("inspector") || r.includes("assurance");
            return isQCRole && emp.status === "Active";
          })
          .map((emp: any) => ({ id: emp.id, name: emp.name }));
        setInspectors(list);
      } catch (err) {
        console.error("Failed to load QC inspectors:", err);
      }
    };
    if (isOpen) loadInspectors();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) setSelectedId(job?.qcInspectorId || "");
  }, [isOpen, job?.qcInspectorId]);

  if (!isOpen || !job) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const inspector = inspectors.find((i) => i.id === selectedId);
    if (!inspector) return;
    setSaving(true);
    const success = await onAssign(inspector);
    setSaving(false);
    if (success) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6 text-purple-500" />
            Assign QC Inspector — {job.vehicle}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">QC Inspector *</label>
            <select
              required
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white"
            >
              <option value="">Select QC Inspector</option>
              {inspectors.map((i) => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
            {inspectors.length === 0 && (
              <p className="text-xs text-gray-400">No active QC inspectors found.</p>
            )}
          </div>

          <button
            type="submit"
            disabled={saving || !selectedId}
            className="w-full bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <Check className="w-5 h-5" />
            {saving ? "Assigning..." : "Assign QC Inspector"}
          </button>
        </form>
      </div>
    </div>
  );
}
