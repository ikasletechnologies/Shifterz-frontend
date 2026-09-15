import { defineConfig, devices } from "@playwright/test";
import path from "path";

// Phase 4B-2E — Playwright was already an unused devDependency in this
// repo (never configured, no test files existed anywhere in the frontend
// before this phase — confirmed by a full repo audit). This configures it
// for the first time rather than introducing a new framework. Starts both
// the frontend (this repo) and the backend (sibling repo) dev servers so
// the E2E suite exercises the real login flow, real API calls, and the
// real (Docker) Postgres database — no mocking of the backend.
const BACKEND_DIR = path.resolve(__dirname, "..", "shifterz_backend");

export default defineConfig({
  testDir: "./tests-e2e",
  timeout: 30_000,
  // Dev-mode first-time route compilation (Turbopack) can take several
  // seconds per route on first navigation — the default 5s expect timeout
  // is too tight for that, independent of any actual app behavior.
  expect: { timeout: 10_000 },
  fullyParallel: false, // shared DB fixtures — tests must not race each other
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  globalSetup: "./tests-e2e/global-setup.ts",
  globalTeardown: "./tests-e2e/global-teardown.ts",
  use: {
    baseURL: "http://localhost:3100",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: [
    {
      command: "npm run dev",
      cwd: BACKEND_DIR,
      url: "http://localhost:5000/health",
      reuseExistingServer: true,
      timeout: 60_000,
      stdout: "pipe",
      stderr: "pipe",
      // The backend's CORS allowlist (Phase 0.11) defaults to just
      // localhost:3000 when ALLOWED_ORIGINS isn't set in its .env. The E2E
      // frontend runs on 3100 (to avoid colliding with a real dev server on
      // 3000), so it must be added here — scoped to this test-launched
      // process only, not the backend's real env config.
      env: {
        ALLOWED_ORIGINS: "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3100",
      },
    },
    {
      command: "npm run dev -- -p 3100",
      cwd: __dirname,
      url: "http://localhost:3100",
      reuseExistingServer: true,
      timeout: 60_000,
      stdout: "pipe",
      stderr: "pipe",
    },
  ],
});
