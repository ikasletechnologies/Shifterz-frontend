"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { usePermissions, getModuleForRoute } from "@/lib/permissions";

export default function RoutePermissionGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isSuperAdmin, canAccess, loading, role } = usePermissions();

  const requiredModule = getModuleForRoute(pathname);

  // If page does not require a specific module permission, or user is Super Admin
  if (!requiredModule || isSuperAdmin) {
    return <>{children}</>;
  }

  // If still loading permissions from localStorage / auth/me, render subtle placeholder
  if (loading) {
    return <>{children}</>;
  }

  // If user does not have permission for the module
  if (!canAccess(requiredModule)) {
    const returnPath = role === "TECHNICIAN" ? "/technician" : "/dashboard";

    return (
      <div className="flex-1 flex items-center justify-center p-6 min-h-[60vh]">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-lg p-8 text-center space-y-5">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-500">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black text-slate-900">Access Denied</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Your role does not have permission to access the{" "}
              <span className="font-bold text-slate-700 uppercase tracking-wide">
                {requiredModule}
              </span>{" "}
              module. Please contact your Super Admin to request access.
            </p>
          </div>

          <div className="pt-2">
            <Link
              href={returnPath}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-all shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
