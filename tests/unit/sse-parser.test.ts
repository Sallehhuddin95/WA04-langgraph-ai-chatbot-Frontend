import { describe, expect, it } from "vitest";
import {
  INITIAL_ACCUMULATOR,
  applySseEvent,
  parseSseBuffer,
  readSseStream,
} from "@/features/chat/services/sse-parser";

describe("parseSseBuffer", () => {
  it("splits delta and done events and keeps the tail", () => {
    // Arrange
    const buffer =
      'event: delta\ndata: {"turn_id":"t1","trace_id":"tr1","delta":"hello "}\n\n' +
      'event: done\ndata: {"turn_id":"t1","trace_id":"tr1","intent_category":"rag_search","is_grounded":true}\n\n' +
      "event: delta\n";

    // Act
    const result = parseSseBuffer(buffer);

    // Assert
    expect(result.events).toHaveLength(2);
    expect(result.events[0]?.name).toBe("delta");
    expect(result.events[1]?.name).toBe("done");
    expect(result.rest).toBe("event: delta\n");
  });

  it("joins multiline data lines", () => {
    // Arrange
    const buffer = "event: delta\ndata: line one\ndata: line two\n\n";

    // Act
    const result = parseSseBuffer(buffer);

    // Assert
    expect(result.events[0]?.data).toBe("line one\nline two");
  });
});

describe("applySseEvent", () => {
  it("appends delta text in order", () => {
    // Arrange
    const first = { name: "delta", data: '{"turn_id":"t1","trace_id":"tr1","delta":"hello "}' };
    const second = { name: "delta", data: '{"turn_id":"t1","trace_id":"tr1","delta":"world"}' };

    // Act
    const afterFirst = applySseEvent(INITIAL_ACCUMULATOR, first);
    const afterSecond = applySseEvent(afterFirst, second);

    // Assert
    expect(afterSecond.text).toBe("hello world");
    expect(afterSecond.turn_id).toBe("t1");
    expect(afterSecond.trace_id).toBe("tr1");
  });

  it("collects citation events", () => {
    // Arrange
    const event = {
      name: "citation",
      data: '{"chunk_id":"c1","document_id":"d1","quote":"refunds close in 30 days"}',
    };

    // Act
    const result = applySseEvent(INITIAL_ACCUMULATOR, event);

    // Assert
    expect(result.citations).toHaveLength(1);
    expect(result.citations[0]?.quote).toBe("refunds close in 30 days");
  });

  it("applies done flags", () => {
    // Arrange
    const event = {
      name: "done",
      data: '{"turn_id":"t1","trace_id":"tr1","intent_category":"rag_search","is_grounded":true}',
    };

    // Act
    const result = applySseEvent(INITIAL_ACCUMULATOR, event);

    // Assert
    expect(result.intent_category).toBe("rag_search");
    expect(result.is_grounded).toBe(true);
  });

  it("ignores malformed event data", () => {
    // Arrange
    const event = { name: "delta", data: "not json" };

    // Act
    const result = applySseEvent(INITIAL_ACCUMULATOR, event);

    // Assert
    expect(result.text).toBe("");
  });
});

describe("readSseStream", () => {
  it("reads deltas, citations, and done from a byte stream", async () => {
    // Arrange
    const encoder = new TextEncoder();
    const chunks = [
      'event: delta\ndata: {"turn_id":"t1","trace_id":"tr1","delta":"hello "}\n\n',
      'event: citation\ndata: {"chunk_id":"c1","document_id":"d1","quote":"hello policy"}\n\n',
      'event: delta\ndata: {"turn_id":"t1","trace_id":"tr1","delta":"world"}\n\n',
      'event: done\ndata: {"turn_id":"t1","trace_id":"tr1","intent_category":"simple_chat","is_grounded":false}\n\n',
    ];
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
        controller.close();
      },
    });
    const response = new Response(stream);

    // Act
    const acc = await readSseStream(response, { idleTimeoutMs: 5_000 });

    // Assert
    expect(acc.text).toBe("hello world");
    expect(acc.citations).toHaveLength(1);
    expect(acc.intent_category).toBe("simple_chat");
    expect(acc.is_grounded).toBe(false);
  });
});
