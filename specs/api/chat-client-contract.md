# Chat Client Contract

## Status

Draft

## Endpoint or Operation

Backend owns these routes. Frontend only calls them:

- `POST /api/chat/threads`
- `GET /api/chat/threads`
- `PATCH /api/chat/threads/{thread_id}`
- `POST /api/chat/threads/{thread_id}/pin`
- `POST /api/chat/threads/{thread_id}/unpin`
- `POST /api/chat/threads/reorder`
- `DELETE /api/chat/threads/{thread_id}`
- `POST /api/chat/threads/{thread_id}/restore`
- `POST /api/chat/threads/{thread_id}/turns`
- `GET /api/chat/threads/{thread_id}/turns?limit&cursor`
- `DELETE /api/chat/threads/{thread_id}/turns/{turn_id}`
- `POST /api/chat/threads/{thread_id}/turns/{turn_id}/restore`
- `GET /api/chat/threads/{thread_id}/stream`
- `POST /api/chat/threads/{thread_id}/attachments`

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

- `thread_id: string` for turn, stream, attachment, delete, and restore routes
- `turn_id: string` for turn delete and restore routes

### Query

- `limit: number`, default 20, max 50
- `cursor: string | null` for paging through turns

### Headers

- `Content-Type: application/json` for POST calls with a body
- `Accept: text/event-stream` for the stream route
- multipart form with a single `file` field for attachments; no JSON header
- delete and restore calls send no body; cookies sent by the browser; no manual auth header
- all calls send `credentials: include`

### Body

```ts
export type ChatModel = "deepseek-v4-flash" | "deepseek-v4-flash-vision-exp" | "muse-spark-1.3";

export interface CreateThreadPayload {
  title: string;
}

export interface CreateTurnPayload {
  thread_id: string;
  message: string;
  model: ChatModel;
  attachment_ids: string[];
}

export interface RenameThreadPayload {
  title: string;
}

export interface PinThreadPayload {
  position?: number;
}

export interface ReorderPinnedThreadsPayload {
  thread_ids: string[];
}

export interface ListTurnsParams {
  thread_id: string;
  limit: number;
  cursor: string | null;
}
```

Turn create defaults: `model` defaults to `deepseek-v4-flash`. `attachment_ids` defaults to empty. Client sends `model` on every turn.

Attachment upload uses multipart form:

- field: `file`, single image only, max 5MB
- vision rule: `deepseek-v4-flash-vision-exp` and `muse-spark-1.3` consume images. Only plain `deepseek-v4-flash` rejects images with 422 `model_no_vision`.

Zod schemas validate these shapes in `src/features/chat/` before send:

- `createThreadSchema`
- `createTurnSchema`
- `listTurnsParamsSchema`
- `chatModelSchema`
- `threadSummarySchema`
- `listThreadsResponseSchema`
- `turnItemSchema`
- `uploadAttachmentResponseSchema`
- `renameThreadSchema`
- `pinThreadSchema`
- `reorderPinnedThreadsSchema`

## Response

### Success Shape

Client mirrors these backend fields verbatim. Field names stay as backend defines them.

```ts
export interface ChatCitation {
  chunk_id: string;
  document_id: string;
  quote: string;
}

export interface ChatAttachment {
  attachment_id: string;
  filename: string;
  mime: string;
}

export interface ThreadSummary {
  thread_id: string;
  title: string;
  updated_at: string;
  is_pinned: boolean;
  pin_order: number | null;
}

export interface ListThreadsResponse {
  threads: ThreadSummary[];
}

export interface RenameThreadResponse {
  thread_id: string;
  title: string;
  updated_at: string;
  is_pinned: boolean;
  pin_order: number | null;
}

export interface PinThreadResponse {
  thread_id: string;
}

export interface UnpinThreadResponse {
  thread_id: string;
}

export interface ReorderPinnedThreadsResponse {
  thread_ids: string[];
}

export interface ChatTurn {
  turn_id: string;
  thread_id: string;
  role: "user" | "assistant";
  text: string;
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

export interface CreateTurnResponse {
  thread_id: string;
  turn_id: string;
  reply_text: string;
  citations: ChatCitation[];
  intent_category: string;
  is_grounded: boolean;
  trace_id: string;
  attachments: ChatAttachment[];
}

export interface UploadAttachmentResponse {
  attachment_id: string;
  filename: string;
  mime: string;
  size: number;
}

export interface DeleteThreadResponse {
  thread_id: string;
}

export interface RestoreThreadResponse {
  thread_id: string;
}

export interface DeleteTurnResponse {
  turn_id: string;
}

export interface RestoreTurnResponse {
  turn_id: string;
}

export interface ListTurnsResponse {
  items: ChatTurn[];
  next_cursor: string | null;
}
```

Thread list returns pinned first by `pin_order`, then newest first for the rest. Turn history items include `citations` (empty when none). Turn create response includes `attachments`.

Rename, pin, unpin, and reorder rules:

- `PATCH /api/chat/threads/{thread_id}` body `{title: 1-120 chars}` returns 200 `{thread_id, title, updated_at, is_pinned, pin_order}`. Title trims. Empty save blocked client side.
- `POST /api/chat/threads/{thread_id}/pin` body `{}` or `{position: int >= 0}` returns 200 `{thread_id}`. Pins at the position or appends.
- `POST /api/chat/threads/{thread_id}/unpin` body `{}` returns 200 `{thread_id}`.
- `POST /api/chat/threads/reorder` body `{thread_ids: [1-5 UUIDs]}` returns 200 `{thread_ids}`. The list must hold exactly the pinned set once, else 422.
- max 5 pinned chats. Pinning a sixth returns 409 `{error: {code: pin_limit}}`. Client shows `At most 5 pinned chats.`
- unpin when already unpinned returns 409 `{error: {code: not_pinned}}`. Client shows `This chat is not pinned.`
- reorder uses optimistic order with rollback. On 422 client restores the last order and shows `Could not save the new order. Try again.`
- after rename, pin, unpin, and reorder, refresh the thread list cache.

Delete and restore rules:

- `DELETE /api/chat/threads/{thread_id}` returns 200 `{thread_id}`. Thread plus its messages soft-delete.
- `POST /api/chat/threads/{thread_id}/restore` returns 200 `{thread_id}`. Works within 10 seconds of delete.
- `DELETE /api/chat/threads/{thread_id}/turns/{turn_id}` returns 200 `{turn_id}`. Deletes one message bubble.
- `POST /api/chat/threads/{thread_id}/turns/{turn_id}/restore` returns 200 `{turn_id}`. Works within 10 seconds of delete.
- restore after 10 seconds returns 410 `{error: {code: gone}}`. Client shows `Too late to undo.` and offers no further undo.
- restore with nothing to restore returns 409 `{error: {code: not_deleted}}`. Client shows `Nothing to restore.`
- client shows an Undo toast for 10 seconds after each delete. Toast duration is exactly 10000 ms. After dismiss there is no undo path.
- after thread delete, drop its turns cache, refresh the thread list, and push `/chat` when it was the open thread. After message delete, refresh turns. After restore, refresh the same scopes.

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
- 409 `not_deleted`: restore with nothing to restore, show `Nothing to restore.`
- 409 `pin_limit`: sixth pin when 5 are pinned, show `At most 5 pinned chats.`
- 409 `not_pinned`: unpin when already unpinned, show `This chat is not pinned.`
- 410 `gone`: restore after the 10 second window, show `Too late to undo.`
- 422 `model_no_vision`: images sent with plain `deepseek-v4-flash`, show vision notice
- 422 invalid file: wrong type or too large on upload, show file notice
- 422 reorder: pinned set mismatch, restore last order and show `Could not save the new order. Try again.`
- 500, 502, 503, 504: server failure, show inline turn retry plus toast

Never show raw stack traces or backend exception text. Copy stays in product language per `docs/shared/error-handling.md`.

## Validation Rules

- `title`: 1-120 chars, trimmed, required for create thread and rename thread. Empty rename blocked client side.
- `message`: 1-4000 chars, trimmed, required for create turn
- `model`: one of `deepseek-v4-flash`, `deepseek-v4-flash-vision-exp`, `muse-spark-1.3`
- `attachment_ids`: list of UUIDs, default empty
- `thread_id`: required, non-empty string
- `turn_id`: required, non-empty string
- `limit`: int 1-50
- `cursor`: opaque string or null; client does not parse it
- `position`: int >= 0, optional for pin. Pins at the position or appends.
- `thread_ids`: 1-5 UUIDs for reorder. Must hold exactly the pinned set once.
- attachment `file`: images only, max 5MB
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
