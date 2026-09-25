# Chat UI

## Status

Draft

## Goal

Give signed-in users a simple chat surface to ask questions, read streamed replies, and open citations. The UI presents backend answers. It does not run the agent.

## Design Direction

- minimalist modern chat UX with blue as the single primary color
- themes: dual-theme, light by default, dark opt-in through a header toggle
- surfaces: white cards on a slate page base in light, slate-900 cards on slate-950 in dark, slate text for content in both
- stack: Tailwind CSS plus shadcn/ui components only, no custom kit
- cards: rounded-xl with a subtle border and subtle shadow
- layout: spacious message column with a sticky composer at the bottom
- no extra accent colors, no heavy gradients, no large background art
- visual tokens live in `specs/ui/chat-design.md`, which wins on visual detail

## Scope

Included:

- entry route `/chat` for new and existing threads, with nested route `/chat/[threadId]` for direct thread access
- thread list: create thread, select thread, show thread title and updated time
- composer: text input, send action, stop action while streaming, disabled state while a turn is in flight
- message list: user turns and assistant turns in time order, auto scroll on new deltas, stable scroll when user has scrolled up
- citation rendering: numbered markers in reply text linked to a citation list under the turn
- stop and retry: stop halts local stream rendering, retry resends the last user turn
- client code location: `src/app/` for routes and layouts only, `src/features/chat/` for components, hooks, services, Zod schemas, types, and `index.ts` public API
- data path: TanStack Query with `credentials: include`, SSE read in the feature service, route `error.tsx` plus `QueryCache` toasts for failures

## Out of Scope

Not included:

- prompt tuning, system prompt editing, model selection
- corpus admin, ingest control, index rebuild, chunk inspection
- graph editing, node tracing UI, checkpoint browsing
- vector search tuning, embedding settings, key management
- agent correctness judgments such as grounding scores or retrieval recall

Backend owns those concerns. See backend `specs/features/chat-agent.md`.

## Actors

- signed-in user: sends prompts, reads replies, opens citations, stops or retries turns
- server session: source of auth truth, read from server-provided state

## Preconditions

- user has a valid server session cookie
- backend chat API is reachable
- client has loaded thread list or started a new thread

## Main Flow

1. User opens `/chat`.
2. Client loads thread list through the chat feature query.
3. User selects a thread or starts a new one.
4. Client loads turns with `limit` and `cursor` paging.
5. User types a prompt in the composer and submits.
6. Client creates the turn through the feature mutation and opens the SSE stream.
7. Client appends `reply_text` deltas to the pending assistant turn.
8. Client renders final turn with `citations[]`, `intent_category`, `is_grounded`, and `trace_id` stored but not shown as raw text.
9. User opens a citation to see source title and link.

## Alternate Flows

- stop: user stops a streaming turn. Client closes the stream reader. Partial text stays marked as stopped with retry offered.
- retry: user retries a failed turn. Client resends the same user text as a new turn request.
- resume on reload: user reloads mid-thread. Client refetches thread turns and shows the last settled state.
- empty thread: new thread shows empty state with a short prompt hint.
- signed-out: auth loss redirects to sign-in per `specs/ui/chat-states.md`.
- expired session: client shows expired notice and routes to sign-in on next action.

## Error and Empty States

Full state copy and retry scope live in `specs/ui/chat-states.md`. This feature follows `docs/shared/error-handling.md`:

- route crash: route `error.tsx` with retry for that route slice
- async failure: toast plus inline retry on the failed turn only
- validation: inline composer message tied to the input field
- auth expired or forbidden: explicit notice with sign-in or back action

## Acceptance Criteria

- user can create a thread, send a turn, and read a streamed reply at `/chat`
- user can see numbered citations under grounded replies and open each source
- user can stop a streaming reply without breaking the thread view
- user can retry a failed turn from the failed turn only
- user sees empty, loading, and offline states defined in `specs/ui/chat-states.md`
- no screen exposes graph, vector, key, or checkpoint detail

## Related Specs

- API: `specs/api/chat-client-contract.md`
- UI: `specs/ui/chat-states.md`
- Visual: `specs/ui/chat-design.md`
- Acceptance: `specs/acceptance/chat-acceptance.md`
- Backend owner: backend `specs/features/chat-agent.md` and backend `specs/api/chat-api.md`
