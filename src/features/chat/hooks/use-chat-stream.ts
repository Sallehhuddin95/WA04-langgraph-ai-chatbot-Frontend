"use client";

import * as React from "react";
import { streamChatTurn } from "@/features/chat/services/chat-service";
import type {
  ChatCitation,
  IntentCategory,
} from "@/features/chat/types/chat";

export type StreamStatus = "idle" | "streaming" | "done" | "error" | "stopped";

export interface StartStreamInput {
  threadId: string;
  turnId: string;
}

export function useChatStream(): {
  status: StreamStatus;
  text: string;
  citations: ChatCitation[];
  turnId: string | null;
  traceId: string | null;
  intentCategory: IntentCategory | null;
  isGrounded: boolean | null;
  canRetry: boolean;
  start: (input: StartStreamInput) => Promise<void>;
  stop: () => void;
  retry: () => Promise<void>;
  reset: () => void;
} {
  const [status, setStatus] = React.useState<StreamStatus>("idle");
  const [text, setText] = React.useState("");
  const [citations, setCitations] = React.useState<ChatCitation[]>([]);
  const [activeTurnId, setActiveTurnId] = React.useState<string | null>(null);
  const [traceId, setTraceId] = React.useState<string | null>(null);
  const [intentCategory, setIntentCategory] = React.useState<IntentCategory | null>(null);
  const [isGrounded, setIsGrounded] = React.useState<boolean | null>(null);
  const [canRetry, setCanRetry] = React.useState(false);

  const abortRef = React.useRef<AbortController | null>(null);
  const lastInputRef = React.useRef<StartStreamInput | null>(null);
  const retryUsedRef = React.useRef(false);
  const runIdRef = React.useRef(0);

  const stop = React.useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStatus((current) => (current === "streaming" ? "stopped" : current));
  }, []);

  const start = React.useCallback(async (input: StartStreamInput) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    lastInputRef.current = input;
    retryUsedRef.current = false;
    const runId = runIdRef.current + 1;
    runIdRef.current = runId;

    setStatus("streaming");
    setText("");
    setCitations([]);
    setActiveTurnId(input.turnId);
    setTraceId(null);
    setIntentCategory(null);
    setIsGrounded(null);
    setCanRetry(false);

    try {
      const acc = await streamChatTurn({
        threadId: input.threadId,
        turnId: input.turnId,
        signal: controller.signal,
        idleTimeoutMs: 60_000,
        onEvent: (_event, next) => {
          if (runIdRef.current !== runId) return;
          setText(next.text);
          setCitations([...next.citations]);
          setActiveTurnId(next.turn_id);
          setTraceId(next.trace_id);
          setIntentCategory(next.intent_category);
          setIsGrounded(next.is_grounded);
        },
      });
      if (runIdRef.current !== runId) return;
      setText(acc.text);
      setCitations([...acc.citations]);
      setTraceId(acc.trace_id);
      setIntentCategory(acc.intent_category);
      setIsGrounded(acc.is_grounded);
      setStatus("done");
    } catch (error) {
      if (runIdRef.current !== runId) return;
      if (error instanceof DOMException && error.name === "AbortError") {
        setStatus((current) => (current === "streaming" ? "stopped" : current));
        return;
      }
      setStatus("error");
      setCanRetry(true);
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  }, []);

  const retry = React.useCallback(async () => {
    const last = lastInputRef.current;
    if (last === null || retryUsedRef.current) return;
    retryUsedRef.current = true;
    setCanRetry(false);
    await start(last);
  }, [start]);

  const reset = React.useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    lastInputRef.current = null;
    retryUsedRef.current = false;
    setStatus("idle");
    setText("");
    setCitations([]);
    setActiveTurnId(null);
    setTraceId(null);
    setIntentCategory(null);
    setIsGrounded(null);
    setCanRetry(false);
  }, []);

  // Close the reader when the route unmounts.
  React.useEffect(() => {
    return () => {
      abortRef.current?.abort();
      abortRef.current = null;
    };
  }, []);

  return {
    status,
    text,
    citations,
    turnId: activeTurnId,
    traceId,
    intentCategory,
    isGrounded,
    canRetry,
    start,
    stop,
    retry,
    reset,
  };
}
