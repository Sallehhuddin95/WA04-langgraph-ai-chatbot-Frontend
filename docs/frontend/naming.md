# Naming Convention and Code Style Guidelines

This document defines naming rules for the Next.js App Router and TypeScript codebase. The goal is to keep code predictable, searchable, and aligned with the feature-driven architecture in the frontend guideline.

---

## 1. Naming Principles

- Prefer explicit, domain-meaningful names over short or generic names.
- Optimize for searchability: one concept should keep one stable name across files.
- Keep naming consistent across layers (service, hook, component, test).
- Use suffixes only when they clarify intent, not as noise.
- Code identifiers must be English by default, even when the app UI is in another language. See `docs/shared/identifier-language.md`.

---

## 2. Directory and File Casing Matrix

| Element                             | Rule                               | Example                                         |
| ----------------------------------- | ---------------------------------- | ----------------------------------------------- |
| Next.js route folders in `src/app/` | `kebab-case` lowercase             | `src/app/billing-history/`                      |
| Route group folders                 | Parentheses + `kebab-case`         | `src/app/(auth)/`                               |
| Dynamic segments                    | Bracket syntax                     | `src/app/posts/[postId]/page.tsx`               |
| Catch-all segments                  | Bracket ellipsis syntax            | `src/app/docs/[...slug]/page.tsx`               |
| Feature folders                     | `kebab-case` lowercase             | `src/features/user-profile/`                    |
| Component files                     | `PascalCase.tsx`                   | `RevenueChart.tsx`                              |
| Hook files                          | `camelCase` with `use` prefix      | `useDashboardMetrics.ts`                        |
| Service files                       | `kebab-case` with verb/noun intent | `get-dashboard-metrics.ts`, `create-session.ts` |
| Utility files                       | `kebab-case`                       | `format-currency.ts`, `build-query-string.ts`   |
| Type files                          | `kebab-case`                       | `analytics.ts`, `auth-session.ts`               |
| Test files (unit/integration)       | `*.test.ts(x)`                     | `revenue-chart.test.tsx`                        |
| E2E specs                           | `*.spec.ts`                        | `checkout-flow.spec.ts`                         |

Notes:

- Do not use `index.tsx` for main feature components; use explicit names.
- `index.ts` is allowed only as a feature public API barrel.
- Keep application source code inside `src/`.
- Use root `public/` for static assets when the project needs them.

---

## 3. Next.js App Router Reserved Files

Always keep reserved Next.js filenames lowercase and exact:

- `page.tsx`
- `layout.tsx`
- `loading.tsx`
- `error.tsx`
- `not-found.tsx`
- `route.ts`
- `template.tsx`
- `default.tsx`
- `middleware.ts`

Use default exports only where Next.js requires them (for example `page.tsx`, `layout.tsx`, `error.tsx`, route handlers in `route.ts`).

---

## 4. TypeScript Naming Rules

### Types, Interfaces, and Enums

- Use `PascalCase` for `type`, `interface`, and enum-like constant type aliases.
- Do not prefix interfaces with `I`.
- Do not use suffixes like `Type` or `Interface` unless disambiguation is required.
- Prefer string literal unions or `as const` objects over `enum` unless enum behavior is explicitly required.

### Semantic Type Suffixes

Use these suffixes when applicable:

- `Payload`: outgoing request body
- `Response`: raw response shape from server/BFF
- `Params`: route or query input contract
- `State`: UI or store state shape
- `Schema`: zod schema variable names

```ts
export interface UserProfile {
  id: string;
  email: string;
}

export type AuthStatus = "authenticated" | "unauthenticated" | "loading";

export interface CreateUserPayload {
  email: string;
}
```

---

## 5. Variables, Functions, and Constants

### Variables and Functions

- Use `camelCase`.
- Boolean names must start with `is`, `has`, `can`, `should`, or `did`.
- Async functions should use verb-first names: `getUser`, `createSession`, `updateProfile`, `deleteInvite`.
- Event handlers should use `handle` prefix: `handleSubmit`, `handleOpenChange`.

```ts
const isLoading = true;
const hasPermission = false;

async function getDashboardMetrics() {
  // ...
}
```

### Constants

- Use `UPPER_SNAKE_CASE` for app-wide immutable constants.
- Use `camelCase` for local constants scoped to a function/component.

```ts
export const API_TIMEOUT_MS = 30000;
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
```

### Enum-Style Objects

```ts
export const USER_ROLES = {
  admin: "admin",
  manager: "manager",
  customer: "customer",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];
```

---

## 6. React Component and Hook Conventions

### Components

- Component name and filename must match (`RevenueChart` in `RevenueChart.tsx`).
- Use `PascalCase` component names.
- Prefer named exports for reusable components.
- Keep route-level files in `src/app/` as required by Next.js defaults.
- Props types should be named `{ComponentName}Props`.

```tsx
interface RevenueChartProps {
  featureId: string;
}

export function RevenueChart({ featureId }: RevenueChartProps) {
  return <div>{featureId}</div>;
}
```

### Hooks

- Hook function names must start with `use`.
- Hook filenames must match exported hook names.
- Return objects for hooks exposing multiple values.

```ts
export function useDashboardMetrics(dashboardId: string) {
  return {
    metrics: undefined,
    isLoading: false,
    hasError: false,
  };
}
```

---

## 7. Service, Query Key, and Schema Naming

### Services

- Prefer one action per function: `getDashboardMetrics`, `createInvoice`, `updateUserProfile`.
- Keep service names aligned with API intent, not UI names.

### TanStack Query Keys

- Use array keys with stable domain-first naming.
- Pattern: `['domain', 'resource', optionalId, optionalFilters]`.

```ts
["dashboard", "metrics", dashboardId][
  ("billing", "invoices", { status: "open" })
];
```

### Zod Schemas

- Schema variables end with `Schema`.
- Parsed outputs should be named as domain objects.

```ts
const createUserSchema = z.object({ email: z.string().email() });
const createUserPayload = createUserSchema.parse(input);
```

---

## 8. Import and Alias Conventions

- Use path alias imports (for example `@/features/...`) where configured.
- Prefer alias configuration where `@/` resolves to `src/`.
- Order imports consistently:
  1. external packages
  2. internal aliases
  3. relative imports
- Avoid deep cross-feature relative imports.
- Do not import from another feature's private internals; consume feature public API when exposed.

---

## 9. Test Naming Conventions

- Test title describes behavior, not implementation details.
- Use `should` style or plain behavior style consistently.
- Use clear arrange/act/assert variable naming.

Examples:

- `renders empty state when no metrics exist`
- `should submit form when input is valid`
- `redirects unauthenticated user to login`

---

## 10. Review Checklist

Use this checklist in PR reviews:

- Are route and feature folders in `kebab-case`?
- Are component and hook names aligned with file names?
- Are booleans prefixed clearly (`is`, `has`, `can`, `should`, `did`)?
- Are type names meaningful and free from `I*` prefixes?
- Are service and query key names consistent with feature domains?
- Are imports respecting feature boundaries and alias conventions?
- Are test files and test descriptions consistently named?
