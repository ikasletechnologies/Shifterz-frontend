import { Suspense } from "react";
import { JobCardPage } from "@/modules/job-card";

// JobCardPage reads useSearchParams() (for Billing's ?edit=<jobId> deep link)
// — per Next's own docs, a static page calling it from a Client Component
// must be wrapped in Suspense or the production build fails.
export default function Page() {
  return (
    <Suspense fallback={null}>
      <JobCardPage />
    </Suspense>
  );
}
