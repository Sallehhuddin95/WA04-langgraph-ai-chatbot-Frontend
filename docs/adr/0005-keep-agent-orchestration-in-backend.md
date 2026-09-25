# 0005 Keep Agent Orchestration in Backend

## Status

Accepted

## Context

Project 2 is a LangGraph Agentic RAG Chatbot with two repos. Backend owns HTTP truth and graph detail. Frontend owns chat UX only.

Without a clear rule, agent logic can drift into the client. Graph steps, vector lookup, model keys, and checkpoint state would then live in browser code. That raises security risk and splits orchestration across two repos.

Backend ADRs 0005-0008 already define graph ownership, retrieval policy, run state, and streaming truth on the server. Frontend needs a matching rule that points to those ADRs instead of restating them.

## Decision

Keep all agent orchestration in the backend. Frontend implements chat presentation and delivery only.

Frontend structure for this decision:

- `src/app/` holds routes and layouts only.
- `src/features/chat/` holds components, hooks, services, Zod schemas, types, and `index.ts` public API.
- TanStack Query calls the backend with `credentials: include`.
- SSE parsing lives in the feature service, not in components or routes.
- Route `error.tsx` plus `QueryCache` toasts handle client failures.

Frontend must not contain graph definitions, vector stores, model keys, checkpoint reads or writes, prompt tuning logic, or corpus admin. It must reference backend specs for contract truth. It must not redefine agent behavior.

Related sources:

- backend ADRs 0005-0008 for graph, retrieval, state, and streaming decisions
- backend `specs/api/chat-api.md` for HTTP contract ownership
- `docs/architecture/module-boundaries.md` and `dependency-rules.md` for feature boundaries
- `docs/frontend/FRONTEND_GUIDELINE.md` for feature layout and query handling
- ADR 0001 for feature-driven frontend, ADR 0003 for server sessions

## Consequences

Benefits:

- one owner for agent behavior
- smaller client surface with fewer secrets near browser code
- clear fit with feature boundaries and dependency direction
- simpler review: UX changes stay in frontend, agent changes stay in backend

Costs and tradeoffs:

- frontend depends on backend availability for chat behavior changes
- SSE and retry handling still need care in the feature service
- frontend types can lag backend specs if updates are missed

## Alternatives Considered

### Thick client with direct graph or vector access

Rejected because it spreads orchestration across repos. It exposes keys and store access to the client. It conflicts with server session auth in `docs/shared/authentication.md` and ADR 0003.

### Duplicate agent contracts in frontend specs

Rejected because two owners for one contract cause drift. Backend `specs/api/chat-api.md` stays owner. Frontend `specs/api/chat-client-contract.md` only mirrors client use.

### Raw fetch calls from components or routes

Rejected because it bypasses the feature boundary in ADR 0001 and `docs/frontend/FRONTEND_GUIDELINE.md`. All transport stays behind the chat feature service.
