import { describe, expect, it } from "vitest";
import {
  getChatErrorNotice,
  getRetryAfterSeconds,
} from "@/features/chat/services/chat-errors";
import { getAuthErrorMessage } from "@/features/auth/services/auth-errors";
import { ChatApiError } from "@/features/chat/types/chat";
import { AuthApiError } from "@/features/auth/types/auth";

describe("retry-after handling", () => {
  it("reads retry seconds from chat errors", () => {
    const error = new ChatApiError(429, "rate_limited", "Slow.", null, 23);
    expect(getRetryAfterSeconds(error)).toBe(23);
    expect(getChatErrorNotice(error)).toBe("Rate limit hit. Try again in 23 seconds.");
  });

  it("falls back when chat retry is unknown", () => {
    const error = new ChatApiError(429, "rate_limited", "Slow.", null, null);
    expect(getChatErrorNotice(error)).toBe("Rate limit hit. Wait a moment and try again.");
  });

  it("shows wait time for auth throttling", () => {
    const error = new AuthApiError(429, "rate_limited", "Slow.", null, 45);
    expect(getAuthErrorMessage(error)).toBe("Too many attempts. Try again in 45 seconds.");
  });
});
