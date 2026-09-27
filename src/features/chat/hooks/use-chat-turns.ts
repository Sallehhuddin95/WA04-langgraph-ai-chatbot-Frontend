"use client";

import * as React from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { chatKeys } from "@/features/chat/hooks/use-chat-keys";
import { listTurns } from "@/features/chat/services/chat-service";
import type { TurnItem } from "@/features/chat/types/chat";

export const DEFAULT_TURNS_LIMIT = 50;
export const MAX_AUTO_TURNS = 250;

export function useChatTurns(threadId: string | null, limit: number = DEFAULT_TURNS_LIMIT): {
  items: TurnItem[];
  nextCursor: string | null;
  hasMore: boolean;
  isLoading: boolean;
  isFetchingMore: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
  loadMore: () => void;
} {
  const enabled = threadId !== null && threadId.length > 0;
  const query = useInfiniteQuery({
    queryKey: [...chatKeys.turns(threadId ?? ""), limit],
    queryFn: ({ pageParam }) => {
      if (threadId === null) throw new Error("Chat id is required.");
      const cursor = pageParam as string | null;
      return listTurns({ thread_id: threadId, limit, cursor });
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.next_cursor,
    enabled,
    retry: false,
  });

  const pages = query.data?.pages ?? [];
  const items = pages.flatMap((page) => page.items);
  const lastPage = pages.length > 0 ? pages[pages.length - 1] : undefined;
  const nextCursor = lastPage?.next_cursor ?? null;

  // A thread must never look like messages vanished: keep pulling older
  // pages until history is complete (capped) so the newest turn is always
  // in view and the stream merge always finds its server twin.
  React.useEffect(() => {
    if (!enabled) return;
    if (query.isLoading || query.isFetchingNextPage || query.isError) return;
    if (nextCursor === null) return;
    if (items.length >= MAX_AUTO_TURNS) return;
    void query.fetchNextPage();
  }, [enabled, query.isLoading, query.isFetchingNextPage, query.isError, nextCursor, items.length]);

  return {
    items,
    nextCursor,
    hasMore: nextCursor !== null,
    isLoading: query.isLoading,
    isFetchingMore: query.isFetchingNextPage,
    isError: query.isError,
    error: query.error,
    refetch: () => {
      void query.refetch();
    },
    loadMore: () => {
      if (nextCursor !== null && !query.isFetchingNextPage) void query.fetchNextPage();
    },
  };
}
