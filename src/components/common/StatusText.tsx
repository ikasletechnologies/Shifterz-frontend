import { ReactNode } from "react";
import { getStatusTone, TONE_TEXT, StatusTone } from "@/lib/statusTone";

/**
 * A status shown as plain text: green when it's a good outcome, red when it's
 * a bad one, neutral otherwise. `keep-color` stops the shared table style from
 * greying it out. Pass `tone` to override the automatic match.
 */
export function StatusText({ status, tone, children }: { status?: string | null; tone?: StatusTone; children?: ReactNode }) {
  const t = tone ?? getStatusTone(status);
  return (
    <span className={`keep-color whitespace-nowrap ${t === "neutral" ? "" : `font-medium ${TONE_TEXT[t]}`}`}>
      {children ?? status ?? "—"}
    </span>
  );
}
