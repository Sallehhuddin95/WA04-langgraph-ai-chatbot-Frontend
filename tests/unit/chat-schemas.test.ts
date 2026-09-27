import { describe, expect, it } from "vitest";
import {
  createThreadSchema,
  createTurnSchema,
  listTurnsParamsSchema,
} from "@/features/chat/schemas/chat-schemas";

const THREAD_ID = "550e8400-e29b-41d4-a716-446655440000";

describe("createTurnSchema", () => {
  it("accepts a valid message", () => {
    // Arrange
    const input = { thread_id: THREAD_ID, message: "What is the refund policy?" };

    // Act
    const result = createTurnSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it("rejects an empty message", () => {
    // Arrange
    const input = { thread_id: THREAD_ID, message: "   " };

    // Act
    const result = createTurnSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("rejects a message over 4000 characters", () => {
    // Arrange
    const input = { thread_id: THREAD_ID, message: "a".repeat(4001) };

    // Act
    const result = createTurnSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("trims the message before validation", () => {
    // Arrange
    const input = { thread_id: THREAD_ID, message: "  hi  " };

    // Act
    const result = createTurnSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.message).toBe("hi");
  });

  it("rejects a missing thread id", () => {
    // Arrange
    const input = { thread_id: "", message: "hi" };

    // Act
    const result = createTurnSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });
});

describe("createThreadSchema", () => {
  it("allows a missing title", () => {
    // Act
    const result = createThreadSchema.safeParse({});

    // Assert
    expect(result.success).toBe(true);
  });

  it("rejects a title over 120 characters", () => {
    // Act
    const result = createThreadSchema.safeParse({ title: "a".repeat(121) });

    // Assert
    expect(result.success).toBe(false);
  });
});

describe("listTurnsParamsSchema", () => {
  it("defaults limit to 20 and cursor to null", () => {
    // Act
    const result = listTurnsParamsSchema.safeParse({ thread_id: THREAD_ID });

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(20);
      expect(result.data.cursor).toBeNull();
    }
  });

  it("rejects a limit above 50", () => {
    // Act
    const result = listTurnsParamsSchema.safeParse({ thread_id: THREAD_ID, limit: 51 });

    // Assert
    expect(result.success).toBe(false);
  });

  it("rejects a limit below 1", () => {
    // Act
    const result = listTurnsParamsSchema.safeParse({ thread_id: THREAD_ID, limit: 0 });

    // Assert
    expect(result.success).toBe(false);
  });
});
