/**
 * One rule for colouring states across the app: good outcomes are green, bad
 * outcomes are red, everything in between stays neutral. Match is on the
 * status text, so any module's status strings work without a per-page map.
 */
export type StatusTone = "good" | "bad" | "neutral";

const GOOD = [
  "completed",
  "complete",
  "work completed",
  "qc passed",
  "passed",
  "paid",
  "approved",
  "approved credit",
  "active",
  "delivered",
  "out",
  "converted",
  "resolved",
  "ready for billing",
  "ready for delivery",
  "present",
  "received",
  "on track",
  "in stock",
];

const BAD = [
  "cancelled",
  "canceled",
  "rejected",
  "failed",
  "qc failed",
  "rework",
  "rework required",
  "lost",
  "inactive",
  "expired",
  "overdue",
  "delayed",
  "absent",
  "unpaid",
  "declined",
  "out of stock",
  "low stock",
];

export function getStatusTone(status?: string | null): StatusTone {
  const s = (status || "").trim().toLowerCase();
  if (!s) return "neutral";
  if (BAD.includes(s) || s.endsWith("overdue")) return "bad";
  if (GOOD.includes(s)) return "good";
  return "neutral";
}

/** Text colour classes for a tone. Pair with `keep-color` inside `.data-table`. */
export const TONE_TEXT: Record<StatusTone, string> = {
  good: "text-green-700",
  bad: "text-red-600",
  neutral: "",
};
