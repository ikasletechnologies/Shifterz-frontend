// Phase 4B-2E — runs the backend's isolated fixture-creation script before
// the E2E suite starts. Uses execSync with an explicit cwd rather than
// importing backend code directly — the two repos are separate Node
// projects with their own node_modules/Prisma client, so shelling out to
// the backend's own tsx script (the same tool every backend test/fixture
// script in this codebase already uses) is the correct boundary, not a
// cross-repo import.
import { execSync } from "child_process";
import path from "path";
import fs from "fs";

const BACKEND_DIR = path.resolve(__dirname, "..", "..", "shifterz_backend");
const FIXTURES_PATH = path.join(BACKEND_DIR, "scripts", "e2e-qc-templates-fixtures.json");

export default async function globalSetup() {
  if (fs.existsSync(FIXTURES_PATH)) {
    fs.unlinkSync(FIXTURES_PATH); // stale fixtures from a previous interrupted run must never be reused
  }
  execSync("npx tsx scripts/e2e-qc-templates-fixtures-setup.ts", { cwd: BACKEND_DIR, stdio: "inherit" });
}
