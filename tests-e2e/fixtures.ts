import fs from "fs";
import path from "path";

const FIXTURES_PATH = path.resolve(__dirname, "..", "..", "shifterz_backend", "scripts", "e2e-qc-templates-fixtures.json");

export interface E2eFixtures {
  runId: string;
  password: string;
  franchiseAId: string;
  franchiseBId: string;
  hqUsername: string;
  franchiseAAdminUsername: string;
  franchiseBAdminUsername: string;
  noPermissionUsername: string;
}

export function loadFixtures(): E2eFixtures {
  return JSON.parse(fs.readFileSync(FIXTURES_PATH, "utf-8"));
}
