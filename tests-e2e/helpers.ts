import { Page, expect } from "@playwright/test";

export async function loginAs(page: Page, username: string, password: string) {
  await page.goto("/login");
  await page.getByPlaceholder("Enter your username").fill(username);
  await page.getByPlaceholder("Enter your password").fill(password);
  await page.getByRole("button", { name: /log ?in/i }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
}
