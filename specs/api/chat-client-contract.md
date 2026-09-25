# Chat Client Contract

## Status

Draft

## Endpoint or Operation

Backend owns these routes. Frontend only calls them:

- `POST /api/chat/threads`
- `POST /api/chat/threads/{thread_id}/turns`
- `GET /api/chat/threads/{thread_id}/turns?limit&cursor`
- `GET /api/chat/threads/{thread_id}/stream`

Contract owner: backend `specs/api/chat-api.md`. If this file and that file differ, the backend file wins. Update this file to match. Do not add frontend-only fields to the shared contract.

No `/v1` prefix. Contract evolves by additive change only per `docs/shared/versioning.md`.

## Purpose

Define what the chat feature in `src/features/chat/` may send and read. Keep client types, query keys, mutation shape, and SSE parsing aligned with the backend without redefining agent logic.

## Authentication

- server session cookies only
- send all requests with `credentials: include`
- do not store access or refresh tokens in `localStorage`
- do not place auth logic in components; auth state is display state only
- rules follow `docs/shared/authentication.md` and ADR 0003

## Request

### Params

- `thread_id: string` for turn and stream routes

### Query

- `limit: number`, default 20, max 50
- `cursor: string | null` for paging through turns

### Headers

- `Content-Type: application/json` for POST calls
- `Accept: text/event-stream` for the stream route
- cookies sent by the browser; no manual auth header

### Body

```ts
export interface CreateThreadPayload {
  title: string;
}

export interface CreateTurnPayload {
  thread_id: string;
  user_text: string;
}

export interface ListTurnsParams {
  thread_id: string;
  limit: number;
  cursor: string | null;
}
```

Zod schemas validate these shapes in `src/features/chat/` before send:

- `createThreadSchema`
- `createTurnSchema`
- `listTurnsParamsSchema`

## Response

### Success Shape

Client mirrors these backend fields verbatim. Field names stay as backend defines them.

```ts
export interface ChatCitation {
  index: number;
  source_id: string;
  title: string;
  url: string;
  span_text: string;
}

export interface ChatTurn {
  turn_id: string;
  thread_id: string;
  role: "user" | "assistant";
  user_text: string;
  reply_text: string;
  citations: ChatCitation[];
  intent_category: string;
  is_grounded: boolean;
  trace_id: string;
  created_at: string;
}

export interface CreateThreadResponse {
  thread_id: string;
  title: string;
  created_at: string;
}

export interface ListTurnsResponse {
  data: ChatTurn[];
  next_cursor: string | null;
}
```

Visible client fields are `thread_id`, `reply_text` and deltas, `citations[]`, `intent_category`, `is_grounded`, and `trace_id` for support correlation only. `trace_id` is not shown as primary UI text.

Query keys:

```ts
["chat", "threads"]
["chat", "threads", threadId]
["chat", "turns", threadId]
["chat", "turns", threadId, { limit: limit, cursor: cursor }]
```

Mutation shape:

```ts
useMutation({
  mutationFn: (payload: CreateTurnPayload) => createChatTurn(payload),
  onError: (error) => notifyChatTurnFailed(error),
});
```

`createChatTurn` lives in the feature service. Components call the hook. Routes call the feature public API from `index.ts`.

### Error Shapes

Map backend errors to client states:

- 400: validation failure, show inline composer or field message
- 401: signed out, redirect to sign-in
- 403: forbidden, show forbidden state with back action
- 404: thread not found, show empty state with thread list link
- 409: turn conflict on retry, refetch turns then offer retry once
- 500, 502, 503, 504: server failure, show inline turn retry plus toast

Never show raw stack traces or backend exception text. Copy stays in product language per `docs/shared/error-handling.md`.

## Validation Rules

- `title`: 1-120 chars, trimmed, required for create thread
- `user_text`: 1-4000 chars, trimmed, required for create turn
- `thread_id`: required, non-empty string
- `limit`: int 1-50
- `cursor`: opaque string or null; client does not parse it
- reject out-of-contract fields on send; ignore unknown read fields unless the feature needs them

## Notes

SSE parse rules:

- read stream in the feature service with `fetch` plus `ReadableStream` reader
- parse `event: delta` chunks with `data` holding `reply_text` parts
- parse `event: done` with final `ChatTurn` JSON
- parse `event: error` as failed turn with retry scope on that turn only
- close reader on stop action, route change, or `done` event
- timeout: abort stream after 60s without data, then mark turn failed with retry
- reconnect: one manual retry from the failed turn; no silent auto resend loop

Additive evolution:

- backend may add optional fields; client ignores unknown fields by default
- client must not require new fields until specs update them as required
- no breaking rename or removal without a migration note and spec update
- if a breaking change is unavoidable, it needs backend version review first
