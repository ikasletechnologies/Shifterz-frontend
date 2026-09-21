"use client";

import { useState, useEffect, useMemo } from "react";
import { X, ClipboardList, Plus, Trash2, Lock } from "lucide-react";
import { toast } from "react-hot-toast";
import { TemplateVersionItem, TemplateVersionItemInput } from "../types/qc-template-version.types";

interface EditableRow extends TemplateVersionItemInput {
  // React key only — never sent to the backend. Existing rows use their own
  // TemplateVersionItem.id (stable across edits within this session); new
  // rows get a locally-generated temp key.
  rowKey: string;
}

interface QCTemplateDraftDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  scopeLabel: string; // "HQ Standard" | "Your Franchise Additions"
  initialItems: TemplateVersionItem[];
  // Read-only reference, shown only when editing a franchise's own Draft —
  // Part 13: the editor must clearly separate HQ Standard (read-only) from
  // the franchise's own additions, never implying the HQ rows are editable.
  hqStandardItems?: TemplateVersionItem[] | null;
  isSaving: boolean;
  onSave: (items: TemplateVersionItemInput[]) => Promise<boolean>;
}

let tempKeyCounter = 0;
function nextTempKey() {
  tempKeyCounter += 1;
  return `new-${tempKeyCounter}`;
}

function toEditableRows(items: TemplateVersionItem[]): EditableRow[] {
  return items.map((i) => ({
    rowKey: i.id,
    logicalItemId: i.logicalItemId,
    label: i.label,
    category: i.category,
    order: i.order,
    mandatory: i.mandatory,
  }));
}

export function QCTemplateDraftDialog({
  isOpen, onClose, mode, scopeLabel, initialItems, hqStandardItems, isSaving, onSave,
}: QCTemplateDraftDialogProps) {
  const [rows, setRows] = useState<EditableRow[]>([]);
  const [initialSnapshot, setInitialSnapshot] = useState<string>("[]");

  useEffect(() => {
    if (!isOpen) return;
    const seeded = toEditableRows(initialItems);
    setRows(seeded);
    setInitialSnapshot(JSON.stringify(seeded));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const isDirty = JSON.stringify(rows) !== initialSnapshot;

  // Part 15 — frontend validation for immediate UX feedback only; the
  // backend (QcTemplateVersionService.createDraftVersion/
  // updateDraftVersionItems) remains authoritative and re-checks all of
  // this independently.
  const validationIssues = useMemo(() => {
    const issues: string[] = [];
    if (rows.length === 0) issues.push("At least one checklist item is required.");
    const seen = new Set<string>();
    rows.forEach((r, idx) => {
      if (!r.label.trim()) issues.push(`Row ${idx + 1}: label is required.`);
      if (!r.category.trim()) issues.push(`Row ${idx + 1}: category is required.`);
      if (!Number.isInteger(r.order) || r.order < 0) issues.push(`Row ${idx + 1}: order must be a whole number ≥ 0.`);
      const key = `${r.category.trim().toLowerCase()}::${r.label.trim().toLowerCase()}`;
      if (r.label.trim() && r.category.trim()) {
        if (seen.has(key)) issues.push(`Row ${idx + 1}: duplicate item ("${r.label}" in "${r.category}") already appears earlier in this Draft.`);
        seen.add(key);
      }
    });
    if (hqStandardItems && hqStandardItems.length > 0) {
      const hqKeys = new Set(hqStandardItems.map((i) => `${i.category.trim().toLowerCase()}::${i.label.trim().toLowerCase()}`));
      rows.forEach((r, idx) => {
        const key = `${r.category.trim().toLowerCase()}::${r.label.trim().toLowerCase()}`;
        if (r.label.trim() && r.category.trim() && hqKeys.has(key)) {
          issues.push(`Row ${idx + 1}: "${r.label}" (${r.category}) matches an HQ Standard item — franchise additions must be distinct items, not overrides.`);
        }
      });
    }
    return issues;
  }, [rows, hqStandardItems]);

  if (!isOpen) return null;

  const addRow = () => {
    setRows((prev) => [...prev, { rowKey: nextTempKey(), label: "", category: "", order: prev.length + 1, mandatory: false }]);
  };

  const removeRow = (rowKey: string) => {
    setRows((prev) => prev.filter((r) => r.rowKey !== rowKey));
  };

  const updateRow = (rowKey: string, patch: Partial<EditableRow>) => {
    setRows((prev) => prev.map((r) => (r.rowKey === rowKey ? { ...r, ...patch } : r)));
  };

  const handleClose = () => {
    if (isDirty && !window.confirm("You have unsaved changes to this Draft. Discard them and close?")) {
      return;
    }
    onClose();
  };

  const handleSave = async () => {
    if (validationIssues.length > 0) {
      toast.error(validationIssues[0]);
      return;
    }
    const payload: TemplateVersionItemInput[] = rows.map(({ rowKey: _rowKey, ...rest }) => rest);
    const success = await onSave(payload);
    if (success) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-blue-500" />
            {mode === "create" ? "Create Draft" : "Edit Draft"} — {scopeLabel}
          </h2>
          <button onClick={handleClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {hqStandardItems && hqStandardItems.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Lock className="w-3.5 h-3.5 text-gray-400" />
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide">HQ Standard (read-only)</h3>
              </div>
              <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100 bg-gray-50">
                {hqStandardItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-500">
                    <span className="flex-1">{item.label}</span>
                    <span className="text-xs text-gray-400">{item.category}</span>
                    {item.mandatory && <span className="text-[10px] font-bold text-red-400">MANDATORY</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
              {hqStandardItems ? "Your Franchise Additions" : "Checklist Items"}
            </h3>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="grid grid-cols-[1fr_1fr_80px_90px_40px] gap-2 px-4 py-2 bg-gray-50 text-[11px] font-bold text-gray-500 uppercase">
                <span>Label</span>
                <span>Category</span>
                <span>Order</span>
                <span>Mandatory</span>
                <span></span>
              </div>
              <div className="divide-y divide-gray-100">
                {rows.map((row) => (
                  <div key={row.rowKey} className="grid grid-cols-[1fr_1fr_80px_90px_40px] gap-2 px-4 py-2 items-center">
                    <input
                      type="text"
                      value={row.label}
                      onChange={(e) => updateRow(row.rowKey, { label: e.target.value })}
                      placeholder="Item label"
                      className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                    <input
                      type="text"
                      value={row.category}
                      onChange={(e) => updateRow(row.rowKey, { category: e.target.value })}
                      placeholder="Category"
                      className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                    <input
                      type="number"
                      value={row.order}
                      onChange={(e) => updateRow(row.rowKey, { order: parseInt(e.target.value, 10) || 0 })}
                      className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                    <label className="flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={row.mandatory}
                        onChange={(e) => updateRow(row.rowKey, { mandatory: e.target.checked })}
                        className="w-4 h-4 accent-red-500"
                      />
                    </label>
                    <button onClick={() => removeRow(row.rowKey)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500" title="Remove item">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {rows.length === 0 && (
                  <div className="px-4 py-6 text-center text-sm text-gray-400">No items yet — add one below.</div>
                )}
              </div>
            </div>
            <button
              onClick={addRow}
              className="mt-3 px-3 py-1.5 text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Item
            </button>
          </div>

          {validationIssues.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-xs font-bold text-red-700 mb-1">{validationIssues.length} issue(s) to resolve:</p>
              <ul className="list-disc list-inside text-xs text-red-600 space-y-0.5">
                {validationIssues.map((issue, i) => <li key={i}>{issue}</li>)}
              </ul>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center px-5 py-4 border-t border-gray-100 bg-gray-50/50 flex-shrink-0">
          <span className="text-xs text-gray-500">{rows.length} item(s){isDirty ? " · unsaved changes" : ""}</span>
          <div className="flex gap-3">
            <button onClick={handleClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || validationIssues.length > 0}
              className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save Draft"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
