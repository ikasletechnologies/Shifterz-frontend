import { z } from "zod";

export const checklistResultSchema = z.object({
  id: z.string(),
  label: z.string(),
  passed: z.boolean(),
  remark: z.string().optional(),
});

export const submitChecklistSchema = z.object({
  jobId: z.string(),
  checklist: z.array(checklistResultSchema).min(1, "Checklist cannot be empty"),
});

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

export type SubmitChecklistData = z.infer<typeof submitChecklistSchema>;
export type PassQCData = z.infer<typeof passQCSchema>;
export type FailQCData = z.infer<typeof failQCSchema>;
export type ReworkData = z.infer<typeof reworkSchema>;
export type RemarksData = z.infer<typeof remarksSchema>;
