import { afterEach, describe, expect, it, vi } from "vitest";
import {
  MAX_PINNED_THREADS,
  NOT_PINNED_NOTICE,
  PIN_LIMIT_NOTICE,
  REORDER_FAILED_NOTICE,
  applyPinnedOrder,
  getPinnedThreads,
  getUnpinnedThreads,
  isNotPinnedError,
  isPinLimitError,
  isReorderValidationError,
  movePinnedThreadOrder,
  pinChatThread,
  renameChatThread,
  reorderPinnedThreads,
  unpinChatThread,
} from "@/features/chat/services/chat-threads";
import {
  pinThreadSchema,
  renameThreadSchema,
  reorderPinnedThreadsSchema,
} from "@/features/chat/schemas/chat-schemas";
import { ChatApiError } from "@/features/chat/types/chat";
import type { ThreadInfo } from "@/features/chat/types/chat";

const THREAD_A = "550e8400-e29b-41d4-a716-446655440001";
const THREAD_B = "550e8400-e29b-41d4-a716-446655440002";
const THREAD_C = "550e8400-e29b-41d4-a716-446655440003";

function mockJsonResponse(body: unknown, status = 200): void {
  const response = new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));
}

function makeThread(
  threadId: string,
  overrides: Partial<ThreadInfo> = {},
): ThreadInfo {
  return {
    thread_id: threadId,
    title: `Title ${threadId.slice(-4)}`,
    updated_at: "2026-09-26T10:00:00Z",
    is_pinned: false,
    pin_order: null,
    ...overrides,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("chat thread pin cap", () => {
  it("caps pins at 5 with plain copy", () => {
    // Arrange
    const cap = MAX_PINNED_THREADS;

    // Act
    const notice = PIN_LIMIT_NOTICE;

    // Assert
    expect(cap).toBe(5);
    expect(notice).toBe("At most 5 pinned chats.");
  });

  it("uses plain copy for not pinned and reorder failure", () => {
    // Arrange
    const notPinned = NOT_PINNED_NOTICE;
    const reorderFailed = REORDER_FAILED_NOTICE;

    // Act
    const text = `${notPinned} ${reorderFailed}`;

    // Assert
    expect(notPinned).toBe("This chat is not pinned.");
    expect(reorderFailed).toBe("Could not save the new order. Try again.");
    expect(text.includes("--")).toBe(false);
  });
});

describe("renameChatThread", () => {
  it("sends PATCH with trimmed title and credentials", async () => {
    // Arrange
    mockJsonResponse({
      thread_id: THREAD_A,
      title: "New title",
      updated_at: "2026-09-26T10:01:00Z",
      is_pinned: false,
      pin_order: null,
    });
    const fetchSpy = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;

    // Act
    const result = await renameChatThread(THREAD_A, "  New title  ");

    // Assert
    expect(result.title).toBe("New title");
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain(`/api/chat/threads/${THREAD_A}`);
    expect(init.method).toBe("PATCH");
    expect(init.credentials).toBe("include");
    const body = JSON.parse(init.body as string) as { title: string };
    expect(body.title).toBe("New title");
  });

  it("rejects an empty title before send", () => {
    // Arrange
    const input = { thread_id: THREAD_A, title: "   " };

    // Act
    const result = renameThreadSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("rejects a title over 120 chars", () => {
    // Arrange
    const input = { thread_id: THREAD_A, title: "a".repeat(121) };

    // Act
    const result = renameThreadSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("maps 404 to ChatApiError", async () => {
    // Arrange
    mockJsonResponse({ error: { code: "not_found", trace_id: "t1" } }, 404);

    // Act
    const result = await renameChatThread(THREAD_A, "Hello").catch(
      (error: unknown) => error,
    );

    // Assert
    expect(result).toBeInstanceOf(ChatApiError);
    expect((result as ChatApiError).status).toBe(404);
  });
});

describe("pinChatThread", () => {
  it("sends POST to pin route with empty body by default", async () => {
    // Arrange
    mockJsonResponse({ thread_id: THREAD_A });
    const fetchSpy = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;

    // Act
    const result = await pinChatThread(THREAD_A);

    // Assert
    expect(result).toEqual({ thread_id: THREAD_A });
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain(`/api/chat/threads/${THREAD_A}/pin`);
    expect(init.method).toBe("POST");
    expect(init.credentials).toBe("include");
    expect(JSON.parse(init.body as string)).toEqual({});
  });

  it("sends position when given", async () => {
    // Arrange
    mockJsonResponse({ thread_id: THREAD_A });
    const fetchSpy = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;

    // Act
    await pinChatThread(THREAD_A, 0);

    // Assert
    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toEqual({ position: 0 });
  });

  it("maps 409 pin_limit to pin limit error", async () => {
    // Arrange
    mockJsonResponse({ error: { code: "pin_limit", trace_id: "t1" } }, 409);

    // Act
    const result = await pinChatThread(THREAD_A).catch((error: unknown) => error);

    // Assert
    expect(result).toBeInstanceOf(ChatApiError);
    expect(isPinLimitError(result)).toBe(true);
    expect(isNotPinnedError(result)).toBe(false);
  });

  it("accepts pin schema with and without position", () => {
    // Arrange
    const withoutPosition = { thread_id: THREAD_A };
    const withPosition = { thread_id: THREAD_A, position: 2 };

    // Act
    const first = pinThreadSchema.safeParse(withoutPosition);
    const second = pinThreadSchema.safeParse(withPosition);
    const bad = pinThreadSchema.safeParse({ thread_id: THREAD_A, position: -1 });

    // Assert
    expect(first.success).toBe(true);
    expect(second.success).toBe(true);
    expect(bad.success).toBe(false);
  });
});

describe("unpinChatThread", () => {
  it("sends POST to unpin route", async () => {
    // Arrange
    mockJsonResponse({ thread_id: THREAD_A });
    const fetchSpy = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;

    // Act
    const result = await unpinChatThread(THREAD_A);

    // Assert
    expect(result).toEqual({ thread_id: THREAD_A });
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain(`/api/chat/threads/${THREAD_A}/unpin`);
    expect(init.method).toBe("POST");
    expect(init.credentials).toBe("include");
  });

  it("maps 409 not_pinned to not pinned error", async () => {
    // Arrange
    mockJsonResponse({ error: { code: "not_pinned", trace_id: "t1" } }, 409);

    // Act
    const result = await unpinChatThread(THREAD_A).catch((error: unknown) => error);

    // Assert
    expect(isNotPinnedError(result)).toBe(true);
    expect(isPinLimitError(result)).toBe(false);
  });
});

describe("reorderPinnedThreads", () => {
  it("sends POST with thread_ids and credentials", async () => {
    // Arrange
    mockJsonResponse({ thread_ids: [THREAD_A, THREAD_B] });
    const fetchSpy = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;

    // Act
    const result = await reorderPinnedThreads([THREAD_A, THREAD_B]);

    // Assert
    expect(result).toEqual({ thread_ids: [THREAD_A, THREAD_B] });
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/api/chat/threads/reorder");
    expect(init.method).toBe("POST");
    expect(init.credentials).toBe("include");
    expect(JSON.parse(init.body as string)).toEqual({
      thread_ids: [THREAD_A, THREAD_B],
    });
  });

  it("rejects more than 5 ids before send", () => {
    // Arrange
    const ids = [THREAD_A, THREAD_B, THREAD_C, THREAD_A, THREAD_B, THREAD_C];

    // Act
    const result = reorderPinnedThreadsSchema.safeParse({ thread_ids: ids });

    // Assert
    expect(result.success).toBe(false);
  });

  it("maps 422 to reorder validation error", async () => {
    // Arrange
    mockJsonResponse({ error: { code: "invalid_order", trace_id: "t1" } }, 422);

    // Act
    const result = await reorderPinnedThreads([THREAD_A]).catch(
      (error: unknown) => error,
    );

    // Assert
    expect(isReorderValidationError(result)).toBe(true);
  });
});

describe("movePinnedThreadOrder", () => {
  it("moves an id from one index to another", () => {
    // Arrange
    const order = [THREAD_A, THREAD_B, THREAD_C];

    // Act
    const result = movePinnedThreadOrder(order, 0, 2);

    // Assert
    expect(result).toEqual([THREAD_B, THREAD_C, THREAD_A]);
  });

  it("returns a copy when from equals to", () => {
    // Arrange
    const order = [THREAD_A, THREAD_B];

    // Act
    const result = movePinnedThreadOrder(order, 1, 1);

    // Assert
    expect(result).toEqual([THREAD_A, THREAD_B]);
    expect(result).not.toBe(order);
  });

  it("clamps out of range indexes", () => {
    // Arrange
    const order = [THREAD_A, THREAD_B];

    // Act
    const result = movePinnedThreadOrder(order, -5, 10);

    // Assert
    expect(result).toEqual([THREAD_B, THREAD_A]);
  });

  it("returns empty for empty input", () => {
    // Arrange
    const order: string[] = [];

    // Act
    const result = movePinnedThreadOrder(order, 0, 1);

    // Assert
    expect(result).toEqual([]);
  });
});

describe("pinned thread groups", () => {
  it("splits pinned first by pin_order", () => {
    // Arrange
    const threads = [
      makeThread(THREAD_B),
      makeThread(THREAD_A, { is_pinned: true, pin_order: 1 }),
      makeThread(THREAD_C, { is_pinned: true, pin_order: 0 }),
    ];

    // Act
    const pinned = getPinnedThreads(threads);
    const unpinned = getUnpinnedThreads(threads);

    // Assert
    expect(pinned.map((thread) => thread.thread_id)).toEqual([THREAD_C, THREAD_A]);
    expect(unpinned.map((thread) => thread.thread_id)).toEqual([THREAD_B]);
  });

  it("applies a new pinned order and keeps unpinned last", () => {
    // Arrange
    const threads = [
      makeThread(THREAD_A, { is_pinned: true, pin_order: 0 }),
      makeThread(THREAD_B, { is_pinned: true, pin_order: 1 }),
      makeThread(THREAD_C),
    ];

    // Act
    const result = applyPinnedOrder(threads, [THREAD_B, THREAD_A]);

    // Assert
    expect(result.map((thread) => thread.thread_id)).toEqual([
      THREAD_B,
      THREAD_A,
      THREAD_C,
    ]);
    expect(result[0]?.pin_order).toBe(0);
    expect(result[1]?.pin_order).toBe(1);
  });
});
