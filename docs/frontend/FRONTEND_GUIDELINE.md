# Frontend Architecture and Development Guidelines

This document defines architecture, folder structure, rendering strategy, state boundaries, error handling, and testing standards for this Next.js project.

All code in this repository must use TypeScript with strict mode enabled.

Prefer the latest stable version of frameworks and libraries when introducing or upgrading dependencies, as long as doing so does not create known compatibility or peer dependency issues in the target project.

---

## 1. Core Tech Stack

### Production

- Framework: Next.js (App Router)
- Language: TypeScript (strict mode)
- Data fetching and caching: TanStack Query (v5+)
- Styling and design system: Tailwind CSS + shadcn/ui

### Dependency Version Policy

- Prefer the latest stable version of major frameworks and libraries when starting a new project or making planned upgrades.
- Do not upgrade blindly when a dependency introduces known compatibility, peer dependency, build, or runtime issues.
- If a project intentionally stays below the latest stable version, document the reason in the relevant repo or upgrade note.

### Testing

- Unit testing: Vitest
- Integration testing: Vitest + React Testing Library (RTL) + Mock Service Worker (MSW)
- End-to-end testing: Playwright

---

## 2. Design Principles

Apply these principles pragmatically. They are guardrails for maintainable frontend systems, not reasons to over-engineer simple code.

### DRY

- Avoid copy-pasting business logic, query logic, validation rules, and UI behavior across features.
- Do not abstract too early. Duplicate twice if needed, then extract when reuse is real and stable.
- Prefer extracting shared logic into small hooks, services, utilities, or feature-level helper modules.

### Frontend-Scoped SOLID

- Single responsibility:
  - Components render UI.
  - Hooks manage reusable stateful behavior.
  - Services perform data access.
  - Schemas validate input.
- Open/closed:
  - Extend behavior through composition, configuration, and small wrappers instead of editing large shared components for every variation.
- Liskov substitution:
  - Variants of shared UI components must preserve expected behavior and prop contracts.
- Interface segregation:
  - Keep props and function signatures narrow; do not pass oversized configuration objects when a smaller contract is enough.
- Dependency inversion:
  - UI should depend on stable service and contract boundaries, not raw fetch details spread across components.

### Practical Rules

- Prefer composition over inheritance.
- Prefer explicit dependencies over hidden cross-module coupling.
- Keep files small enough that their responsibility is obvious.

---

## 3. Feature-Driven Folder Structure

Use domain and feature-driven architecture. Put application source code under `src/`. Code for a business capability belongs in its feature folder under `src/features/`. Global folders are for reusable cross-domain utilities only.

Keep static assets at the repo root in `public/` when needed. Use `public/` for images, icons, fonts, manifests, and similar publicly served files. Do not place application source code in `public/`.

```text
├── public/                       # Static assets served as-is when needed
├── src/
│   ├── app/                      # Next.js App Router: routing and layouts only
│   │   ├── layout.tsx            # Root application layout
│   │   ├── page.tsx              # Home route
│   │   └── dashboard/
│   │       └── page.tsx          # Route component that imports feature views
│   ├── components/               # Global, domain-agnostic UI
│   │   ├── ui/                   # shadcn/ui primitives
│   │   └── layout/               # App-wide layout blocks
│   ├── features/                 # Business domains
│   │   ├── auth/
│   │   └── dashboard/
│   │       ├── components/       # Feature-scoped components
│   │       ├── hooks/            # Feature-scoped hooks
│   │       ├── services/         # Feature-scoped API clients/BFF handlers
│   │       ├── types/            # Feature-scoped types
│   │       └── index.ts          # Feature public API barrel
│   ├── hooks/                    # Global reusable hooks
│   ├── lib/                      # Shared library initialization/config
│   ├── utils/                    # Pure helper functions
│   ├── types/                    # Global, domain-agnostic types
│   └── tests/
│       ├── unit/                 # Unit test suites
│       ├── integration/          # Integration tests with RTL + MSW
│       └── shared/               # Shared modular fixtures, factories, handlers for unit/integration
└── e2e/
  ├── fixtures/                 # Playwright-only fixtures/page objects
  ├── factories/                # Playwright-only data factories/seed helpers
  └── specs/                    # E2E specs (*.spec.ts)
```

### Rule of Co-Location

If a component, hook, service, or type is used by only one feature, keep it inside that feature. Move code to global folders only when at least two independent features reuse it.

---

## 4. TypeScript Type and Interface Management

Use a strict two-tier type model to avoid uncontrolled global type growth.

### Tier 1: Global Types (`/src/types`)

- Purpose: Abstract, data-agnostic structures used across multiple features.
- Examples: API envelopes, paginated responses, common table states, metadata contracts.

```ts
// /src/types/api.ts
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    totalItems: number;
    currentPage: number;
    totalPages: number;
  };
}
```

### Tier 2: Feature Types (`/src/features/[feature-name]/types`)

- Purpose: Business-domain models local to one feature.
- Examples: User entities, feature payloads, form contracts.

```ts
// /src/features/dashboard/types/analytics.ts
export interface DashboardMetrics {
  totalRevenue: number;
  activeUsers: number;
  growthRate: number;
}
```

### Safeguards

- Isolated imports: Do not directly import one feature's types into another feature.
- Hoist only when needed: If a type becomes broadly shared, move it to `/src/types/common.ts` (or another explicit shared location).
- Token choice:
  - Prefer `interface` for extendable object contracts.
  - Prefer `type` for unions, intersections, primitive aliases, and tuples.

---

## 5. Rendering Strategies and BFF Data Flow

The Next.js App Router acts as a Backend-for-Frontend (BFF), keeping orchestration and sensitive aggregation logic on the server.

### Architectural Matrix

| Strategy                | Primary Use Case                                                      | Data Fetching Mechanism                                                   |
| ----------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Server Components (RSC) | Default for initial route rendering, SEO pages, metadata-driven views | Direct `async/await` `fetch()` in Server Components against BFF endpoints |
| Client Components (CC)  | Interactive dashboards, forms, real-time UI                           | TanStack Query `useQuery` and `useMutation` with client fetchers          |
| SSG/ISR                 | Semi-static content (terms, docs, help pages)                         | Cached server fetch with explicit `revalidate` windows                    |

### Hybrid Prefetching (Hydration Boundary)

To combine fast first paint with rich client interactivity:

1. Create a server-side `QueryClient` in an async server container.
2. Prefetch required queries with `queryClient.prefetchQuery()`.
3. Wrap the client subtree in `<HydrationBoundary state={dehydrate(queryClient)}>`.
4. Let Client Components consume prefilled cache on first render.

### SEO for Public Routes

Apply SEO work only to public or indexable routes. Internal dashboards, account-only pages, and operational screens do not need full SEO treatment.

- Prefer Server Components for indexable content so primary content is available at render time.
- Use Next.js metadata APIs for `title`, `description`, canonical URLs, Open Graph, and Twitter cards where relevant.
- Use semantic HTML landmarks and heading structure.
- Ensure links and buttons use correct HTML semantics.
- Add structured data only when it improves search understanding for the page type.
- Avoid client-only content as the sole source of critical page meaning.
- Keep URLs clean, stable, and human-readable.

---

## 6. Unified Error Handling Architecture

Use a three-layer error model to preserve UX resilience.

### Layer 1: Server-Side Boundaries (RSC)

- Handle server crashes (database timeouts, invalid upstream payloads, render faults) in route-level `error.tsx` boundaries.
- Keep unaffected UI segments functional and provide retry actions.
- Use the smallest practical boundary scope so one broken section does not take down the whole route tree.
- Show fallback UI that explains what failed in user language and gives a safe next action such as retry, refresh, or return to a stable page.

### Layer 2: Client Async and Network Errors (TanStack Query)

- Configure global handling through centralized `QueryCache` and `MutationCache` callbacks.
- Surface failures via non-blocking UI feedback (banner/toast).
- Add client-side error boundaries around unstable or third-party-heavy interactive areas when a render failure should be isolated from the rest of the screen.
- Never expose raw stack traces, internal error codes, or backend exception text directly to end users.
- Error messages must be actionable, concise, and empathetic. Explain what happened in product language and, when possible, what the user can do next.

### Layer 3: Form and Input Validation

- Validate inputs with TypeScript-first schema validation (Zod).
- Catch parse and validation failures in the local form layer before network submission.
- Map validation errors to the exact field or form section that needs correction.
- Prefer specific guidance such as `Email address is required` over generic messages such as `Invalid input`.

---

## 7. State Management Boundaries

Separate state into clear ownership zones:

- Server state:
  - Managed by Next.js caches (RSC paths) and TanStack Query (client paths).
  - Do not duplicate server state into local `useState` unless strictly required.
- UI state:
  - Local interaction state (accordion open state, form draft mode, checkbox toggles).
  - Managed with React `useState` or `useReducer`.
- Global UI state:
  - Thin cross-app concerns (navigation collapse, theme mode).
  - Managed in isolated Zustand stores.

---

## 8. Performance and Loading Strategy

Optimize performance with architectural decisions first, then apply targeted micro-optimizations only when they solve a real problem.

### Rendering First

- Prefer Server Components for initial content and data orchestration.
- Keep Client Components limited to interactive surfaces.
- Avoid moving logic to the client unless it improves UX or is required for interactivity.

### Memoization Rules

- Do not add `useMemo`, `useCallback`, or `React.memo` by default.
- Add memoization only when:
  - an expensive calculation repeats on render
  - a stable reference is required for a dependency-sensitive child or hook
  - profiling or observable behavior shows rerender cost is meaningful
- Prefer simplifying component structure before adding memoization layers.

### Lazy Loading and Code Splitting

- Lazy load heavy client-only features such as charts, editors, maps, modals, and large third-party widgets.
- Split code by route, feature, or clearly heavy UI boundaries.
- Do not lazy load critical above-the-fold public content unless the tradeoff is justified.

### Data Loading Discipline

- Paginate, cursor-load, or incrementally load large datasets instead of fetching everything at once.
- Prefetch only data the user is likely to need soon.
- Avoid duplicate fetching across server and client for the same data.
- Use TanStack Query cache settings and Next.js revalidation intentionally, not with default values by habit.

### Large Lists and Repeated UI

- Virtualize very large lists or grids when rendering cost becomes significant.
- Keep item and row components small and predictable.

---

## 9. Testing Support Boundaries

Use modular testing support with clear ownership by test layer.

- `src/tests/shared/` is the shared support surface for unit and integration tests.
- Put reusable Vitest/RTL fixtures in `src/tests/shared/fixtures/`.
- Put reusable deterministic data builders in `src/tests/shared/factories/`.
- Put shared MSW handlers and related network test support in `src/tests/shared/handlers/`.
- Keep Playwright support separate under `e2e/fixtures/` and `e2e/factories/`.
- Do not mix Vitest shared support with Playwright support.
- Avoid repeated sorting, filtering, or mapping work inside deep render trees when it can be moved earlier or cached intentionally.

### Assets and Perceived Performance

- Use optimized images and responsive sizing.
- Defer non-critical scripts and heavy non-essential UI.
- Keep loading, retry, and background refresh states localized so the whole screen does not block unnecessarily.

---

## 10. Authentication and Authorization

Prefer simple, secure defaults for web authentication. The frontend must treat authentication as a server-backed security concern first, and a UI state concern second.

### Preferred Default

- Prefer server-managed session cookies for web authentication.
- Use secure, `httpOnly`, and appropriately scoped cookies.
- Treat the server as the source of truth for authentication and authorization.

### OAuth and OpenID Connect

- Use OAuth 2.0 with OpenID Connect when third-party login, enterprise SSO, or delegated identity is required.
- After login, prefer converting identity into a secure server-managed session for the web app when architecture allows.
- Do not choose OAuth 2.0 or JWT in the browser by default when a simpler cookie-backed session model is sufficient.

### Token Handling Rules

- Do not store access tokens or refresh tokens in `localStorage`.
- Avoid exposing long-lived credentials to client JavaScript.
- If tokens are required by architecture, keep refresh handling on the server whenever possible.

### Authorization Rules

- Perform authorization checks on the server whenever possible.
- Treat client-side guards as UX improvements, not the primary security boundary.
- Expose only the minimum user/session information needed by Client Components.

### Practical Guidance

- Use middleware, route handlers, and Server Components for auth-aware routing and protected content.
- Keep permission logic centralized and consistent across routes and features.
- Design unauthenticated, unauthorized, expired-session, and forbidden states as explicit user flows.

---

## 11. Testing Architecture Overview

Keep testing layers explicit by responsibility.

### Vitest Environment (`/tests`)

- Unit tests (`/tests/unit`):
  - Validate pure logic, utilities, transforms, and calculations.
  - No server bootstrapping or live API access.
- Integration tests (`/tests/integration`):
  - Validate component behavior and state interactions with RTL.
  - Mock API traffic with MSW.
- Shared toolkit (`/tests/shared`):
  - Shared factories, mock models, and MSW handlers.

### Playwright Environment (`/e2e`)

- E2E specs (`/e2e/specs`):
  - Validate real user flows in browser contexts.
- E2E toolkit (`/e2e/fixtures` and `/e2e/factories`):
  - Store Playwright fixtures and test data helpers.
  - Keep isolated from Vitest runtime concerns.

---

## Dedicated Guides

For naming and testing details, refer to:

- `naming.md`: naming rules, casing, symbols, and token conventions.
- `testing.md`: setup patterns, MSW examples, and Playwright practices.
