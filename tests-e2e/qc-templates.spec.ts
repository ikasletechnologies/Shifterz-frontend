import { test, expect } from "@playwright/test";
import { loadFixtures } from "./fixtures";
import { loginAs } from "./helpers";

const fx = loadFixtures();

test.describe.configure({ mode: "serial" }); // shared DB-backed fixtures — sequential to avoid interference

test.describe("Navigation & permission visibility", () => {
  test("HQ user sees the QC > Checklist Templates nav entry and can navigate to it", async ({ page }) => {
    await loginAs(page, fx.hqUsername, fx.password);
    await page.getByText("QC", { exact: true }).first().click();
    const link = page.getByRole("link", { name: "Checklist Templates" });
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(/\/dashboard\/qc\/templates/);
    await expect(page.getByRole("heading", { name: "QC Checklist Templates" })).toBeVisible();
  });

  test("A user with no qc:templates permission sees Access Restricted, not the management UI", async ({ page }) => {
    await loginAs(page, fx.noPermissionUsername, fx.password);
    await page.goto("/dashboard/qc/templates");
    await expect(page.getByText("Access restricted")).toBeVisible();
    await expect(page.getByRole("button", { name: "Create Draft" })).toHaveCount(0);
  });
});

test.describe("HQ Draft management (create / edit / discard — never publish against the real HQ scope)", () => {
  test("HQ manage: create Draft, add/edit items, toggle mandatory, then discard", async ({ page }) => {
    await loginAs(page, fx.hqUsername, fx.password);
    await page.goto("/dashboard/qc/templates");
    await expect(page.getByText("No Draft in progress.")).toBeVisible();

    await page.getByRole("button", { name: "Create Draft" }).click();
    await expect(page.getByRole("heading", { name: /Create Draft/ })).toBeVisible();

    await page.getByRole("button", { name: "Add Item" }).click();
    const firstLabelInput = page.locator('input[placeholder="Item label"]').first();
    await firstLabelInput.fill(`${fx.runId} HQ Test Item`);
    await page.locator('input[placeholder="Category"]').first().fill("E2E");
    const mandatoryCheckbox = page.locator('input[type="checkbox"]').first();
    await mandatoryCheckbox.check();
    await expect(mandatoryCheckbox).toBeChecked();

    await page.getByRole("button", { name: "Save Draft" }).click();
    await expect(page.getByText(/No Draft in progress\./)).toHaveCount(0);
    await expect(page.getByText("Draft").first()).toBeVisible();

    // Publish button IS visible for this HQ (SUPER_ADMIN) user, but this
    // test never clicks it — Part 41/42: never publish against the real
    // shared HQ scope from an automated test.
    // exact:true — a substring match on "Publish" also matches the History
    // accordion row's accessible name ("Version 1 Published 18 item(s)...").
    await expect(page.getByRole("button", { name: "Publish", exact: true })).toBeVisible();

    // Edit: reopen and add a second item.
    await page.getByRole("button", { name: "Edit Draft" }).click();
    await page.getByRole("button", { name: "Add Item" }).click();
    const labelInputs = page.locator('input[placeholder="Item label"]');
    await labelInputs.nth(1).fill(`${fx.runId} HQ Test Item 2`);
    await page.locator('input[placeholder="Category"]').nth(1).fill("E2E");
    // "2 item(s)" is the dialog footer's own live count — check it before
    // saving closes the dialog; the closed page shows a bare number instead.
    await expect(page.getByText("2 item(s)")).toBeVisible();
    await page.getByRole("button", { name: "Save Draft" }).click();
    await expect(page.getByRole("heading", { name: /Create Draft|Edit Draft/ })).toHaveCount(0);

    // Discard.
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Discard Draft" }).click();
    await expect(page.getByText("No Draft in progress.")).toBeVisible();
  });

  test("Unsaved-changes warning fires when closing a dirty Draft editor", async ({ page }) => {
    await loginAs(page, fx.hqUsername, fx.password);
    await page.goto("/dashboard/qc/templates");
    await page.getByRole("button", { name: "Create Draft" }).click();
    await page.getByRole("button", { name: "Add Item" }).click();
    await page.locator('input[placeholder="Item label"]').first().fill(`${fx.runId} Dirty Item`);

    let dialogSeen = false;
    page.once("dialog", (d) => { dialogSeen = true; d.dismiss(); });
    await page.getByRole("button", { name: "Cancel" }).click();
    expect(dialogSeen).toBe(true);

    // Dismissing the confirm keeps the dialog open (Part 17) — now actually discard the unsaved draft attempt cleanly.
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Cancel" }).click();
  });
});

test.describe("Franchise A (manage + publish) — full Draft to Published to Superseded flow", () => {
  test("create, publish, verify Published + History, then publish again and verify Superseded", async ({ page }) => {
    await loginAs(page, fx.franchiseAAdminUsername, fx.password);
    await page.goto("/dashboard/qc/templates");

    // HQ Standard read-only section must be visible for a franchise user,
    // showing the REAL (not hardcoded) HQ item count.
    await expect(page.getByText("HQ Standard (read-only)")).toBeVisible();
    await expect(page.getByText(/Version \d+ · \d+ item\(s\)/)).toBeVisible();

    await page.getByRole("button", { name: "Create Draft" }).click();
    await page.getByRole("button", { name: "Add Item" }).click();
    await page.locator('input[placeholder="Item label"]').first().fill(`${fx.runId} FA Item V1`);
    await page.locator('input[placeholder="Category"]').first().fill("E2E");
    await page.getByRole("button", { name: "Save Draft" }).click();

    // Publish flow — confirmation dialog first, no auto-publish.
    await page.getByRole("button", { name: "Publish", exact: true }).click();
    await expect(page.getByText(/Publish Version \d+\?/)).toBeVisible();
    await expect(page.getByText("Added (1)")).toBeVisible();
    await page.getByRole("button", { name: /Publish Version \d+/ }).click();

    await expect(page.getByText(/Publish Version \d+\?/)).toHaveCount(0); // dialog closed
    await expect(page.getByText("No Published version yet in this scope.")).toHaveCount(0);
    await expect(page.getByText(`${fx.runId} FA Item V1`)).toHaveCount(0); // not shown raw in the summary card, only in history/editor

    // Published version is read-only — no Edit/Discard controls for it (only the Draft section has those, and there's no Draft now).
    await expect(page.getByRole("button", { name: "Edit Draft" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Discard Draft" })).toHaveCount(0);
    await expect(page.getByText("Create Draft")).toBeVisible(); // free to start a new Draft again

    // Version History shows the just-published version. Scoped to the
    // history section specifically — "Version 1" text also appears in the
    // HQ Standard reference line and in the just-fired toast notification.
    await page.getByText("Version History").scrollIntoViewIfNeeded();
    const historySectionV1 = page.locator("text=Version History").locator("..").locator("..");
    await expect(historySectionV1.getByRole("button", { name: /Version 1/ })).toBeVisible();

    // Publish a second version — verify the first becomes Superseded (stale-data-refresh-after-publish).
    await page.getByRole("button", { name: "Create Draft" }).click();
    await page.getByRole("button", { name: "Add Item" }).click();
    await page.locator('input[placeholder="Item label"]').first().fill(`${fx.runId} FA Item V2`);
    await page.locator('input[placeholder="Category"]').first().fill("E2E");
    await page.getByRole("button", { name: "Save Draft" }).click();
    await page.getByRole("button", { name: "Publish", exact: true }).click();
    await page.getByRole("button", { name: /Publish Version \d+/ }).click();

    await page.reload();
    await expect(page.getByText(`${fx.runId} FA Item V2`)).toHaveCount(0);
    const historySection = page.locator("text=Version History").locator("..").locator("..");
    await expect(historySection.getByText("Superseded").first()).toBeVisible();
  });
});

test.describe("Franchise B (manage only, no publish grant)", () => {
  test("can create/edit a Draft but Publish is not an active action", async ({ page }) => {
    await loginAs(page, fx.franchiseBAdminUsername, fx.password);
    await page.goto("/dashboard/qc/templates");

    await page.getByRole("button", { name: "Create Draft" }).click();
    await page.getByRole("button", { name: "Add Item" }).click();
    await page.locator('input[placeholder="Item label"]').first().fill(`${fx.runId} FB Item`);
    await page.locator('input[placeholder="Category"]').first().fill("E2E");
    await page.getByRole("button", { name: "Save Draft" }).click();

    // Part 20 — the UI must not show an active Publish action for a
    // manage-only grant; an informational state is acceptable instead.
    await expect(page.getByRole("button", { name: "Publish", exact: true })).toHaveCount(0);
    await expect(page.getByText("Publishing requires additional permission")).toBeVisible();

    // Manage actions remain available.
    await expect(page.getByRole("button", { name: "Edit Draft" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Discard Draft" })).toBeVisible();
  });

  test("Franchise B never sees Franchise A's draft/version content (scope isolation)", async ({ page }) => {
    await loginAs(page, fx.franchiseBAdminUsername, fx.password);
    await page.goto("/dashboard/qc/templates");
    await expect(page.getByText(`${fx.runId} FA Item V1`)).toHaveCount(0);
    await expect(page.getByText(`${fx.runId} FA Item V2`)).toHaveCount(0);
  });
});
