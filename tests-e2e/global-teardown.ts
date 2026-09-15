// Phase 4B-2E — always runs after the E2E suite (pass or fail), tearing
// down only this run's own isolated data and re-verifying the real HQ
// Version 1 (Published, 18 items) is untouched (Part 41/42). A non-zero
// exit here fails the whole Playwright run loudly rather than silently.
import { execSync } from "child_process";
import path from "path";

const BACKEND_DIR = path.resolve(__dirname, "..", "..", "shifterz_backend");

export default async function globalTeardown() {
  execSync("npx tsx scripts/e2e-qc-templates-fixtures-teardown.ts", { cwd: BACKEND_DIR, stdio: "inherit" });
}
