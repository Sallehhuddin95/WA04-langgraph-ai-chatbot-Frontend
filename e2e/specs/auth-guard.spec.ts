import { test, expect } from "../fixtures/auth.fixture";

test("chat routes guard to login without a session", async ({ page }) => {
  await page.goto("/chat");
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});

test("login form flags empty fields inline", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
});

test("signup page links back to login", async ({ page }) => {
  await page.goto("/signup");
  await expect(page.getByRole("link", { name: /sign in/i }).first()).toBeVisible();
});
