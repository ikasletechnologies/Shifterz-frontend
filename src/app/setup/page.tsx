"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { HQ_SETUP_ROLES, BRANCH_ADMIN_SETUP_ROLES, normalizeRole } from "@/modules/setup/lib/setupRoles";
import { SuperAdminSetupWizard } from "@/modules/setup/components/SuperAdminSetupWizard";
import { BranchAdminSetupWizard } from "@/modules/setup/components/BranchAdminSetupWizard";

type WizardKind = "hq" | "branch";

export default function SetupPage() {
  const router = useRouter();
  const [wizard, setWizard] = useState<WizardKind | null>(null);

  useEffect(() => {
    let user: { role?: string } | null = null;
    try {
      const raw = localStorage.getItem("user");
      user = raw ? JSON.parse(raw) : null;
    } catch {
      user = null;
    }

    if (!user) {
      router.replace("/login");
      return;
    }

    const role = normalizeRole(user.role);
    if (HQ_SETUP_ROLES.includes(role)) {
      setWizard("hq");
    } else {
      // Setup doesn't apply to this role — send them where they'd normally land.
      router.replace(role === "TECHNICIAN" ? "/technician" : "/dashboard");
    }
  }, [router]);

  if (!wizard) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-6 h-6 animate-spin text-yellow-500" />
      </div>
    );
  }

  return wizard === "hq" ? <SuperAdminSetupWizard /> : <BranchAdminSetupWizard />;
}
