import type {
  ChatCitation,
  IntentCategory,
  SseDoneEvent,
  SseDeltaEvent,
  StreamAccumulator,
} from "@/features/chat/types/chat";

export interface ParsedSseEvent {
  name: string;
  data: string;
}

export const INITIAL_ACCUMULATOR: StreamAccumulator = {
  text: "",
  citations: [],
  turn_id: null,
  trace_id: null,
  intent_category: null,
  is_grounded: null,
};

export function parseSseBuffer(buffer: string): {
  events: ParsedSseEvent[];
  rest: string;
} {
  const events: ParsedSseEvent[] = [];
  const parts = buffer.split("\n\n");
  const rest = parts.pop() ?? "";
  for (const part of parts) {
    if (part.trim().length === 0) continue;
    let name = "message";
    const dataLines: string[] = [];
    for (const line of part.split("\n")) {
      if (line.startsWith("event:")) {
        name = line.slice("event:".length).trim();
      } else if (line.startsWith("data:")) {
        dataLines.push(line.slice("data:".length).trimStart());
      }
    }
    events.push({ name, data: dataLines.join("\n") });
  }
  return { events, rest };
}

function isIntentCategory(value: unknown): value is IntentCategory {
  return value === "simple_chat" || value === "rag_search" || value === "complex_task";
}

export function applySseEvent(
  acc: StreamAccumulator,
  event: ParsedSseEvent,
): StreamAccumulator {
  if (event.name === "delta") {
    let parsed: Partial<SseDeltaEvent> = {};
    try {
      parsed = JSON.parse(event.data) as Partial<SseDeltaEvent>;
    } catch {
      return acc;
    }
    const delta = typeof parsed.delta === "string" ? parsed.delta : "";
    return {
      ...acc,
      text: acc.text + delta,
      turn_id: typeof parsed.turn_id === "string" ? parsed.turn_id : acc.turn_id,
      trace_id: typeof parsed.trace_id === "string" ? parsed.trace_id : acc.trace_id,
    };
  }
  if (event.name === "citation") {
    let parsed: Partial<ChatCitation> = {};
    try {
      parsed = JSON.parse(event.data) as Partial<ChatCitation>;
    } catch {
      return acc;
    }
    if (
      typeof parsed.chunk_id !== "string" ||
      typeof parsed.document_id !== "string" ||
      typeof parsed.quote !== "string"
    ) {
      return acc;
    }
    return {
      ...acc,
      citations: [
        ...acc.citations,
        {
          chunk_id: parsed.chunk_id,
          document_id: parsed.document_id,
          quote: parsed.quote,
        },
      ],
    };
  }
  if (event.name === "done") {
    let parsed: Partial<SseDoneEvent> = {};
    try {
      parsed = JSON.parse(event.data) as Partial<SseDoneEvent>;
    } catch {
      return acc;
    }
    return {
      ...acc,
      turn_id: typeof parsed.turn_id === "string" ? parsed.turn_id : acc.turn_id,
      trace_id: typeof parsed.trace_id === "string" ? parsed.trace_id : acc.trace_id,
      intent_category: isIntentCategory(parsed.intent_category)
        ? parsed.intent_category
        : acc.intent_category,
      is_grounded:
        typeof parsed.is_grounded === "boolean" ? parsed.is_grounded : acc.is_grounded,
    };
  }
  return acc;
}

export interface StreamReaderOptions {
  signal?: AbortSignal;
  idleTimeoutMs?: number;
  onEvent?: (event: ParsedSseEvent, acc: StreamAccumulator) => void;
}

export async function readSseStream(
  response: Response,
  options: StreamReaderOptions = {},
): Promise<StreamAccumulator> {
  const idleTimeoutMs = options.idleTimeoutMs ?? 60_000;
  if (response.body === null) return { ...INITIAL_ACCUMULATOR };
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let acc: StreamAccumulator = { ...INITIAL_ACCUMULATOR, citations: [] };
  let buffer = "";
  let idleTimer: ReturnType<typeof setTimeout> | null = null;
  const idleController = new AbortController();

  function armIdle(): void {
    if (idleTimer !== null) clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      idleController.abort();
      void reader.cancel().catch(() => undefined);
    }, idleTimeoutMs);
  }

  function clearIdle(): void {
    if (idleTimer !== null) clearTimeout(idleTimer);
    idleTimer = null;
  }

  const externalSignal = options.signal;
  const onAbort = (): void => {
    void reader.cancel().catch(() => undefined);
  };
  if (externalSignal !== undefined) {
    if (externalSignal.aborted) {
      await reader.cancel().catch(() => undefined);
      return acc;
    }
    externalSignal.addEventListener("abort", onAbort, { once: true });
  }

  try {
    armIdle();
    for (;;) {
      if (idleController.signal.aborted) {
        throw new Error("Stream idle timeout.");
      }
      const { done, value } = await reader.read();
      if (done) {
        if (buffer.trim().length > 0) {
          const tail = parseSseBuffer(buffer + "\n\n");
          for (const event of tail.events) {
            acc = applySseEvent(acc, event);
            options.onEvent?.(event, acc);
          }
        }
        break;
      }
      armIdle();
      buffer += decoder.decode(value, { stream: true });
      const { events, rest } = parseSseBuffer(buffer);
      buffer = rest;
      for (const event of events) {
        acc = applySseEvent(acc, event);
        options.onEvent?.(event, acc);
        if (event.name === "done") {
          clearIdle();
          await reader.cancel().catch(() => undefined);
          return acc;
        }
      }
    }
    return acc;
  } finally {
    clearIdle();
    externalSignal?.removeEventListener("abort", onAbort);
    reader.releaseLock();
  }
}
