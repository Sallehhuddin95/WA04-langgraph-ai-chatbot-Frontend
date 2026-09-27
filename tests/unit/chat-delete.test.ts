import { afterEach, describe, expect, it, vi } from "vitest";
import {
  NOT_DELETED_NOTICE,
  UNDO_EXPIRED_NOTICE,
  UNDO_TOAST_DURATION_MS,
  deleteChatThread,
  deleteChatTurn,
  isNotDeletedError,
  isUndoExpiredError,
  restoreChatThread,
  restoreChatTurn,
} from "@/features/chat/services/chat-delete";
import { ChatApiError } from "@/features/chat/types/chat";

const THREAD_ID = "thread-123";
const TURN_ID = "turn-456";

function mockJsonResponse(body: unknown, status = 200): void {
  const response = new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("UNDO_TOAST_DURATION_MS", () => {
  it("lasts exactly 10 seconds", () => {
    // Arrange
    const expected = 10000;

    // Act
    const result = UNDO_TOAST_DURATION_MS;

    // Assert
    expect(result).toBe(expected);
  });

  it("uses plain copy for expired and missing restores", () => {
    // Arrange
    const expired = UNDO_EXPIRED_NOTICE;
    const missing = NOT_DELETED_NOTICE;

    // Act
    const hasDash = `${expired} ${missing}`.includes("--");

    // Assert
    expect(expired).toBe("Too late to undo.");
    expect(missing).toBe("Nothing to restore.");
    expect(hasDash).toBe(false);
  });
});

describe("deleteChatThread", () => {
  it("sends DELETE to the thread route with credentials", async () => {
    // Arrange
    mockJsonResponse({ thread_id: THREAD_ID });
    const fetchSpy = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;

    // Act
    const result = await deleteChatThread(THREAD_ID);

    // Assert
    expect(result).toEqual({ thread_id: THREAD_ID });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain(`/api/chat/threads/${THREAD_ID}`);
    expect(init.method).toBe("DELETE");
    expect(init.credentials).toBe("include");
  });

  it("maps 404 to ChatApiError with status 404", async () => {
    // Arrange
    mockJsonResponse({ error: { code: "not_found", trace_id: "t1" } }, 404);

    // Act
    const result = await deleteChatThread(THREAD_ID).catch((error: unknown) => error);

    // Assert
    expect(result).toBeInstanceOf(ChatApiError);
    const apiError = result as ChatApiError;
    expect(apiError.status).toBe(404);
    expect(apiError.code).toBe("not_found");
  });

  it("maps 401 to signed out status", async () => {
    // Arrange
    mockJsonResponse({ error: { code: "unauthorized", trace_id: "t1" } }, 401);

    // Act
    const result = await deleteChatThread(THREAD_ID).catch((error: unknown) => error);

    // Assert
    expect(result).toBeInstanceOf(ChatApiError);
    expect((result as ChatApiError).status).toBe(401);
  });

  it("maps 403 to forbidden status", async () => {
    // Arrange
    mockJsonResponse({ error: { code: "forbidden", trace_id: "t1" } }, 403);

    // Act
    const result = await deleteChatThread(THREAD_ID).catch((error: unknown) => error);

    // Assert
    expect((result as ChatApiError).status).toBe(403);
  });

  it("maps 500 to server status", async () => {
    // Arrange
    mockJsonResponse({ error: { code: "internal", trace_id: "t1" } }, 500);

    // Act
    const result = await deleteChatThread(THREAD_ID).catch((error: unknown) => error);

    // Assert
    expect((result as ChatApiError).status).toBe(500);
  });
});

describe("restoreChatThread", () => {
  it("sends POST to the thread restore route", async () => {
    // Arrange
    mockJsonResponse({ thread_id: THREAD_ID });
    const fetchSpy = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;

    // Act
    const result = await restoreChatThread(THREAD_ID);

    // Assert
    expect(result).toEqual({ thread_id: THREAD_ID });
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain(`/api/chat/threads/${THREAD_ID}/restore`);
    expect(init.method).toBe("POST");
    expect(init.credentials).toBe("include");
  });

  it("keeps the gone code on 410", async () => {
    // Arrange
    mockJsonResponse({ error: { code: "gone", trace_id: "t1" } }, 410);

    // Act
    const result = await restoreChatThread(THREAD_ID).catch((error: unknown) => error);

    // Assert
    expect(result).toBeInstanceOf(ChatApiError);
    const apiError = result as ChatApiError;
    expect(apiError.status).toBe(410);
    expect(apiError.code).toBe("gone");
    expect(isUndoExpiredError(apiError)).toBe(true);
  });

  it("keeps not_deleted on 409", async () => {
    // Arrange
    mockJsonResponse({ error: { code: "not_deleted", trace_id: "t1" } }, 409);

    // Act
    const result = await restoreChatThread(THREAD_ID).catch((error: unknown) => error);

    // Assert
    expect((result as ChatApiError).status).toBe(409);
    expect((result as ChatApiError).code).toBe("not_deleted");
    expect(isNotDeletedError(result)).toBe(true);
  });
});

describe("deleteChatTurn", () => {
  it("sends DELETE to the turn route with credentials", async () => {
    // Arrange
    mockJsonResponse({ turn_id: TURN_ID });
    const fetchSpy = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;

    // Act
    const result = await deleteChatTurn(THREAD_ID, TURN_ID);

    // Assert
    expect(result).toEqual({ turn_id: TURN_ID });
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain(`/api/chat/threads/${THREAD_ID}/turns/${TURN_ID}`);
    expect(init.method).toBe("DELETE");
    expect(init.credentials).toBe("include");
  });

  it("maps 404 to ChatApiError with status 404", async () => {
    // Arrange
    mockJsonResponse({ error: { code: "not_found", trace_id: "t1" } }, 404);

    // Act
    const result = await deleteChatTurn(THREAD_ID, TURN_ID).catch((error: unknown) => error);

    // Assert
    expect((result as ChatApiError).status).toBe(404);
  });
});

describe("restoreChatTurn", () => {
  it("sends POST to the turn restore route", async () => {
    // Arrange
    mockJsonResponse({ turn_id: TURN_ID });
    const fetchSpy = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;

    // Act
    const result = await restoreChatTurn(THREAD_ID, TURN_ID);

    // Assert
    expect(result).toEqual({ turn_id: TURN_ID });
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain(`/api/chat/threads/${THREAD_ID}/turns/${TURN_ID}/restore`);
    expect(init.method).toBe("POST");
    expect(init.credentials).toBe("include");
  });

  it("flags 410 gone as expired undo", async () => {
    // Arrange
    mockJsonResponse({ error: { code: "gone", trace_id: "t1" } }, 410);

    // Act
    const result = await restoreChatTurn(THREAD_ID, TURN_ID).catch((error: unknown) => error);

    // Assert
    expect(isUndoExpiredError(result)).toBe(true);
    expect(isNotDeletedError(result)).toBe(false);
  });
});
