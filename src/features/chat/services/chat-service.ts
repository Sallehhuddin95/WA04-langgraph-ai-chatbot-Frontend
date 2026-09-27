import { getApiBaseUrl } from "@/lib/api-base";
import {
  createThreadSchema,
  createTurnSchema,
  listTurnsParamsSchema,
} from "@/features/chat/schemas/chat-schemas";
import { readSseStream, type ParsedSseEvent } from "@/features/chat/services/sse-parser";
import type {
  ChatCitation,
  CreateThreadPayload,
  CreateThreadResponse,
  CreateTurnPayload,
  CreateTurnResponse,
  ListThreadsResponse,
  ListTurnsParams,
  ListTurnsResponse,
  StreamAccumulator,
  UploadAttachmentResponse,
} from "@/features/chat/types/chat";
import { ChatApiError } from "@/features/chat/types/chat";

function newIdempotencyKey(): string {
  try {
    const c = globalThis.crypto;
    if (typeof c?.randomUUID === "function") return c.randomUUID();
    if (typeof c?.getRandomValues === "function") {
      const bytes = c.getRandomValues(new Uint32Array(2));
      const first = bytes[0] ?? 0;
      const second = bytes[1] ?? 0;
      return `${Date.now()}-${first}-${second}`;
    }
  } catch {
    // Crypto blocked. Use timestamp fallback below.
  }
  return `${Date.now()}-0`;
}

export function ensureIdempotencyKey(payload: CreateTurnPayload): CreateTurnPayload {
  if (payload.idempotency_key !== undefined && payload.idempotency_key.length > 0) {
    return payload;
  }
  return { ...payload, idempotency_key: newIdempotencyKey() };
}

function readRetryAfter(response: Response): number | null {
  const raw = response.headers.get("Retry-After");
  if (raw === null) return null;
  const seconds = Number.parseInt(raw, 10);
  if (Number.isNaN(seconds) || seconds < 0) return null;
  return seconds;
}

async function throwFromResponse(response: Response): Promise<never> {
  let code = "request_failed";
  let traceId: string | null = null;
  try {
    const body = (await response.json()) as {
      error?: { code?: string; message?: string; trace_id?: string };
    };
    if (typeof body.error?.code === "string") code = body.error.code;
    if (typeof body.error?.trace_id === "string") traceId = body.error.trace_id;
  } catch {
    // Keep defaults when the body is not JSON.
  }
  const retryAfter = readRetryAfter(response);
  // Log server and network failures only. Routine 4xx states
  // (deleted rows, expired sessions) already surface in the UI.
  if (traceId !== null && (response.status === 0 || response.status >= 500)) {
    // eslint-disable-next-line no-console
    console.error("Chat request failed.", { status: response.status, code, traceId });
  }
  throw new ChatApiError(response.status, code, "Chat request failed.", traceId, retryAfter);
}

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) await throwFromResponse(response);
  return (await response.json()) as T;
}

export async function createThread(payload: CreateThreadPayload): Promise<CreateThreadResponse> {
  const input = createThreadSchema.parse(
    payload.title === undefined ? {} : { title: payload.title },
  );
  const response = await fetch(`${getApiBaseUrl()}/api/chat/threads`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input.title === undefined ? {} : { title: input.title }),
  });
  return parseJson<CreateThreadResponse>(response);
}

export async function listThreads(): Promise<ListThreadsResponse> {
  const response = await fetch(`${getApiBaseUrl()}/api/chat/threads`, {
    method: "GET",
    credentials: "include",
  });
  const data = await parseJson<ListThreadsResponse>(response);
  const threads = Array.isArray(data.threads) ? data.threads : [];
  return {
    threads: threads.map((thread) => ({
      ...thread,
      is_pinned: thread.is_pinned === true,
      pin_order: typeof thread.pin_order === "number" ? thread.pin_order : null,
    })),
  };
}

export async function uploadThreadAttachment(
  threadId: string,
  file: File,
): Promise<UploadAttachmentResponse> {
  const form = new FormData();
  form.append("file", file);
  const response = await fetch(
    `${getApiBaseUrl()}/api/chat/threads/${threadId}/attachments`,
    { method: "POST", credentials: "include", body: form },
  );
  return parseJson<UploadAttachmentResponse>(response);
}

const CREATE_TURN_TIMEOUT_MS = 120_000;

export async function createChatTurn(payload: CreateTurnPayload): Promise<CreateTurnResponse> {
  const withKey = ensureIdempotencyKey(payload);
  const input = createTurnSchema.parse({
    thread_id: withKey.thread_id,
    message: withKey.message,
    ...(withKey.idempotency_key === undefined
      ? {}
      : { idempotency_key: withKey.idempotency_key }),
    model: withKey.model ?? "deepseek-v4-flash",
    attachment_ids: withKey.attachment_ids ?? [],
  });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CREATE_TURN_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(
      `${getApiBaseUrl()}/api/chat/threads/${input.thread_id}/turns`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(input.idempotency_key === undefined
            ? {}
            : { "Idempotency-Key": input.idempotency_key }),
        },
        body: JSON.stringify({
          message: input.message,
          model: input.model,
          attachment_ids: input.attachment_ids,
          ...(input.idempotency_key === undefined
            ? {}
            : { idempotency_key: input.idempotency_key }),
        }),
        signal: controller.signal,
      },
    );
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ChatApiError(0, "timeout", "Chat request timed out.", null);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
  return parseJson<CreateTurnResponse>(response);
}

export async function listTurns(params: ListTurnsParams): Promise<ListTurnsResponse> {
  const input = listTurnsParamsSchema.parse(params);
  const search = new URLSearchParams({ limit: String(input.limit) });
  if (input.cursor !== null) search.set("cursor", input.cursor);
  const response = await fetch(
    `${getApiBaseUrl()}/api/chat/threads/${input.thread_id}/turns?${search.toString()}`,
    { method: "GET", credentials: "include" },
  );
  return parseJson<ListTurnsResponse>(response);
}

export interface StreamChatTurnOptions {
  threadId: string;
  turnId: string;
  signal?: AbortSignal;
  idleTimeoutMs?: number;
  onEvent?: (event: ParsedSseEvent, acc: StreamAccumulator) => void;
}

export async function streamChatTurn(options: StreamChatTurnOptions): Promise<StreamAccumulator> {
  let response: Response;
  try {
    response = await fetch(
      `${getApiBaseUrl()}/api/chat/threads/${options.threadId}/turns/${options.turnId}/stream`,
      {
        method: "GET",
        credentials: "include",
        headers: { Accept: "text/event-stream" },
        signal: options.signal,
      },
    );
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ChatApiError(0, "network_error", "Network request failed.", null);
  }
  if (!response.ok) await throwFromResponse(response);
  return readSseStream(response, {
    signal: options.signal,
    idleTimeoutMs: options.idleTimeoutMs ?? 60_000,
    onEvent: options.onEvent,
  });
}

export type { ChatCitation };
