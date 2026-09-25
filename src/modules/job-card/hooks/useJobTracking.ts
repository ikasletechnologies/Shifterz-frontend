import { useCallback, useEffect, useMemo, useState } from "react";
import { getInvoices, getOutPasses } from "@/lib/api";
import { JobCard } from "../types/job-card.types";
import { getJobStage, matchInvoice, matchOutPass, JobStageDef } from "../lib/jobStage";

export interface JobTracking {
  stage: JobStageDef;
  invoice: any | null;
  outPass: any | null;
}

/**
 * Resolves every job's current car-in → car-out stage. Loads invoices and out
 * passes once for the whole list; `isInspectionPending` comes from the page's
 * matched vehicle check-ins.
 */
export function useJobTracking(
  jobCards: JobCard[],
  isInspectionPending: (job: JobCard) => boolean,
  enabled = true
) {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [outPasses, setOutPasses] = useState<any[]>([]);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    const [invData, opData] = await Promise.all([
      getInvoices().catch(() => []),
      getOutPasses().catch(() => []),
    ]);
    setInvoices(invData || []);
    setOutPasses(opData || []);
  }, [enabled]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const trackingById = useMemo(() => {
    const map = new Map<string, JobTracking>();
    for (const job of jobCards) {
      const invoice = matchInvoice(job, invoices);
      const outPass = matchOutPass(job, outPasses, invoice);
      const stage = getJobStage(job, { inspectionPending: isInspectionPending(job), invoice, outPass });
      map.set(job.id, { stage, invoice, outPass });
    }
    return map;
  }, [jobCards, invoices, outPasses, isInspectionPending]);

  const trackingFor = useCallback((job: JobCard) => trackingById.get(job.id)!, [trackingById]);

  return { trackingFor, refresh };
}
