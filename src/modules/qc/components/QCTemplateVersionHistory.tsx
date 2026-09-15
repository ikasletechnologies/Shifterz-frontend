"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, History } from "lucide-react";
import { TemplateVersion } from "../types/qc-template-version.types";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

// Part 8 — status badge, following this codebase's existing
// `{bg-X-100 text-X-700} rounded-full` pill convention (see QCTable.tsx's
// own StatusBadge).
export function TemplateStatusBadge({ status }: { status: TemplateVersion["status"] }) {
  const styles: Record<TemplateVersion["status"], string> = {
    Draft: "bg-amber-100 text-amber-700",
    Published: "bg-green-100 text-green-700",
    Superseded: "bg-gray-100 text-gray-500",
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap ${styles[status]}`}>
      {status}
    </span>
  );
}

interface QCTemplateVersionHistoryProps {
  versions: TemplateVersion[]; // Published + Superseded, any order — sorted here
}

export function QCTemplateVersionHistory({ versions }: QCTemplateVersionHistoryProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const sorted = [...versions].sort((a, b) => b.versionNumber - a.versionNumber);

  if (sorted.length === 0) {
    return <p className="text-xs text-gray-400 italic py-3">No historical versions yet.</p>;
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
      {sorted.map((v) => {
        const isExpanded = expandedId === v.id;
        return (
          <div key={v.id}>
            <button
              onClick={() => setExpandedId(isExpanded ? null : v.id)}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <History className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-bold text-gray-800">Version {v.versionNumber}</span>
                <TemplateStatusBadge status={v.status} />
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>{v.items.length} item(s)</span>
                <span>{formatDate(v.publishedAt)}</span>
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>
            {isExpanded && (
              <div className="px-4 py-3 bg-gray-50 space-y-1">
                {v.items.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No items.</p>
                ) : (
                  v.items
                    .slice()
                    .sort((a, b) => (a.category === b.category ? a.order - b.order : a.category.localeCompare(b.category)))
                    .map((item) => (
                      <div key={item.id} className="flex items-center gap-3 text-xs text-gray-600 py-0.5">
                        <span className="flex-1">{item.label}</span>
                        <span className="text-gray-400">{item.category}</span>
                        {item.mandatory && <span className="text-[10px] font-bold text-red-500">MANDATORY</span>}
                      </div>
                    ))
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
