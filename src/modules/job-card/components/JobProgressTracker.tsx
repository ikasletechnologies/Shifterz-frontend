"use client";

import { ArrowRight, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { JobStageDef, LIFECYCLE_STEPS } from "../lib/jobStage";

interface JobProgressTrackerProps {
  stage: JobStageDef;
  /** Called before navigating away (e.g. to close the dialog). */
  onNavigate?: () => void;
  /** Handles stage actions done on the job card itself (Assign Technician). */
  onEdit?: () => void;
}

// Car-in → car-out stepper: finished steps ticked, the step the job is waiting
// on highlighted, plus a link to the page where that step is done.
export function JobProgressTracker({ stage, onNavigate, onEdit }: JobProgressTrackerProps) {
  const router = useRouter();

  if (stage.key === "cancelled") {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50/50 px-4 py-3 text-sm font-semibold text-red-700">
        This job was cancelled.
      </div>
    );
  }

  const action = stage.action;
  const isBad = stage.tone === "bad";
  const handleAction = () => {
    if (!action) return;
    if (action.edit) {
      onEdit?.();
    } else if (action.href) {
      onNavigate?.();
      router.push(action.href);
    }
  };

  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 space-y-4">
      <ol className="flex items-start">
        {LIFECYCLE_STEPS.map((label, i) => {
          const done = i < stage.step;
          const current = i === stage.step;
          return (
            <li key={label} className="relative flex-1 flex flex-col items-center gap-1.5 min-w-0">
              {i > 0 && (
                <span
                  className={`absolute top-3 right-1/2 w-full h-0.5 -z-0 ${done || current ? "bg-green-500" : "bg-gray-200"}`}
                  aria-hidden
                />
              )}
              <span
                className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  done
                    ? "bg-green-500 text-white"
                    : current
                      ? isBad
                        ? "bg-red-500 text-white ring-4 ring-red-100"
                        : "bg-yellow-400 text-gray-900 ring-4 ring-yellow-100"
                      : "bg-white border-2 border-gray-200 text-gray-400"
                }`}
              >
                {done ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </span>
              <span
                className={`text-[10px] leading-tight text-center ${
                  current ? "font-bold text-gray-900" : done ? "font-medium text-gray-600" : "text-gray-400"
                }`}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-3">
        <p className="text-sm">
          <span className="text-gray-500">Current stage: </span>
          <span className={`font-semibold ${isBad ? "text-red-600" : stage.tone === "good" ? "text-green-700" : "text-gray-900"}`}>
            {stage.label}
          </span>
        </p>
        {action && (
          <button
            type="button"
            onClick={handleAction}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-800 shadow-xs hover:bg-yellow-400 hover:border-yellow-400 hover:text-gray-900 transition-colors cursor-pointer whitespace-nowrap"
          >
            {action.label}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
