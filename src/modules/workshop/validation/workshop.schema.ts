import { z } from "zod";

// Note: zod is an optional dep — if not installed, replace with manual validation
// npm install zod (if not already present)

export const materialSchema = z.object({
  name: z.string().min(1, "Material name is required"),
  quantity: z.number().positive("Quantity must be positive"),
  unit: z.string().min(1, "Unit is required"),
});

export const technicianNotesSchema = z.object({
  notes: z.string().min(1, "Notes cannot be empty").max(2000, "Notes too long"),
});

export const completeWorkSchema = z.object({
  notes: z.string().optional(),
  actualCompletion: z.string().optional(),
});

export const sendToQCSchema = z.object({
  notes: z.string().optional(),
});

export type MaterialFormData = z.infer<typeof materialSchema>;
export type TechnicianNotesFormData = z.infer<typeof technicianNotesSchema>;
export type CompleteWorkFormData = z.infer<typeof completeWorkSchema>;
export type SendToQCFormData = z.infer<typeof sendToQCSchema>;
