"use client";

import { useChatThreads } from "@/features/chat/hooks/use-chat-threads";
import type { ThreadInfo } from "@/features/chat/types/chat";

export function useChatThread(threadId: string | null): {
  thread: ThreadInfo | null;
  isLoading: boolean;
} {
  const { threads, isLoading } = useChatThreads();
  if (threadId === null || threadId.length === 0) return { thread: null, isLoading };
  const thread = threads.find((entry) => entry.thread_id === threadId) ?? null;
  return { thread, isLoading };
}
