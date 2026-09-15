"use client";

import { useState, useEffect } from "react";
import { X, ClipboardCheck, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import { QCJob, ChecklistResult } from "../types/qc.types";
import { toast } from "react-hot-toast";

interface QCChecklistDialogProps {
  job: QCJob | null;
  // Phase 4B-2D-A — the current attempt's FROZEN checklist (QCInspection.checklist),
  // not the live template. This is now the sole source of what items exist,
  // their label/category/order/mandatory — never re-derived from the live
  // checklist-template list, so a template change made after this attempt's
  // Start (add/delete/rename/re-mandatory) can never appear here. The caller
  // (dashboard/qc/page.tsx) is responsible for ensuring an attempt exists
  // (and is therefore frozen) before opening this dialog.
  checklist?: ChecklistResult[] | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (checklist: ChecklistResult[]) => Promise<boolean>;
}

export function QCChecklistDialog({ job, checklist, isOpen, onClose, onSubmit }: QCChecklistDialogProps) {
  const [results, setResults] = useState<Record<string, ChecklistResult>>({});
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  const frozenItems = checklist || [];
  // frozenItems is already ordered category/order/id as frozen at Start
  // (QcRepository.buildFrozenChecklist) — a plain Set preserves that
  // first-seen order, so category display order matches the frozen order
  // without re-sorting.
  const categories = [...new Set(frozenItems.map((item) => item.category || ""))];

  // Re-seed local state whenever the dialog is (re)opened for a job — start
  // from the frozen checklist's own current result/remark. Phase 4B-2C: an
  // item the inspector hasn't touched starts as "Unanswered", never silently
  // defaulted to Passed.
  useEffect(() => {
    if (!isOpen) return;
    setResults(
      Object.fromEntries(frozenItems.map((item) => [item.id, { ...item, remark: item.remark || "" }]))
    );
    setExpandedCategories(new Set(categories));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, job?.id]);

  if (!isOpen || !job) return null;

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  const setItemResult = (id: string, result: "Passed" | "Failed") => {
    setResults((prev) => ({ ...prev, [id]: { ...prev[id], result } }));
  };

  const setItemRemark = (id: string, remark: string) => {
    setResults((prev) => ({ ...prev, [id]: { ...prev[id], remark } }));
  };

  // Frontend feedback only, mirroring exactly what the backend enforces on
  // *every save* (qc.service.ts submitChecklist) — a failed item needs a
  // remark. Mandatory-completeness is deliberately NOT checked here: saving
  // a checklist with mandatory items still unanswered is a legitimate
  // partial save (the inspector may be filling this out over several
  // sittings); the backend only requires completeness at the decision
  // (Pass/Fail) boundary, so blocking it here would contradict that and
  // prevent saving real progress. If a mandatory item is still unanswered
  // when Pass/Fail is attempted, the backend rejects it there and the
  // existing toast-error handling in useQC surfaces that message.
  const validateBeforeSubmit = (): string | null => {
    const failedWithoutRemark = Object.values(results).filter((r) => r.result === "Failed" && !r.remark?.trim());
    if (failedWithoutRemark.length > 0) {
      return `${failedWithoutRemark.length} failed item(s) need a remark before saving.`;
    }
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateBeforeSubmit();
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setIsSaving(true);
    const checklistData = Object.values(results);
    const success = await onSubmit(checklistData);
    setIsSaving(false);
    if (success) onClose();
  };

  if (frozenItems.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-center space-y-3">
          <p className="text-sm font-semibold text-gray-700">No checklist template configured</p>
          <p className="text-xs text-gray-400">Ask HQ or your franchise admin to set up QC checklist items.</p>
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg">
            Close
          </button>
        </div>
      </div>
    );
  }

  const passedCount = Object.values(results).filter((r) => r.result === "Passed").length;
  const failedCount = Object.values(results).filter((r) => r.result === "Failed").length;
  const unansweredCount = Object.values(results).filter((r) => r.result === "Unanswered").length;

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
          {categories.map((category) => {
            const items = frozenItems.filter((i) => i.category === category);
            const categoryComplete = items.every((i) => results[i.id]?.result !== "Unanswered");
            const categoryHasFailure = items.some((i) => results[i.id]?.result === "Failed");

            return (
              <div key={category} className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleCategory(category)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                    categoryHasFailure ? "bg-red-50" : categoryComplete ? "bg-green-50" : "bg-gray-50"
                  }`}
                >
                  <span className="text-sm font-bold text-gray-800">{category}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${categoryHasFailure ? "text-red-600" : categoryComplete ? "text-green-600" : "text-gray-500"}`}>
                      {items.filter((i) => results[i.id]?.result !== "Unanswered").length}/{items.length} answered
                    </span>
                    {expandedCategories.has(category) ? (
                      <ChevronUp className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                  </div>
                </button>

                {expandedCategories.has(category) && (
                  <div className="divide-y divide-gray-100">
                    {items.map((item) => {
                      const result = results[item.id];
                      return (
                        <div key={item.id} className="px-4 py-3 space-y-2">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-sm text-gray-700 flex-1">
                              {item.label}
                              {item.mandatory && <span className="ml-1 text-red-500 text-xs font-bold" title="Mandatory">*</span>}
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setItemResult(item.id, "Passed")}
                                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                                  result?.result === "Passed"
                                    ? "bg-green-500 text-white"
                                    : "bg-gray-100 text-gray-500 hover:bg-green-100"
                                }`}
                              >
                                ✓ Pass
                              </button>
                              <button
                                onClick={() => setItemResult(item.id, "Failed")}
                                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                                  result?.result === "Failed"
                                    ? "bg-red-500 text-white"
                                    : "bg-gray-100 text-gray-500 hover:bg-red-100"
                                }`}
                              >
                                ✗ Fail
                              </button>
                            </div>
                          </div>
                          {(!result || result.result === "Unanswered") && (
                            <p className="text-[11px] text-gray-400 font-medium flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> Not yet answered{item.mandatory ? " — required" : " (optional)"}
                            </p>
                          )}
                          {result?.result === "Failed" && (
                            <input
                              type="text"
                              value={result?.remark || ""}
                              onChange={(e) => setItemRemark(item.id, e.target.value)}
                              placeholder="Describe the issue... (required)"
                              className={`w-full px-3 py-1.5 border rounded-lg text-xs focus:outline-none focus:ring-2 ${
                                result.remark?.trim() ? "bg-red-50 border-red-200 focus:ring-red-300" : "bg-red-50 border-red-400 focus:ring-red-400"
                              }`}
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
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-5 py-4 border-t border-gray-100 bg-gray-50/50 flex-shrink-0">
          <span className="text-xs text-gray-500">
            {passedCount} passed · {failedCount} failed · {unansweredCount} unanswered
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
