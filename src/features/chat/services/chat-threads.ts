import { getApiBaseUrl } from "@/lib/api-base";
import {
  pinThreadSchema,
  renameThreadSchema,
  reorderPinnedThreadsSchema,
} from "@/features/chat/schemas/chat-schemas";
import { ChatApiError } from "@/features/chat/types/chat";
import type {
  PinThreadResponse,
  RenameThreadResponse,
  ReorderPinnedThreadsResponse,
  ThreadInfo,
  UnpinThreadResponse,
} from "@/features/chat/types/chat";

export const MAX_PINNED_THREADS = 5;

export const PIN_LIMIT_NOTICE = "At most 5 pinned chats.";

export const NOT_PINNED_NOTICE = "This chat is not pinned.";

export const REORDER_FAILED_NOTICE = "Could not save the new order. Try again.";

export const RENAME_FAILED_NOTICE = "Could not rename the chat. Try again.";

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
  if (traceId !== null && response.status >= 500) {
    // eslint-disable-next-line no-console
    console.error("Chat request failed.", { status: response.status, code, traceId });
  }
  throw new ChatApiError(response.status, code, "Chat request failed.", traceId);
}

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) await throwFromResponse(response);
  return (await response.json()) as T;
}

export async function renameChatThread(
  threadId: string,
  title: string,
): Promise<RenameThreadResponse> {
  const input = renameThreadSchema.parse({ thread_id: threadId, title });
  const response = await fetch(
    `${getApiBaseUrl()}/api/chat/threads/${encodeURIComponent(input.thread_id)}`,
    {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: input.title }),
    },
  );
  return parseJson<RenameThreadResponse>(response);
}

export async function pinChatThread(
  threadId: string,
  position?: number,
): Promise<PinThreadResponse> {
  const input = pinThreadSchema.parse(
    position === undefined ? { thread_id: threadId } : { thread_id: threadId, position },
  );
  const response = await fetch(
    `${getApiBaseUrl()}/api/chat/threads/${encodeURIComponent(input.thread_id)}/pin`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        input.position === undefined ? {} : { position: input.position },
      ),
    },
  );
  return parseJson<PinThreadResponse>(response);
}

export async function unpinChatThread(threadId: string): Promise<UnpinThreadResponse> {
  const input = pinThreadSchema.parse({ thread_id: threadId });
  const response = await fetch(
    `${getApiBaseUrl()}/api/chat/threads/${encodeURIComponent(input.thread_id)}/unpin`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    },
  );
  return parseJson<UnpinThreadResponse>(response);
}

export async function reorderPinnedThreads(
  threadIds: string[],
): Promise<ReorderPinnedThreadsResponse> {
  const input = reorderPinnedThreadsSchema.parse({ thread_ids: threadIds });
  const response = await fetch(`${getApiBaseUrl()}/api/chat/threads/reorder`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ thread_ids: input.thread_ids }),
  });
  return parseJson<ReorderPinnedThreadsResponse>(response);
}

export function isPinLimitError(error: unknown): boolean {
  if (error instanceof ChatApiError) {
    return error.status === 409 && error.code === "pin_limit";
  }
  return false;
}

export function isNotPinnedError(error: unknown): boolean {
  if (error instanceof ChatApiError) {
    return error.status === 409 && error.code === "not_pinned";
  }
  return false;
}

export function isReorderValidationError(error: unknown): boolean {
  if (error instanceof ChatApiError) {
    return error.status === 422;
  }
  return false;
}

export function getPinnedThreads(threads: ThreadInfo[]): ThreadInfo[] {
  return threads
    .filter((thread) => thread.is_pinned === true)
    .slice()
    .sort((a, b) => (a.pin_order ?? 0) - (b.pin_order ?? 0));
}

export function getUnpinnedThreads(threads: ThreadInfo[]): ThreadInfo[] {
  return threads.filter((thread) => thread.is_pinned !== true);
}

export function movePinnedThreadOrder(
  orderedIds: string[],
  fromIndex: number,
  toIndex: number,
): string[] {
  if (orderedIds.length === 0) return [];
  const from = Math.max(0, Math.min(fromIndex, orderedIds.length - 1));
  const to = Math.max(0, Math.min(toIndex, orderedIds.length - 1));
  if (from === to) return [...orderedIds];
  const next = [...orderedIds];
  const [moved] = next.splice(from, 1);
  if (moved === undefined) return [...orderedIds];
  next.splice(to, 0, moved);
  return next;
}

export function applyPinnedOrder(
  threads: ThreadInfo[],
  orderedIds: string[],
): ThreadInfo[] {
  const pinned = getPinnedThreads(threads);
  const unpinned = getUnpinnedThreads(threads);
  const byId = new Map(pinned.map((thread) => [thread.thread_id, thread]));
  const reordered: ThreadInfo[] = [];
  for (const [position, threadId] of orderedIds.entries()) {
    const thread = byId.get(threadId);
    if (thread !== undefined) {
      reordered.push({ ...thread, pin_order: position });
      byId.delete(threadId);
    }
  }
  for (const thread of pinned) {
    if (byId.has(thread.thread_id)) {
      reordered.push({ ...thread, pin_order: reordered.length });
      byId.delete(thread.thread_id);
    }
  }
  return [...reordered, ...unpinned];
}
