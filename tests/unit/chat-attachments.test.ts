import { describe, expect, it } from "vitest";
import {
  listThreadsResponseSchema,
  threadSummarySchema,
  turnItemSchema,
  uploadAttachmentResponseSchema,
} from "@/features/chat/schemas/chat-schemas";
import {
  describeChatError,
  getChatErrorNotice,
  isInvalidFileError,
  isModelNoVisionError,
} from "@/features/chat/services/chat-errors";
import { ChatApiError } from "@/features/chat/types/chat";

const THREAD_ID = "550e8400-e29b-41d4-a716-446655440000";
const ATTACH_ID = "660e8400-e29b-41d4-a716-446655440001";

describe("thread list schemas", () => {
  it("accepts newest-first thread summaries", () => {
    // Arrange
    const input = {
      threads: [{ thread_id: THREAD_ID, title: "Refund help", updated_at: "2026-09-26T10:00:00Z" }],
    };

    // Act
    const result = listThreadsResponseSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it("rejects a thread without updated_at", () => {
    // Arrange
    const input = { thread_id: THREAD_ID, title: "Refund help" };

    // Act
    const result = threadSummarySchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });
});

describe("turn history citations", () => {
  it("accepts history items with citations", () => {
    // Arrange
    const input = {
      turn_id: "t1",
      role: "assistant",
      text: "Refunds close in 30 days.",
      citations: [{ chunk_id: "c1", document_id: "d1", quote: "refunds close in 30 days" }],
      created_at: "2026-09-26T10:01:00Z",
    };

    // Act
    const result = turnItemSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it("defaults citations to empty when missing", () => {
    // Arrange
    const input = {
      turn_id: "t2",
      role: "assistant",
      text: "Hello.",
      created_at: "2026-09-26T10:02:00Z",
    };

    // Act
    const result = turnItemSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.citations).toEqual([]);
  });
});

describe("upload response schema", () => {
  it("accepts a valid upload response", () => {
    // Arrange
    const input = {
      attachment_id: ATTACH_ID,
      filename: "photo.png",
      mime: "image/png",
      size: 2048,
    };

    // Act
    const result = uploadAttachmentResponseSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it("rejects an upload response without mime", () => {
    // Arrange
    const input = { attachment_id: ATTACH_ID, filename: "photo.png", size: 2048 };

    // Act
    const result = uploadAttachmentResponseSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });
});

describe("model_no_vision mapping", () => {
  it("detects model_no_vision by code", () => {
    // Arrange
    const error = new ChatApiError(422, "model_no_vision", "Chat request failed.", "tid");

    // Act
    const isNoVision = isModelNoVisionError(error);
    const { kind } = describeChatError(error);
    const notice = getChatErrorNotice(error);

    // Assert
    expect(isNoVision).toBe(true);
    expect(kind).toBe("validation");
    expect(notice).toBe("This model cannot use images. Select the vision model to attach images.");
  });

  it("does not flag other 422 codes as model_no_vision", () => {
    // Arrange
    const error = new ChatApiError(422, "invalid_file", "Chat request failed.", null);

    // Act
    const result = isModelNoVisionError(error);

    // Assert
    expect(result).toBe(false);
  });
});

describe("invalid file mapping", () => {
  it("detects invalid file codes", () => {
    // Arrange
    const codes = ["invalid_file", "invalid_file_type", "file_too_large"];

    // Act
    const results = codes.map((code) =>
      isInvalidFileError(new ChatApiError(422, code, "Chat request failed.", null)),
    );

    // Assert
    for (const result of results) expect(result).toBe(true);
  });

  it("maps invalid file to attach copy", () => {
    // Arrange
    const error = new ChatApiError(422, "invalid_file", "Chat request failed.", null);

    // Act
    const notice = getChatErrorNotice(error);

    // Assert
    expect(notice).toBe("That file could not be attached. Use an image under 5MB.");
  });
});
