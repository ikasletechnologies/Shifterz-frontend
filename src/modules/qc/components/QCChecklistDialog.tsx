"use client";

import { useState } from "react";
import { X, ClipboardCheck, ChevronDown, ChevronUp } from "lucide-react";
import { QCJob, ChecklistResult } from "../types/qc.types";
import { QC_CHECKLIST, QC_CHECKLIST_CATEGORIES } from "../constants/qc.constants";

interface QCChecklistDialogProps {
  job: QCJob | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (checklist: ChecklistResult[]) => Promise<boolean>;
}

export function QCChecklistDialog({ job, isOpen, onClose, onSubmit }: QCChecklistDialogProps) {
  const [results, setResults] = useState<Record<string, ChecklistResult>>(() =>
    Object.fromEntries(
      QC_CHECKLIST.map((item) => [
        item.id,
        { id: item.id, label: item.label, passed: true, remark: "" },
      ])
    )
  );
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(QC_CHECKLIST_CATEGORIES)
  );
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen || !job) return null;

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  const setItemResult = (id: string, passed: boolean) => {
    setResults((prev) => ({ ...prev, [id]: { ...prev[id], passed } }));
  };

  const setItemRemark = (id: string, remark: string) => {
    setResults((prev) => ({ ...prev, [id]: { ...prev[id], remark } }));
  };

  const failedRequired = QC_CHECKLIST.filter(
    (item) => item.required && !results[item.id]?.passed
  );

  const handleSubmit = async () => {
    setIsSaving(true);
    const checklistData = Object.values(results);
    const success = await onSubmit(checklistData);
    setIsSaving(false);
    if (success) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-blue-500" />
            QC Checklist — {job.vehicle}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Checklist Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {QC_CHECKLIST_CATEGORIES.map((category) => {
            const items = QC_CHECKLIST.filter((i) => i.category === category);
            const isExpanded = expandedCategories.has(category);
            const categoryPassed = items.every((i) => results[i.id]?.passed);

            return (
              <div key={category} className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleCategory(category)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                    categoryPassed ? "bg-green-50" : "bg-red-50"
                  }`}
                >
                  <span className="text-sm font-bold text-gray-800">{category}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${categoryPassed ? "text-green-600" : "text-red-600"}`}>
                      {items.filter((i) => results[i.id]?.passed).length}/{items.length}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="divide-y divide-gray-100">
                    {items.map((item) => {
                      const result = results[item.id];
                      return (
                        <div key={item.id} className="px-4 py-3 space-y-2">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-sm text-gray-700 flex-1">
                              {item.label}
                              {item.required && (
                                <span className="ml-1 text-red-400 text-xs">*</span>
                              )}
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setItemResult(item.id, true)}
                                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                                  result?.passed
                                    ? "bg-green-500 text-white"
                                    : "bg-gray-100 text-gray-500 hover:bg-green-100"
                                }`}
                              >
                                ✓ Pass
                              </button>
                              <button
                                onClick={() => setItemResult(item.id, false)}
                                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                                  !result?.passed
                                    ? "bg-red-500 text-white"
                                    : "bg-gray-100 text-gray-500 hover:bg-red-100"
                                }`}
                              >
                                ✗ Fail
                              </button>
                            </div>
                          </div>
                          {!result?.passed && (
                            <input
                              type="text"
                              value={result?.remark || ""}
                              onChange={(e) => setItemRemark(item.id, e.target.value)}
                              placeholder="Describe the issue..."
                              className="w-full px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-red-300"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {failedRequired.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-xs font-bold text-red-700 mb-1">
                {failedRequired.length} required item(s) failed:
              </p>
              <ul className="list-disc list-inside text-xs text-red-600 space-y-0.5">
                {failedRequired.map((i) => (
                  <li key={i.id}>{i.label}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-5 py-4 border-t border-gray-100 bg-gray-50/50 flex-shrink-0">
          <span className="text-xs text-gray-500">
            {Object.values(results).filter((r) => r.passed).length} / {QC_CHECKLIST.length} items passed
          </span>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 disabled:opacity-50"
            >
              <ClipboardCheck className="w-4 h-4" />
              {isSaving ? "Saving..." : "Save Checklist"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
