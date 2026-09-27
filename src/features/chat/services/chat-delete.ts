import { z } from "zod";
import { getApiBaseUrl } from "@/lib/api-base";
import { ChatApiError } from "@/features/chat/types/chat";
import type {
  DeleteThreadResponse,
  DeleteTurnResponse,
  DeletedThreadInfo,
  ListDeletedThreadsResponse,
  RestoreThreadResponse,
  RestoreTurnResponse,
} from "@/features/chat/types/chat";

export const UNDO_TOAST_DURATION_MS = 10000;

export const UNDO_EXPIRED_NOTICE = "Too late to undo.";

export const NOT_DELETED_NOTICE = "Nothing to restore.";

export const PURGE_RETENTION_DAYS = 30;

export const PURGE_WARNING_DAYS = 3;

export function formatPurgeNotice(daysRemaining: number | null | undefined): string {
  if (typeof daysRemaining !== "number") {
    return `It will be permanently deleted in ${PURGE_RETENTION_DAYS} days. We will remind you ${PURGE_WARNING_DAYS} days before.`;
  }
  if (daysRemaining <= PURGE_WARNING_DAYS) {
    return `It will be permanently deleted in ${daysRemaining} days. Restore it to keep it.`;
  }
  return `It will be permanently deleted in ${daysRemaining} days. We will remind you ${PURGE_WARNING_DAYS} days before.`;
}

export function formatReminderBanner(threads: DeletedThreadInfo[]): string {
  if (threads.length === 1) {
    const first = threads[0];
    if (first === undefined) return "";
    const name = first.title ?? "A deleted chat";
    return `${name} will be permanently deleted in ${first.days_remaining} days. Restore it to keep it.`;
  }
  return `${threads.length} deleted chats will be permanently removed within ${PURGE_WARNING_DAYS} days. Restore them to keep them.`;
}

const idSchema = z.string().trim().min(1);

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
  if (traceId !== null) {
    // eslint-disable-next-line no-console
    console.error("Chat request failed.", { status: response.status, code, traceId });
  }
  throw new ChatApiError(response.status, code, "Chat request failed.", traceId, retryAfter);
}

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) await throwFromResponse(response);
  return (await response.json()) as T;
}

export type {
  DeleteThreadResponse,
  RestoreThreadResponse,
  DeleteTurnResponse,
  RestoreTurnResponse,
  DeletedThreadInfo,
  ListDeletedThreadsResponse,
};

export async function listDeletedThreads(): Promise<ListDeletedThreadsResponse> {
  const response = await fetch(`${getApiBaseUrl()}/api/chat/threads/deleted/list`, {
    method: "GET",
    credentials: "include",
  });
  return parseJson<ListDeletedThreadsResponse>(response);
}

export async function listPurgeReminders(): Promise<ListDeletedThreadsResponse> {
  const response = await fetch(
    `${getApiBaseUrl()}/api/chat/threads/purge-reminders/list`,
    { method: "GET", credentials: "include" },
  );
  return parseJson<ListDeletedThreadsResponse>(response);
}

export async function deleteChatThread(threadId: string): Promise<DeleteThreadResponse> {
  const input = idSchema.parse(threadId);
  const response = await fetch(
    `${getApiBaseUrl()}/api/chat/threads/${encodeURIComponent(input)}`,
    { method: "DELETE", credentials: "include" },
  );
  return parseJson<DeleteThreadResponse>(response);
}

export async function restoreChatThread(threadId: string): Promise<RestoreThreadResponse> {
  const input = idSchema.parse(threadId);
  const response = await fetch(
    `${getApiBaseUrl()}/api/chat/threads/${encodeURIComponent(input)}/restore`,
    { method: "POST", credentials: "include" },
  );
  return parseJson<RestoreThreadResponse>(response);
}

export async function deleteChatTurn(
  threadId: string,
  turnId: string,
): Promise<DeleteTurnResponse> {
  const thread = idSchema.parse(threadId);
  const turn = idSchema.parse(turnId);
  const response = await fetch(
    `${getApiBaseUrl()}/api/chat/threads/${encodeURIComponent(thread)}/turns/${encodeURIComponent(turn)}`,
    { method: "DELETE", credentials: "include" },
  );
  return parseJson<DeleteTurnResponse>(response);
}

export async function restoreChatTurn(
  threadId: string,
  turnId: string,
): Promise<RestoreTurnResponse> {
  const thread = idSchema.parse(threadId);
  const turn = idSchema.parse(turnId);
  const response = await fetch(
    `${getApiBaseUrl()}/api/chat/threads/${encodeURIComponent(thread)}/turns/${encodeURIComponent(turn)}/restore`,
    { method: "POST", credentials: "include" },
  );
  return parseJson<RestoreTurnResponse>(response);
}

export function isUndoExpiredError(error: unknown): boolean {
  if (error instanceof ChatApiError) {
    if (error.status === 410) return true;
    if (error.code === "gone") return true;
  }
  return false;
}

export function isNotDeletedError(error: unknown): boolean {
  if (error instanceof ChatApiError) {
    if (error.status === 409) return true;
    if (error.code === "not_deleted") return true;
  }
  return false;
}
