import { BillingPage } from "@/modules/billing";
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading Billing...</div>}>
      <BillingPage />
    </Suspense>
  );
}
