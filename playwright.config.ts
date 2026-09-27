import { defineConfig, devices } from "@playwright/test";

const frontendPort = Number(process.env["PORT"] ?? 3000);

export default defineConfig({
  testDir: "e2e/specs",
  fullyParallel: true,
  retries: process.env["CI"] ? 1 : 0,
  reporter: process.env["CI"] ? "dot" : "list",
  use: {
    baseURL: `http://localhost:${frontendPort}`,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `npm run dev -- --port ${frontendPort}`,
    url: `http://localhost:${frontendPort}`,
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
