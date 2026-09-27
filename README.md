# Frontend

Chat UI for the LangGraph chatbot. It owns display and input only. It holds no agent logic.

## Owns

- Next.js App Router with TypeScript
- One feature: `src/features/chat`
- Chat screens, hooks, and client calls
- Theme toggle with light default plus dark mode

Backend owns the contract. This repo follows it, it does not extend it.

## Stack

- Next.js App Router with TypeScript
- Tailwind plus shadcn/ui
- TanStack Query for server state
- next-themes for light default plus dark

## Design

Blue minimalist chat. Light theme by default. Dark theme via toggle. Rules live in `specs/ui/chat-design.md`.

## Folder map

- `src/app/` : routes, layout, theme wiring
- `src/features/chat/` : UI, hooks, API client, types
- `src/components/ui/` : shared primitives only

No other feature folders for now. Keep shared UI free of chat logic.

## Run

```sh
npm install
npm run dev
```

Set `NEXT_PUBLIC_API_URL` to point at the backend.

## Specs

- `specs/features/chat-ui.md`
- `specs/ui/chat-design.md`
- `specs/ui/chat-states.md`
- `specs/api/chat-client-contract.md`
- `specs/README.md`

Contract source: backend `specs/api/chat-api.md` is the owner. On mismatch, fix the client first.

## Governance

- `CONSTITUTION.md`
- `docs/architecture/system-overview.md`
- `docs/adr/README.md`
