import { sendToQC } from "@/modules/workshop/services/workshop.service";
import { startInspection, submitChecklist } from "@/modules/qc/services/qc.service";
import { ChecklistResult } from "@/modules/qc/types/qc.types";
import { JobCard } from "../types/job-card.types";

// The backend only allows starting/resuming a QC inspection when the job is in
// exactly one of "Waiting for Quality Check"/"Rework Required" (confirmed by
// its own rejection message) — a technician marking work "Completed" isn't
// enough on its own. Rather than surface that as a separate manual "Send to
// QC" step, ensureSentToQCAndChecklistSubmitted below calls Send to QC first
// whenever the job is still in one of these "not yet sent" statuses, so a
// Super Admin only ever needs the one Pass/Fail click regardless of which of
// these statuses the job is currently in.
export const QC_NOT_YET_SENT_STATUSES = new Set([
  "Completed",
  "Work Completed",
  "Complete",
]);

export const QC_QUICK_DECIDE_STATUSES = new Set([
  ...QC_NOT_YET_SENT_STATUSES,
  "Waiting for Quality Check",
  "Rework Required",
]);

// The backend rejects a decision unless the job has already been sent to QC
// and has an open QCInspection attempt with a submitted checklist, for both
// Pass and Fail — the "bypass" this override offers is doing those steps
// automatically (marking every frozen checklist item Passed, which the
// checklist-result-agnostic Fail path doesn't care about either way) rather
// than actually skipping backend validation, which isn't possible from here.
// Both calls are idempotent, so this is safe even if the job's already past
// one of these steps.
export async function ensureSentToQCAndChecklistSubmitted(job: JobCard): Promise<void> {
  if (QC_NOT_YET_SENT_STATUSES.has(job.status)) {
    await sendToQC(job.id);
  }
  const attempt = await startInspection(job.id);
  const frozenChecklist = attempt.checklist || [];
  if (frozenChecklist.length > 0) {
    const allPassed: ChecklistResult[] = frozenChecklist.map((item) => ({ id: item.id, result: "Passed" }));
    await submitChecklist(job.id, allPassed);
  }
}
