"use client";

import { useEffect, useRef } from "react";

/**
 * Opens a page's "create new" form when the URL carries `?new=1` — used by the
 * dashboard's quick-action buttons (New Invoice, Car In, Add Employee). The
 * flag is stripped from the URL afterwards so a refresh doesn't reopen it.
 * Pass `enabled = false` until the user is known to be allowed to create.
 */
export function useOpenOnQuery(open: () => void, enabled = true) {
  const openRef = useRef(open);

  useEffect(() => {
    openRef.current = open;
  });

  useEffect(() => {
    if (!enabled) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("new") !== "1") return;

    openRef.current();
    params.delete("new");
    const query = params.toString();
    window.history.replaceState(null, "", window.location.pathname + (query ? `?${query}` : ""));
  }, [enabled]);
}
