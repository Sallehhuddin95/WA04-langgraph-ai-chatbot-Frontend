import { describe, expect, it } from "vitest";
import { describeChatError } from "@/features/chat/services/chat-errors";
import { ChatApiError } from "@/features/chat/types/chat";

describe("describeChatError", () => {
  it("maps a timeout to server so the turn stays retryable", () => {
    // Arrange
    const error = new ChatApiError(0, "timeout", "Chat request timed out.", null);

    // Act
    const { kind } = describeChatError(error);

    // Assert
    expect(kind).toBe("server");
  });

  it("maps a status 0 network failure to offline", () => {
    // Arrange
    const error = new ChatApiError(0, "network_error", "Network request failed.", null);

    // Act
    const { kind } = describeChatError(error);

    // Assert
    expect(kind).toBe("offline");
  });

  it("maps 429 to rate-limited", () => {
    // Arrange
    const error = new ChatApiError(429, "rate_limited", "Slow down.", null);

    // Act
    const { kind } = describeChatError(error);

    // Assert
    expect(kind).toBe("rate-limited");
  });

  it("maps 5xx to server", () => {
    // Arrange
    const error = new ChatApiError(502, "model_error", "Outage.", "tid");

    // Act
    const { kind, traceId } = describeChatError(error);

    // Assert
    expect(kind).toBe("server");
    expect(traceId).toBe("tid");
  });
});
