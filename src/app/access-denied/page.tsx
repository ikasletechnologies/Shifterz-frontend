"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { getStoredUser, normalizeRole } from "@/lib/permissions";

export default function AccessDeniedPage() {
  const [targetHome, setTargetHome] = useState("/dashboard");

  useEffect(() => {
    const user = getStoredUser();
    const role = normalizeRole(user?.role);
    if (role === "TECHNICIAN") {
      setTargetHome("/technician");
    } else {
      setTargetHome("/dashboard");
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-8 text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-500 shadow-sm">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Access Denied</h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            Your role does not have permission to access this module or resource. Please contact your Super Admin to request access.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href={targetHome}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition-all shadow-sm active:scale-[0.98]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
