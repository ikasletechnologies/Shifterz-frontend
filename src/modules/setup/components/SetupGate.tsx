"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getSettings } from "@/lib/api";
import { HQ_SETUP_ROLES, BRANCH_ADMIN_SETUP_ROLES, normalizeRole } from "../lib/setupRoles";

// Runs once per dashboard-layout mount (i.e. once per full page load, not
// per in-app navigation — layout.tsx doesn't remount between /dashboard/*
// routes) and sends a Super Admin / Branch Admin who hasn't finished their
// first-time setup to /setup before they ever see the dashboard chrome.
//
// HQ roles: gated on Settings.isSetupComplete (backend field, defaults
// false — see prisma/schema.prisma Setting.isSetupComplete in shifterz_backend).
// Branch admin roles: gated on user.needsOnboarding (from /auth/login and
// /auth/me — backend field, true only for freshly-created FRANCHISE_ADMIN/
// BRANCH_MANAGER accounts, see EmployeeRepository.create).
export function SetupGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      let user: { role?: string; needsOnboarding?: boolean } | null = null;
      try {
        const raw = localStorage.getItem("user");
        user = raw ? JSON.parse(raw) : null;
      } catch {
        user = null;
      }

      if (!user) {
        if (!cancelled) setChecked(true);
        return;
      }

      const role = normalizeRole(user.role);

      try {
        if (HQ_SETUP_ROLES.includes(role)) {
          const settings = await getSettings();
          if (cancelled) return;
          if (settings?.isSetupComplete !== true) {
            router.replace("/setup");
            return;
          }
        } else if (BRANCH_ADMIN_SETUP_ROLES.includes(role)) {
          if (cancelled) return;
          if (user.needsOnboarding === true) {
            router.replace("/setup");
            return;
          }
        }
      } catch {
        // Don't trap the user on a blank screen if the check itself fails
        // (e.g. settings endpoint unreachable) — let them into the dashboard.
      }

      if (!cancelled) setChecked(true);
    }

    check();
    return () => {
      cancelled = true;
    };
  }, [router]);

  // Briefly blank while the check resolves, rather than flashing the full
  // dashboard chrome before redirecting a first-time admin away from it.
  if (!checked) return null;
  return <>{children}</>;
}
