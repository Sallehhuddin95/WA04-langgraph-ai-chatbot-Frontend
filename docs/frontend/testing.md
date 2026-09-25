# Testing Guidelines and Architecture

This document defines the project testing strategy for a Next.js App Router codebase using Vitest, React Testing Library (RTL), Mock Service Worker (MSW), and Playwright.

The goal is predictable, fast feedback while preserving confidence across feature-level behavior and end-user flows.

---

## 1. Testing Layers

Use a strict layered strategy to prevent overlap and flaky tests.

| Layer       | Purpose                                               | Tools              | Directory            | Must Not Depend On                          |
| ----------- | ----------------------------------------------------- | ------------------ | -------------------- | ------------------------------------------- |
| Unit        | Pure logic, utilities, data transforms                | Vitest             | `tests/unit/`        | DOM, network, real timers, global providers |
| Integration | Component behavior, async UI, query/cache interaction | Vitest + RTL + MSW | `tests/integration/` | Real backend services                       |
| E2E         | Full browser workflows and route transitions          | Playwright         | `e2e/specs/`         | Internal implementation details             |

---

## 2. Directory Contract

Testing structure must follow:

```text
tests/
  unit/
  integration/
  shared/
    fixtures/
    factories/
    handlers/
e2e/
  fixtures/
  factories/
  specs/
```

Rules:

- Unit and integration tests must share modular fixtures and factories from `tests/shared/`.
- Organize shared test support into small focused modules under `tests/shared/fixtures/` and `tests/shared/factories/` instead of large catch-all helpers.
- Place reusable MSW handlers and related test support in `tests/shared/handlers/` or another equally explicit shared testing module.
- Keep Playwright fixtures and factories inside `e2e/` only.
- E2E fixtures and factories must not be imported into unit or integration tests.
- Do not import Playwright helpers into Vitest suites.

### Shared Testing Ownership

- `tests/unit/` and `tests/integration/` share the same test support surface under `tests/shared/`.
- `tests/shared/fixtures/` should hold reusable render/setup fixtures, provider wrappers, and test context helpers for Vitest-based suites.
- `tests/shared/factories/` should hold deterministic data builders for component, hook, and service tests.
- `e2e/fixtures/` and `e2e/factories/` are separate and owned by Playwright flows only.
- Do not collapse Vitest and Playwright support into one shared test utility layer.

---

## 3. Naming Conventions for Tests

- Unit and integration files: `*.test.ts` or `*.test.tsx`
- E2E files: `*.spec.ts`
- Test names must describe behavior, not implementation.

Good examples:

- `renders empty state when no metrics are available`
- `shows validation errors when form is invalid`
- `redirects unauthenticated user to login`

---

## 4. Arrange, Act, Assert (AAA)

Use the Arrange, Act, Assert structure in all test layers unless a table-driven pattern is clearly better.

- Arrange:
  - Create input data, render components, configure mocks, and prepare fixtures.
- Act:
  - Perform the single user action or function call under test.
- Assert:
  - Verify the observable result.

Rules:

- Keep one primary behavior per test.
- Avoid mixing multiple unrelated actions in the same test.
- Prefer blank lines or short comments to separate the three phases when helpful.

```ts
describe("formatCurrency", () => {
  it("formats USD values", () => {
    // Arrange
    const amount = 1250;

    // Act
    const result = formatCurrency(amount);

    // Assert
    expect(result).toBe("$1,250.00");
  });
});
```

For RTL and Playwright tests, the same structure still applies:

- Arrange: render page/component and set up mocks or fixtures.
- Act: click, type, submit, navigate.
- Assert: verify visible behavior or navigation outcome.

---

## 5. Red, Green, Refactor

Prefer the red-green-refactor loop when building or changing behavior.

- Red:
  - Write or update a failing test that captures the intended behavior.
- Green:
  - Implement the smallest change that makes the test pass.
- Refactor:
  - Improve names, duplication, structure, and composition while keeping tests green.

Guidance:

- Use this loop especially for utilities, feature hooks, form validation, and bug fixes.
- For UI work, start from the smallest stable user-visible behavior instead of trying to test the whole flow at once.
- Refactoring must not widen scope into unrelated cleanup unless it directly improves the tested slice.

---

## 6. Unit Testing Standards

Unit tests target deterministic logic only.

Requirements:

- No React rendering.
- No network calls.
- No dependency on app providers.
- No `as unknown as` unsafe casting.
- Reuse shared factories from `tests/shared/factories/` when test data would otherwise be duplicated.
- Reuse shared fixtures from `tests/shared/fixtures/` only when they support deterministic unit setup without introducing UI or network coupling.

```ts
// tests/unit/format-currency.test.ts
import { describe, expect, it } from "vitest";
import { formatCurrency } from "@/utils/format-currency";

describe("formatCurrency", () => {
  it("formats USD values", () => {
    expect(formatCurrency(1250)).toBe("$1,250.00");
    expect(formatCurrency(0)).toBe("$0.00");
  });
});
```

---

## 7. Integration Testing Standards

Integration tests verify user-visible behavior for client components and async state transitions.

Requirements:

- Render with RTL.
- Mock network via MSW only.
- Use a dedicated QueryClient test provider.
- Set `onUnhandledRequest: 'error'` to fail unexpected calls.
- Reuse modular factories and fixtures from `tests/shared/` instead of redefining render setup or test data per file.

### Shared Query Provider Fixture

```tsx
// tests/shared/fixtures/query-test-provider.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

export function QueryTestProvider({ children }: { children: ReactNode }) {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
```

### Global Vitest Setup

```ts
// vitest.setup.ts
import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "./tests/shared/handlers/server";

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
```

### Integration Test Example

```tsx
// tests/integration/dashboard-view.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DashboardView } from "@/features/dashboard/components/DashboardView";
import { QueryTestProvider } from "../shared/fixtures/query-test-provider";

describe("DashboardView", () => {
  it("renders metrics from mocked API handlers", async () => {
    render(
      <QueryTestProvider>
        <DashboardView />
      </QueryTestProvider>,
    );

    expect(await screen.findByText(/total revenue/i)).toBeInTheDocument();
  });
});
```

---

## 8. End-to-End Testing Standards

E2E tests validate critical user journeys in real browser contexts.

Requirements:

- Cover authentication, authorization, and primary conversion flows.
- Prefer role-based locators (`getByRole`) and stable `data-testid` selectors.
- Avoid brittle selectors tied to cosmetic text when possible.
- Use isolated fixtures for authenticated and unauthenticated states.
- Keep Playwright fixtures modular under `e2e/fixtures/`.
- Keep Playwright data builders, seeds, and browser-flow factories under `e2e/factories/`.
- Do not reuse Vitest `tests/shared/` fixtures or factories inside Playwright suites.

### Auth Fixture Example

```ts
// e2e/fixtures/auth.fixture.ts
import { test as base } from "@playwright/test";

export const test = base.extend<{
  authenticatedPage: import("@playwright/test").Page;
}>({
  authenticatedPage: async ({ page }, use) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("developer@internal.local");
    await page.getByLabel("Password").fill("SuperSecurePassword123");
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL("/dashboard");
    await use(page);
  },
});
```

### E2E Spec Example

```ts
// e2e/specs/dashboard.spec.ts
import { expect } from "@playwright/test";
import { test } from "../fixtures/auth.fixture";

test.describe("Dashboard", () => {
  test("redirects anonymous users to login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL("/login");
  });

  test("shows analytics after successful auth", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/dashboard");
    await expect(authenticatedPage.getByTestId("revenue-chart")).toBeVisible();
  });
});
```

---

## 9. What to Test for Each Change

Choose the smallest sufficient layer, then add broader coverage only when risk requires it.

- Utility or pure transform change:
  - Add or update unit tests.
- Client component state/async rendering change:
  - Add or update integration tests.
- Route protection, multi-step journey, or production-critical flow:
  - Add or update E2E test.

---

## 10. Flake Prevention Rules

- Do not use arbitrary sleeps (`setTimeout`, fixed waits).
- Use async assertions (`findBy*`, `waitFor`, Playwright auto-waiting).
- Reset handlers and shared state between tests.
- Avoid asserting implementation internals (component state, private methods).
- Keep tests independent and order-agnostic.

---

## 11. CI Expectations

Minimum merge quality gate:

- Unit and integration test suites pass.
- E2E smoke suite passes for protected critical flows.
- No skipped tests in changed areas unless documented in PR notes.

Recommended scripts:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:unit": "vitest run tests/unit",
    "test:integration": "vitest run tests/integration",
    "test:e2e": "playwright test",
    "test:e2e:smoke": "playwright test --grep @smoke"
  }
}
```

---

## 12. PR Review Checklist for Testing

- Is the test layer appropriate for the change scope?
- Does each test follow a clear Arrange, Act, Assert structure?
- Was the change developed with a red-green-refactor loop when practical?
- Are network interactions mocked with MSW in integration tests?
- Are selectors robust and accessibility-oriented where possible?
- Are failure messages understandable and behavior-focused?
- Are fixtures/factories reused instead of duplicated ad hoc setup?
- Are tests deterministic and free of timing hacks?
