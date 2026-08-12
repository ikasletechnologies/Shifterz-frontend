"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getJobCards } from "@/modules/job-card/services/job-card.service";
import { JobCard } from "@/modules/job-card/types/job-card.types";
import { getVehicleCheckIns } from "@/modules/vehicle-checkin/services/vehicle-checkin.service";
import { getInvoices } from "@/modules/billing/services/billing.service";
import { getOutPasses } from "@/lib/api";
import { getScopedFranchiseId, scopeToFranchise } from "@/lib/franchise-scope";
import { LiveOutPassInput, LiveVehicleRecord } from "../types/live-status.types";
import { deriveLiveStatus } from "../lib/deriveLiveStatus";
import { POLL_INTERVAL_MS } from "../constants/live-status.constants";

async function safeFetch<T>(fn: () => Promise<T[]>, label: string): Promise<T[]> {
  try {
    const data = await fn();
    return data || [];
  } catch (err) {
    console.error(`Live status: failed to load ${label}`, err);
    return [];
  }
}

export function useLiveStatus() {
  const [records, setRecords] = useState<LiveVehicleRecord[]>([]);
  const [allJobCards, setAllJobCards] = useState<JobCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const isFirstLoad = useRef(true);

  const fetchAll = useCallback(async () => {
    try {
      if (isFirstLoad.current) setIsLoading(true);
      const franchiseId = getScopedFranchiseId();
      const [jobCards, checkIns, outPasses, invoices] = await Promise.all([
        safeFetch(() => getJobCards(franchiseId), "job cards"),
        safeFetch(() => getVehicleCheckIns(franchiseId), "vehicle check-ins"),
        safeFetch<LiveOutPassInput>(() => getOutPasses(franchiseId), "outpasses"),
        safeFetch(getInvoices, "invoices"),
      ]);
      const scopedJobCards = scopeToFranchise(jobCards);
      const scopedCheckIns = scopeToFranchise(checkIns);
      const scopedOutPasses = scopeToFranchise(outPasses);
      setRecords(deriveLiveStatus(scopedJobCards, scopedCheckIns, scopedOutPasses, invoices));
      setAllJobCards(scopedJobCards);
      setLastUpdated(new Date());
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load live status");
    } finally {
      if (isFirstLoad.current) {
        setIsLoading(false);
        isFirstLoad.current = false;
      }
    }
  }, []);

  useEffect(() => {
    fetchAll();

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") fetchAll();
    }, POLL_INTERVAL_MS);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") fetchAll();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [fetchAll]);

  return { records, allJobCards, isLoading, error, lastUpdated, refetch: fetchAll };
}
