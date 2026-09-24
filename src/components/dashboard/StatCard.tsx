import { ElementType } from "react";
import { SummaryCard } from "@/components/common/SummaryCard";
import { StatusTone } from "@/lib/statusTone";

// Titles whose number is good news (green) or needs attention (red) when above zero.
const GOOD = /^(active|present|completed|jobs completed|ready for delivery)/i;
const BAD = /^(inactive|absent|low stock|outstanding)/i;

/**
 * Legacy stat card API (title / icon / color). Renders the shared SummaryCard so
 * every stat box in the app looks the same; `icon` and `color` are accepted for
 * compatibility but no longer drawn.
 */
export function StatCard({
  title,
  value,
  onClick,
  active,
}: {
  title: string;
  value: string | number;
  icon?: ElementType;
  color?: string;
  onClick?: () => void;
  active?: boolean;
}) {
  const tone: StatusTone = GOOD.test(title) ? "good" : BAD.test(title) ? "bad" : "neutral";
  return <SummaryCard label={title} value={value} onClick={onClick} active={active} tone={tone} />;
}
