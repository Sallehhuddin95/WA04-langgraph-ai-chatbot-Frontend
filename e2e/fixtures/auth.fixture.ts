import { test as base } from "@playwright/test";

interface AuthFixtures {
  backendBaseUrl: string;
}

export const test = base.extend<AuthFixtures>({
  backendBaseUrl: [
    process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:8000",
    { option: true },
  ],
});

export { expect } from "@playwright/test";
