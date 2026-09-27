import { test, expect } from "../fixtures/auth.fixture";

test("landing shows Singularity hero and account links", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Singularity" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "How it works" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Pick a model" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Create an account" })).toBeVisible();
});

test("footer shows the current year", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("contentinfo")).toContainText(
    `© ${new Date().getFullYear()} Singularity`,
  );
});
