import { z } from "zod";

// Phase 4B-2C closure fix — the checklist-result schema that used to live
// here (`passed: z.boolean()`) was removed: it modeled the pre-4B-2C
// representation that can't distinguish "unanswered" from "explicitly
// passed", which is exactly what qc.types.ts's `ChecklistItemResult`
// ("Unanswered" | "Passed" | "Failed") replaced. It was verified unused
// (grepped across the whole frontend — no imports anywhere), so it was
// deleted rather than updated, to remove the risk of a future contributor
// wiring the old boolean model back in instead of importing the current
// `ChecklistResult` type from qc.types.ts.

export const passQCSchema = z.object({
  notes: z.string().max(1000).optional(),
});

export const failQCSchema = z.object({
  notes: z.string().min(1, "Failure notes are required").max(2000),
  failedItems: z.array(z.string()).min(1, "At least one failed item must be identified"),
});

export const reworkSchema = z.object({
  reason: z.string().min(1, "Rework reason is required"),
  notes: z.string().max(1000).optional(),
});

export const remarksSchema = z.object({
  notes: z.string().min(1, "Remarks cannot be empty").max(2000),
});

export type PassQCData = z.infer<typeof passQCSchema>;
export type FailQCData = z.infer<typeof failQCSchema>;
export type ReworkData = z.infer<typeof reworkSchema>;
export type RemarksData = z.infer<typeof remarksSchema>;
