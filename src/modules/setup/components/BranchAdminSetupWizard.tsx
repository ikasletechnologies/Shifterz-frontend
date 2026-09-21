"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { Building2, Check, Loader2, Receipt, Settings as SettingsIcon } from "lucide-react";
import { completeOnboarding } from "@/modules/auth/services/auth.service";

// The franchise this admin belongs to already has its address/GST/contact
// filled in by the Super Admin who created it (see AddFranchiseDialog), so
// there's nothing left to collect here — just a short welcome/orientation
// screen before they land on the dashboard.
export function BranchAdminSetupWizard() {
  const router = useRouter();
  const [isFinishing, setIsFinishing] = useState(false);
  const [user, setUser] = useState<{ name?: string; username?: string; role?: string } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      setUser(raw ? JSON.parse(raw) : null);
    } catch {
      setUser(null);
    }
  }, []);

  const handleFinish = async () => {
    setIsFinishing(true);
    try {
      await completeOnboarding();
    } catch (err) {
      // Don't trap a branch admin on this screen if the call fails for some
      // reason (network blip, etc.) — let them through regardless.
      // SetupGate will only send them back here on their next login if
      // needsOnboarding still comes back true.
      console.error("Failed to record onboarding completion:", err);
    } finally {
      setIsFinishing(false);
      toast.success("Welcome aboard!");
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="px-6 sm:px-8 pt-8 pb-6 border-b border-gray-100">
          <h1 className="text-2xl font-black text-gray-900">
            Welcome{user?.name ? `, ${user.name}` : ""}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Your branch is already set up — here&apos;s what to check before you get started.
          </p>
        </div>

        <div className="px-6 sm:px-8 py-6 space-y-3">
          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <Building2 className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-gray-900">Your branch details are already on file</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Business name, address and GST were set up when your branch was created. You can review or correct them any time under{" "}
                <Link href="/dashboard/settings" className="text-yellow-600 font-semibold hover:underline">
                  Settings
                </Link>
                .
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <Receipt className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-gray-900">Review the service catalog</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Take a look at what&apos;s already priced under{" "}
                <Link href="/dashboard/services" className="text-yellow-600 font-semibold hover:underline">
                  Services
                </Link>{" "}
                — that&apos;s what Billing uses to generate invoices.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <SettingsIcon className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-gray-900">Add your team</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Technicians, sales agents and security guards for your branch can be added from Settings whenever you&apos;re ready.
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 sm:px-8 py-5 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button
            type="button"
            onClick={handleFinish}
            disabled={isFinishing}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg flex items-center gap-1.5 text-sm shadow-sm disabled:opacity-60"
          >
            {isFinishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {isFinishing ? "Finishing..." : "Get Started"}
          </button>
        </div>
      </div>
    </div>
  );
}
