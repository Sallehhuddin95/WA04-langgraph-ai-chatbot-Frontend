# Todolist - LangGraph AI Chatbot

Saved: 2026-09-26. Read this first after session restart.

## Session Context

- Frontend repo: `WA04-langgraph-ai-chatbot-Frontend`. No `package.json`, no `src/`. Specs only, all Draft.
- Backend repo: `WA04-langgraph-ai-chatbot-Backend`. Routes plus schemas plus mock service exist. Repos plus real LLM calls not done.
- Frontend env: `.env.local` has `NEXT_PUBLIC_API_URL=http://localhost:8000`.
- Backend env: `.env` has `DATABASE_URL`, `OPENAI_API_KEY` (opencode service key), `MODEL_ROUTER=deepseek-v4-flash`, `MODEL_GENERATOR=muse-spark-1.3`, `EMBEDDING_MODEL=text-embedding-3-small`.
- Inference base: `https://opencode.ai/inference/openai/v1`. Auth is `Authorization: Bearer <opencode key>`. Docs: `https://opencode.ai/v2/docs/console/inference`. Live models: `https://opencode.ai/inference/v1/models`.
- Confirmed live IDs: `deepseek-v4-flash`, `muse-spark-1.3`, `deepseek-v4-flash-vision-exp`.
- Sign-in route: `/login`. Frontend redirects here on 401.
- Auth model: server session cookies only, `credentials: include`. No tokens in `localStorage`.
- Contract owner: backend `specs/api/chat-api.md` wins over frontend `specs/api/chat-client-contract.md`.
- Vision deferred: `deepseek-v4-flash-vision-exp` exists but graph is text only. Do not wire vision yet.
- Embeddings deferred: opencode inference docs list no embeddings endpoint. `retriever.py` is still keyword stub. Keep `EMBEDDING_MODEL` as placeholder.

## Contract Mismatches To Fix

- [ ] Stream path differs. Frontend spec says `GET /api/chat/threads/{thread_id}/stream`. Backend spec plus `routes/chat.py` say `GET /api/chat/threads/{thread_id}/turns/{turn_id}/stream`. Use backend path.
- [ ] Turn create body differs. Frontend spec uses `user_text`. Backend uses `message` plus `idempotency_key`. Use backend names.
- [ ] List turns shape differs. Frontend spec uses `data`. Backend uses `items`. Use backend names.
- [ ] Citation shape differs. Frontend has `index, source_id, title, url, span_text`. Backend has `chunk_id, document_id, quote`. Use backend names.
- [ ] Error codes differ. Backend adds `422, 429, 502, 504`. Frontend client must map all of them.

## Frontend Left (0 Percent Code)

- [ ] Scaffold Next.js App Router plus TypeScript plus Tailwind plus shadcn/ui plus TanStack Query plus next-themes plus Zod. No `src/` exists yet.
- [ ] Add `src/app/` routes: `/chat`, `/chat/[threadId]`, layout with theme toggle (light default, dark opt-in), `error.tsx` per route slice.
- [ ] Add `src/features/chat/` public API `index.ts`: components, hooks, service, schemas, types.
- [ ] Add chat UI: thread list, composer with send plus stop plus disabled state, message list with auto scroll, citation list with numbered markers.
- [ ] Add data path: queries `["chat", "turns", threadId]`, mutation `createChatTurn`, SSE reader with `fetch` plus `ReadableStream` (delta, done, error events, 60s timeout, one manual retry, close on stop or route change).
- [ ] Add Zod schemas: `createThreadSchema`, `createTurnSchema`, `listTurnsParamsSchema`. Validate before send.
- [ ] Add states per `specs/ui/chat-states.md`: empty, loading, offline, stopped, failed turn retry, 401 to `/login`, 403 with back action, 404 with thread list link, 409 refetch then retry once, 5xx inline retry plus toast.
- [ ] Add frontend tests per `docs/frontend/testing.md`: hook tests, SSE parse tests, state tests.
- [ ] Update specs from Draft to Accepted once implemented.

## Backend Left

Config:
- [ ] Add `OPENAI_BASE_URL` to `.env.example` plus `src/app/core/config.py`. Default `https://opencode.ai/inference/openai/v1`. Current config has no base URL field.
- [ ] Run `uv sync` plus `uv run alembic upgrade head`. Verify Postgres plus pgvector reachable via `DATABASE_URL`.

Persistence (all raise `NotImplementedError` now):
- [ ] Implement `ConversationRepository`: get_thread, create_thread, find_turn_by_idempotency_key, list_turns, add_message.
- [ ] Implement `DocumentRepository.search_chunks` with `ORDER BY embedding <=> :vec LIMIT :k`.
- [ ] Swap `CheckpointAdapter` in-memory dict for `langgraph-checkpoint-postgres` keyed by thread_id. Keep 50 per thread or 30 day rule.
- [ ] Swap `ChatService` in-memory dicts for DB repos. Keep 24h idempotency scope plus rate limits (60 turns per min, 10 threads per min).

Graph LLM swap (all mocks now):
- [ ] Router: replace heuristic in `router.py` with `MODEL_ROUTER` (`deepseek-v4-flash`) call. Keep `classify_intent` signature.
- [ ] Retriever: replace `search_stub` in `retriever.py` with embedding plus pgvector recall. Keep top-k rule (5 rag, 8 complex, 0 simple).
- [ ] Grader: replace keyword overlap in `grader.py` with `MODEL_ROUTER` grading call. Keep `MAX_RETRIES = 2`.
- [ ] Generator: replace mock in `generator.py` with `MODEL_GENERATOR` (`muse-spark-1.3`) call. Keep citation rule.
- [ ] Graph: replace `ChatGraphRunner` mock in `graph.py` with real LangGraph `StateGraph` (router, retriever, grader, generator, conditional edges, retry loop, postgres saver).

Auth plus app wiring:
- [ ] Swap `resolve_owner_id` stub in `chat_service.py` for real secure httpOnly cookie plus session store lookup.
- [ ] Add CORS in `main.py` for frontend origin with credentials. Add session middleware if needed.
- [ ] Confirm SSE `stream_turn` emits `citation` events (route currently emits only delta plus done).

Tests:
- [ ] Keep `tests/test_chat_flow.py` passing after each swap.
- [ ] Add contract tests for 400, 401, 403, 404, 422, 429, 502, 504 shapes.
- [ ] Add DB integration tests for repos plus pagination plus idempotency.
- [ ] Add SSE test for delta ordering plus done flags.

## Backend Progress 2026-09-26 (done, tests: 10 pass plus 1 skip)

- [x] Config: `OPENAI_BASE_URL` added to `.env.example` plus `config.py` (default `https://opencode.ai/inference/openai/v1`).
- [x] CORS in `main.py` for `http://localhost:3000` with credentials. Session stub kept (no users table or login route in spec).
- [x] Repos implemented: `ConversationRepository` (thread CRUD, idempotency lookup, offset paging) plus `DocumentRepository.search_chunks` (cosine order).
- [x] Model bugfix: `document_chunks.py` shadowed sqlalchemy `text` with its `text` column. Fixed via `sql_text` alias.
- [x] LLM swap with mock fallback: new `services/llm_client.py` (opencode inference via openai lib, TimeoutError to 504, other errors to 502). Router, grader, generator try the model when `OPENAI_API_KEY` is set, else use current mocks. Tests stay green without keys.
- [x] SSE: `stream_turn` now emits `citation` events. `StoredTurn` stores citations.
- [x] New tests in `tests/test_backend_progress.py`: base URL default, CORS origins, LLM fallback, stream with and without citations.
- Tests: `python -m pytest -q` gives 10 passed, 1 skipped (pgvector-gated).

## Backend Progress 2026-09-26 part 2 (vector deferred, non-vector migrated)

Decision: pgvector is deferred. StackBuilder for PG18 lists no pgvector package, Docker needs a VM the laptop has not activated, and no compiler toolchain is installed. Vector recall also needs an embedding source plus ingest pipeline, neither of which exists yet. So the vector table waits while everything else goes live.

- [x] `0001` now installs `pgcrypto` only. `0003` owns `CREATE EXTENSION vector` plus `document_chunks`.
- [x] `alembic upgrade 0002` applied on `localhost:5433` (`threads`, `messages`, indexes, checks).
- [x] `ConversationRepository` verified live: thread create plus get, cross-owner miss, idempotency lookup, paging order, cleanup.
- [x] `specs/database/chat-persistence.md` migration plan updated to match.
- Tests: 10 passed, 1 skipped (unchanged).

## Backend Blocked (needs user action)

- [ ] LATER: pgvector on the DB host (StackBuilder package, source build, or Docker). Then run `alembic upgrade head` to apply `0003` (vector ext plus `document_chunks`) and verify `DocumentRepository.search_chunks` live.
- [ ] NEXT: switch routes from in-memory `default_service` to DB-backed service for threads, turns, history, and stream. Repos are ready and verified.
- [ ] Graph StateGraph swap plus `checkpoint-postgres` swap (needs `langgraph` plus `langgraph-checkpoint-postgres` installs). Mock runner stays until then.
- [ ] Real session store plus login route (no spec yet, stub `resolve_owner_id` stays).
- [ ] Contract tests for 422, 429 (`Retry-After` missing now), 502, 504 shapes.

## Backend Progress 2026-09-26 part 3 (DB service, StateGraph, frontend)

- [x] `0005` adds `messages.citations` JSONB (revises `0002`, non-vector branch). Applied live.
- [x] `DbChatService` in `chat_service.py`. Routes now use Postgres per request via `Depends(get_db)`. In-memory `ChatService` stays for unit tests only.
- [x] Contract tests: 401, 403, 404, 422 (empty message, long title, bad limit, bad idempotency header), 429, 502, 504, idempotent replay, SSE with and without citations.
- [x] Real LangGraph `StateGraph` in `graph.py` (router, prep_simple, retriever, grader, generator, bump_retry, fallback; MemorySaver checkpointer). Parity with `run_turn` verified on simple, grounded, and fallback paths. Lesson recorded: edge routing functions must stay pure, state writes belong in nodes.
- [x] Tests hermetic: autouse fixture strips `OPENAI_API_KEY` so the suite never depends on account funds.
- Backend tests: 21 passed, 1 skipped (pgvector gate).
- [x] Frontend built: Next 16, React 19, Tailwind 4, TanStack Query 5, next-themes, Zod 4, Vitest. Routes `/`, `/chat`, `/chat/[threadId]`, `/login` placeholder. Feature code in `src/features/chat` with `index.ts` public API. Frontend tests: 17 passed (verified).
- [x] Live smoke on port 8000: health 200, thread create 200 (DB-backed), simple turn 200, rag turn 502 with proper envelope plus `trace_id`.

## Watch Out (funds, not code)

- Opencode account has insufficient funds (provider 402). Grounded turns return 502 `model_error` with `trace_id`, which is the spec-correct outage shape. Small talk works fully offline. Top up the account to get real grounded replies. Nothing to fix in code.

## Workspace Tasks 2026-09-26

- [x] `.vscode/tasks.json` in the frontend repo: `Start backend` (loads backend `.env`, uvicorn on 8000), `Start frontend` (`npm run dev` on 3000), `Start all` (both). Run via Command Palette, Run Task. Backend boot verified live.
- [x] `.vscode/tasks.json` in the backend repo: `Start backend` owned by the backend (same command, cwd is the backend root). Both files define the label, so the Run Task picker shows which folder each comes from.
- [x] Task quoting fix: VS Code wraps shell tasks in its own `powershell -Command`, which broke the inline script. Backend start now lives in `scripts/start-dev.ps1`, both task files call it with `-File`. Boot verified live.
- [x] Tasks split per repo: backend file has only `Start backend`, frontend file has only `Start frontend`. `Start all` removed (VS Code cannot depend across files).

## Go Wiring 2026-09-26 (LIVE)

- Backend runs fully on the Go subscription. Live proof: refund question returned `rag_search`, `is_grounded=true`, real generated reply with 1 citation.
- `OPENCODE_GO_BASE_URL=https://opencode.ai/zen/go/v1`. Models: `deepseek-v4-flash` for router and generator (both on chat/completions).
- Client sends `x-opencode-session` per chat thread plus app user agent, per Go docs. Nodes pass `thread_id` as the session value.
- Muse contributor sits on the Responses API, not chat/completions, so it waits for a Responses client. DeepSeek Flash covers both roles for the MVP.
- Caveats: Go traffic is abuse-monitored and meant for coding-agent-shaped use. Muse contributor allows training on prompts plus has region limits. Console credits remain the fallback.
- Tests: 21 passed, 1 skipped (suite stays on mock path, key stripped).

## Model Funding 2026-09-26

- Free tier is fenced: `muse-spark-1.3-contributor-free` returns `FreeTierError: OpenCode's free tier can only be used from within OpenCode`. Backend cannot use free models. Reverted.
- MVP choice: `MODEL_ROUTER=deepseek-v4-flash` plus `MODEL_GENERATOR=deepseek-v4-flash` ($0.14 in, $0.28 out per 1M). Temporary deviation from ADR 0007 (generator should be Muse Spark 1.3). Revisit when funded.
- Plumbing proven: paid calls reach the provider and fail only with 402 insufficient funds. No code fix needed.
- Options: add Console credits (auto-reload available), or try the Go subscription key against `https://opencode.ai/zen/go/v1/chat/completions` (Go includes `deepseek-v4-flash` within $12 per 5h, $30 weekly, $60 monthly limits; needs a small client change).

## Meta Provider (BYOK) 2026-09-26

- User connected own Meta key in console Providers page (all Spark models enabled). Custom route `https://opencode.ai/inference/custom/conn_...` stored in `META_API_URL`.
- Tested: custom URL plus Meta key as caller Bearer gives 401 (gateway wants the opencode service key, uses stored Meta key upstream). Meta direct URL plus that key gives 401 (not a direct API key). First 403 was only Cloudflare blocking the urllib user agent.
- Wiring done: `llm_client` uses `META_API_URL` when set, caller auth stays `OPENAI_API_KEY` (must be the opencode service key, `oc_sk_...`). `config.py` plus `.env.example` updated. Models set to `muse-spark-1.3-contributor` (router, $0.10/$0.20) plus `muse-spark-1.3` (generator, ADR 0007 restored).
- WAITING ON USER: put the opencode service key back into `.env` as `OPENAI_API_KEY` (currently holds the Meta key, which fails everywhere). Copy from console Keys page. Then backend verifies live.
- 2026-09-26 update: opencode key restored (`oc_sk_...`). Custom conn URL routes (gateway recognizes the key). But Meta rejects the stored provider key on its own `GET /v1/models` with 401 `invalid_api_key`. Console shows Last used Never. Problem is the Meta-side key or account setup, not backend code. User must fix the key in the Meta developer portal plus Providers page, then backend retests.
- Tests: 21 passed, 1 skipped.

## Real Auth 2026-09-26 (both repos)

Backend:
- [x] `0006` adds `users` (email unique, bcrypt hash) plus `sessions` (token SHA256, 30 day expiry). Applied live.
- [x] `POST /api/auth/signup` (201, 409 on duplicate), `/login` (200, identical 401 copy for unknown email and wrong password), `/logout` (clears cookie), `/me` (200 or 401). Cookie is `httpOnly`, `SameSite=Lax`, 30 days. `Secure` off for local http, must flip in production.
- [x] Chat routes now validate the cookie against the session store. Session stub deleted. One truth only.
- [x] `pyproject.toml` gains `bcrypt` plus `email-validator`.
- [x] Spec `specs/api/auth.md` written and Accepted.
- Backend tests: 28 passed, 1 skipped.

Frontend:
- [x] Real `/login` plus new `/signup` with validation, server error mapping, no raw backend text.
- [x] Route guard: chat pages show a skeleton then redirect to `/login` without a session. Auth pages redirect to `/chat` with one.
- [x] Header shows email plus logout. Layout fixed: full-height shell, full-height sidebar, centered `max-w-3xl` message column with matching sticky composer.
- Frontend tests: 42 passed (verified).

Left: login throttling, expired-session cleanup job, e2e coverage.

## Signup Fixes 2026-09-26

- [x] bcrypt 72 byte cap: passwords of 73-128 chars crashed signup with a 500. Contract now caps at 72 on both sides (backend Pydantic, frontend Zod). Fresh signup needs an 8-72 char password. Backend server needs a restart (no reload flag).
- [x] Zod 4 `.pick()` on the refined signup schema threw at submit. Service now validates with a dedicated `signupPayloadSchema` (no refinement). Regression tests added.
- Frontend tests: 44 passed, `tsc` clean.

## Slow Reply Fix 2026-09-26

- Backend proven innocent: the exact messages return 200 plus full SSE streams through the API. The blank third reply was the UI showing nothing while the turn POST was still in flight (each turn runs 3 sequential model calls, so slow networks look stuck).
- [x] Thinking indicator: while the turn request is pending and the stream has not started, an assistant bubble shows progress instead of blank space.
- [x] Turn POST now times out at 120s and maps to a retryable server error with inline retry, instead of hanging forever.
- Frontend tests: 48 passed, `tsc` clean.

## Stream Duplicate Plus Silent Send Fix 2026-09-26

- The pasted `turns?limit=20` body is a 200 with valid items. History restore on load works and is by design (resume on reload per spec, plus the `/me` session guard).
- [x] Failed streams now merge like done ones: when the turn row already arrived via refetch, the stream state resets instead of rendering a duplicate failed bubble next to the settled reply.
- [x] Sends while offline or busy now toast instead of vanishing silently.
- Frontend tests: 48 passed, `tsc` clean. Still needs from the user: status code of the red `stream` row plus the first red Console error text.

## Duplicate Key Fix 2026-09-26

- Screenshots proved the stream is 200 OK. The true bug was a React duplicate key: while a stream finished and the refetch arrived, the streamed model and the server row shared one `turn_id`, so React dropped one child and replies vanished.
- [x] The live stream now owns its turn id. The server twin is filtered out until reset, so the duplicate frame cannot happen.
- Frontend tests: 48 passed, `tsc` clean.

## Still Open (audit 2026-09-27, only true remainder)

- [ ] PDF and text document ingest: chunk plus embed plus store into `document_chunks`. Image attachments already work. Blocked on embedding source choice (opencode has no embeddings endpoint).
- [x] Embedding recall wiring: `prefetch_vector_docs` embeds the query and reads `document_chunks` with pgvector, retriever truncates to k (5 rag, 8 complex, 0 simple). Falls back to keyword stub when embeddings are unavailable. Done 2026-09-27.
- [x] Expired-session cleanup job plus soft-delete purge with 3-day reminder: `maintenance.py` owns session cleanup, 30-day purge, deleted list plus purge-reminder endpoints, delete response carries `purge_at`. Frontend toast plus banner remind 3 days before. Done 2026-09-27.
- [x] Browser e2e (Playwright): `playwright.config.ts`, `e2e/specs` (landing, auth guard, chat smoke), `test:e2e` scripts. Done 2026-09-27.
- [x] Checkpoint-postgres swap: owned `thread_checkpoints` table (`0010`), adapter writes plus reads plus prune (last 50 or 30 days), `GET checkpoint` endpoint for resume. Done 2026-09-27.
- [x] 429 `Retry-After` header: `ChatError.retry_after`, route headers, CORS expose, frontend wait copy. Done 2026-09-27.
- [ ] 409 turn-conflict code: backend has no 409 by design (idempotent replay returns the first result). Frontend maps 409 if it ever appears. Not a task, recorded rule.

Done since: thread list, history citations, cursor paging, session store plus login, direct-answer mode, vector table plus recall, login throttle, model dropdown, vision for both models, Singularity branding, dual tone, icons, tasks files.

Note: unchecked boxes in the older sections above are stale planning notes, superseded by the dated progress entries. The lists in Still Open plus Next Steps are the true remainder.

## Suggested Order

1. Top up opencode funds, then verify a real grounded turn end to end.
2. Backend thread-list endpoint plus frontend sidebar wiring.
3. Citations in history (contract update) plus cursor paging UI.
4. Session store plus login route (needs a small spec first).
5. Checkpoint-postgres plus vector recall when the host is ready.

## Next Steps 2026-09-26 (agreed order)

1. Direct-answer mode (pure build, no input needed).
2. Document ingest with PDF plus image uploads (needs embedding source choice).
3. pgvector install (Build Tools plus source compile).
4. Citations in history.
5. Thread-list endpoint.
6. Cursor paging UI.
7. Login throttling plus session cleanup.
8. Checkpoint-postgres.
9. E2E tests.

## All remaining done 2026-09-27

Backend (tests 38 passed):
- [x] Model dropdown backend: per-turn `model` (3 ids, 422 otherwise), registry maps dropdown ids to provider models plus API shape plus vision flag. Muse runs on Go Responses API (parser verified live).
- [x] Vision turns: attachments table (`0007`), upload endpoint (images only, 5MB), vision graph branch that answers about images directly. Live proof: 1x1 red PNG described correctly.
- [x] Direct-answer mode: `simple_chat` gets a model-written reply, ungrounded, no citations. Live proof: `good morning` answered with emoji.
- [x] Thread list endpoint, history citations, login throttle (5 fails per 10 min per email).
- [x] Checkpoint-postgres verdict: library installed, swap deferred (no code reads checkpoints yet, so persistence would be write-only; resume path first).
- Specs `chat-api.md` plus `chat-agent.md` updated.

Frontend (tests 71 passed, build clean):
- [x] Model dropdown (3 options, persisted), upload button with vision gating plus click notice, attachment chips, server thread list, history citations, cursor paging Load more.
- [x] Client contract spec updated.

Still open: PDF ingest (needs embedding source), session cleanup job, browser e2e.

## Rename Pin Reorder 2026-09-27

- [x] Backend `0009` adds `is_pinned` plus `pin_order`. Rename, pin (cap 5, 409 `pin_limit`), unpin, reorder (exact pinned set or 422). List returns pinned first. Applied live.
- [x] Frontend: inline rename with Enter plus Escape, Pinned group above Chats, drag plus arrow-button reorder for pinned only, cap notice, cache refresh on every action.
- Tests: backend 52 passed, frontend 106 passed (both verified).

## Delete Plus Undo 2026-09-27

- [x] Backend `0008` adds `deleted_at` to threads plus messages. Delete and restore endpoints for threads and single messages. Undo window 10 seconds server-enforced (410 `gone` after, 409 `not_deleted` on live rows). Reads skip deleted rows. Purge deferred to the cleanup job.
- [x] Frontend: trash buttons on thread rows plus message bubbles, accessible confirm dialog before every delete, sonner undo toast for exactly 10 seconds, cache refresh plus routing on delete and restore.
- Tests: backend 45 passed, frontend 85 passed (both verified).

## Message Order Plus Landing 2026-09-27

- [x] Order bug: user and assistant rows shared one DB timestamp (single transaction), so ties broke on random UUIDs and answers rendered above questions. `Message.created_at` now defaults in Python (distinct increasing times). Ordering test added.
- [x] Landing page at `/` (was a redirect): hero, how it works, model choice, image attach, account. Product-only copy, Singularity brand, dual tone. Static render, auth-aware buttons.
- Backend tests in file: 10 passed.

## Thread List 405 Plus Icons 2026-09-27

- The 405 was a stale backend: `GET /api/chat/threads` exists only in current code and the dev server has no reload. Restart via the `Start backend` task and the sidebar lists threads, rows click through. No code fix.
- [x] Icons: logout plus sign-in (LogOut, LogIn), all retry buttons (RotateCcw), auth submits (LogIn, UserPlus). Send, stop, attach, new chat, theme already had icons. Blue minimalist style kept.
- Frontend tests: 71 passed, `tsc` clean, `next build` clean.

## Vision for Muse, Branding, Sonar 2026-09-27

- [x] Muse sees images: Go Responses API takes `input_image` (proven live, red pixel described). `responses_text` carries images, registry marks `muse-spark-1.3` vision true. Upload gating plus 422 apply to plain DeepSeek only.
- [x] Live proof: muse plus attached image answered about it end to end through signup, thread, upload, turn.
- [x] Branding: assistant named Singularity (avatar S, message label, header, page title). Dual-tone background (deep sidebar, lighter main, both themes, blue accent only). Design tokens updated.
- [x] Sonar pass. Frontend fixed: insecure `Math.random` fallbacks replaced with `crypto.getRandomValues` (idempotency keys, client ids), dead keyboard handler removed. Backend reviewed: no hardcoded secrets, `secrets` plus bcrypt used, no eval or shell calls, broad excepts kept deliberately (502 mapping, rollback, fallback). Left items recorded by the worker with reasons.
- Tests: backend 39 passed, frontend 71 passed.

## Use-Case Coverage 2026-09-27

- Unanswered questions are gone by design: ungrounded turns now get direct model answers (labeled, no citations) instead of the dead-end fallback text. Fallback survives only for keyless dev mode.
- Router sends jokes, opinions, and creative requests to direct answer (heuristic markers plus richer LLM prompt). Live proof: python question answered with code, brainstorming answered with ideas, both ungrounded.
- Delete-then-404 explained: the turns refetch raced the navigation after a good delete. Delete hook now cancels first, and routine 4xx no longer logs console noise.
- Backend tests: 47 passed. Spec `chat-agent.md` updated (edges, retry, acceptance).

## Remainder Done 2026-09-27 (all except PDF ingest)

Backend (tests 27 passed, rest skipped without live DB):
- [x] 429 `Retry-After`: `ChatError.retry_after`, turn plus thread plus login limits compute seconds, routes set the header, CORS exposes it. Live header test added.
- [x] Maintenance: `services/maintenance.py` (session cleanup, 30-day soft-delete purge, `purge_info` with 3-day `needs_reminder`, deleted list plus reminder list, `run_maintenance`). Delete returns `purge_at` plus `days_remaining`. `POST maintenance/run` added.
- [x] Vector recall: `services/embeddings.py` plus `prefetch_vector_docs`, service prefetches top 8 before `run_turn`, retriever uses prefetch or stub. Tests stay hermetic without keys.
- [x] Checkpoints: `thread_checkpoints` model plus `0010` migration, adapter `save_to_db` plus `load_latest_from_db` plus prune (last 50 or 30 days), `GET checkpoint` endpoint, prune in maintenance.

Frontend (tests 112 passed, `tsc` clean, `next build` clean, Playwright 4 passed):
- [x] Retry wait copy on 429 for chat plus auth, header read in both services.
- [x] Purge UX: delete toast carries 30-day plus 3-day reminder copy, `PurgeReminderBanner` in the sidebar, confirm dialog notes the policy, `usePurgeReminders` hook.
- [x] E2E: Playwright config, `e2e/fixtures`, `e2e/specs` (landing, auth guard, chat smoke with backend skip), `test:e2e` scripts.

Still open: PDF and text ingest only (needs embedding source). 409 stays a recorded rule, not a task.
