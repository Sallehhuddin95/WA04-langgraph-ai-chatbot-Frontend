import { test, expect } from "../fixtures/auth.fixture";

async function backendUp(request: import("@playwright/test").APIRequestContext, base: string) {
  try {
    const res = await request.get(`${base}/api/chat/health`, { timeout: 3000 });
    return res.ok();
  } catch {
    return false;
  }
}

test("chat smoke @smoke", async ({ page, request, backendBaseUrl }) => {
  test.skip(
    !(await backendUp(request, backendBaseUrl)),
    "backend not running, start it with the Start backend task",
  );
  const email = `e2e-${Date.now()}@example.com`;
  const password = "password123";

  await page.goto("/signup");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill(password);
  await page.getByRole("button", { name: /create account/i }).click();
  await expect(page).toHaveURL(/\/chat/, { timeout: 15_000 });

  await expect(page.getByRole("heading", { name: "Chats" })).toBeVisible();
  const composer = page.getByRole("textbox").first();
  await expect(composer).toBeVisible();
  await composer.fill("good morning");
  await page.keyboard.press("Enter");
  await expect(page.getByText("good morning").first()).toBeVisible({ timeout: 15_000 });
});
