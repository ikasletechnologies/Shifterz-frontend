"use client";

import { ReactNode } from "react";
import { StatusTone, TONE_TEXT } from "@/lib/statusTone";

interface SummaryCardProps {
  label: ReactNode;
  value: ReactNode;
  active?: boolean;
  /** When set the card is a filter button; without it the card is a static figure. */
  onClick?: () => void;
  /** green = good, red = bad; applied only while the count is above zero */
  tone?: StatusTone;
  /** Small grey line under the number (e.g. "3 active"). */
  note?: ReactNode;
}

// Summary card shown at the top of list pages (All, Assigned, In Workshop, ...).
// One look everywhere: dark label and number; clickable cards turn yellow on
// hover and when selected.
export function SummaryCard({ label, value, active = false, onClick, tone = "neutral", note }: SummaryCardProps) {
  const showTone = tone !== "neutral" && !(typeof value === "number" && value <= 0);
  const body = (
    <>
      <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">{label}</span>
      <span>
        <span className={`block text-2xl font-semibold ${showTone ? TONE_TEXT[tone] : "text-slate-900"}`}>{value}</span>
        {note && <span className="block text-xs text-slate-500 mt-0.5">{note}</span>}
      </span>
    </>
  );

  if (!onClick) {
    return <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-xs flex flex-col justify-between min-h-24">{body}</div>;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-xl border p-4 shadow-xs flex flex-col justify-between min-h-24 text-left transition-all cursor-pointer ${
        active
          ? "bg-yellow-50 border-yellow-400 ring-2 ring-yellow-400 shadow-md"
          : "bg-white border-gray-100 hover:border-yellow-300 hover:bg-yellow-50/40 hover:shadow-xs"
      }`}
    >
      {body}
    </button>
  );
}
