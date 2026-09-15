"use client";

import { useMemo } from "react";
import { X, UploadCloud, Plus, Minus, Pencil } from "lucide-react";
import { TemplateVersion } from "../types/qc-template-version.types";

interface QCTemplatePublishDialogProps {
  isOpen: boolean;
  onClose: () => void;
  draft: TemplateVersion | null;
  currentPublished: TemplateVersion | null;
  isPublishing: boolean;
  onConfirm: () => Promise<boolean>;
}

// Part 23 — a simple, item-level comparison only (no diff engine). Diffing
// by logicalItemId is the correct identity here: it's the one field the
// backend explicitly preserves across versions for "the same conceptual
// item" (Phase 4B-2D-C), unlike each version-item's own row id, which is
// always different between any two versions even for an unchanged item.
function computeDiff(draft: TemplateVersion | null, published: TemplateVersion | null) {
  const draftItems = draft?.items || [];
  const publishedItems = published?.items || [];
  const publishedByLogicalId = new Map(publishedItems.map((i) => [i.logicalItemId, i]));
  const draftByLogicalId = new Map(draftItems.map((i) => [i.logicalItemId, i]));

  const added = draftItems.filter((i) => !publishedByLogicalId.has(i.logicalItemId));
  const removed = publishedItems.filter((i) => !draftByLogicalId.has(i.logicalItemId));
  const changed = draftItems
    .filter((i) => publishedByLogicalId.has(i.logicalItemId))
    .map((i) => ({ before: publishedByLogicalId.get(i.logicalItemId)!, after: i }))
    .filter(({ before, after }) => before.label !== after.label || before.category !== after.category || before.order !== after.order || before.mandatory !== after.mandatory);

  return { added, removed, changed };
}

export function QCTemplatePublishDialog({ isOpen, onClose, draft, currentPublished, isPublishing, onConfirm }: QCTemplatePublishDialogProps) {
  const diff = useMemo(() => computeDiff(draft, currentPublished), [draft, currentPublished]);

  if (!isOpen || !draft) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-green-500" />
            Publish Version {draft.versionNumber}?
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <p className="text-sm text-gray-600">
            This will make this checklist configuration effective for future QC inspections.
            {currentPublished
              ? ` The current Published version (Version ${currentPublished.versionNumber}) will become Superseded.`
              : " There is no currently Published version in this scope yet."}
            {" "}Existing QC inspections already in progress will remain unchanged.
          </p>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-2xl font-bold text-gray-800">{currentPublished?.items.length ?? 0}</p>
              <p className="text-[11px] text-gray-500">Current items</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-2xl font-bold text-gray-800">{draft.items.length}</p>
              <p className="text-[11px] text-gray-500">New version items</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-2xl font-bold text-gray-800">{diff.added.length + diff.removed.length + diff.changed.length}</p>
              <p className="text-[11px] text-gray-500">Total changes</p>
            </div>
          </div>

          {diff.added.length > 0 && (
            <div>
              <p className="text-xs font-bold text-green-700 flex items-center gap-1 mb-1"><Plus className="w-3.5 h-3.5" /> Added ({diff.added.length})</p>
              <ul className="text-xs text-gray-600 space-y-0.5 pl-4">
                {diff.added.map((i) => <li key={i.id}>{i.label} <span className="text-gray-400">({i.category})</span></li>)}
              </ul>
            </div>
          )}
          {diff.removed.length > 0 && (
            <div>
              <p className="text-xs font-bold text-red-700 flex items-center gap-1 mb-1"><Minus className="w-3.5 h-3.5" /> Removed ({diff.removed.length})</p>
              <ul className="text-xs text-gray-600 space-y-0.5 pl-4">
                {diff.removed.map((i) => <li key={i.id}>{i.label} <span className="text-gray-400">({i.category})</span></li>)}
              </ul>
            </div>
          )}
          {diff.changed.length > 0 && (
            <div>
              <p className="text-xs font-bold text-amber-700 flex items-center gap-1 mb-1"><Pencil className="w-3.5 h-3.5" /> Changed ({diff.changed.length})</p>
              <ul className="text-xs text-gray-600 space-y-1 pl-4">
                {diff.changed.map(({ before, after }) => (
                  <li key={after.id}>
                    {after.label}
                    {before.label !== after.label && <span className="text-gray-400"> — renamed from &quot;{before.label}&quot;</span>}
                    {before.mandatory !== after.mandatory && <span className="text-amber-600"> — mandatory {before.mandatory ? "→ optional" : "→ mandatory"}</span>}
                    {before.order !== after.order && <span className="text-gray-400"> — order {before.order} → {after.order}</span>}
                    {before.category !== after.category && <span className="text-gray-400"> — category {before.category} → {after.category}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {diff.added.length === 0 && diff.removed.length === 0 && diff.changed.length === 0 && (
            <p className="text-xs text-gray-400 italic">No item-level differences detected from the current Published version.</p>
          )}
        </div>

        <div className="flex justify-end gap-3 px-5 py-4 border-t border-gray-100 bg-gray-50/50 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg">
            Cancel
          </button>
          <button
            onClick={async () => { const ok = await onConfirm(); if (ok) onClose(); }}
            disabled={isPublishing}
            className="px-4 py-2 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50"
          >
            {isPublishing ? "Publishing..." : `Publish Version ${draft.versionNumber}`}
          </button>
        </div>
      </div>
    </div>
  );
}
