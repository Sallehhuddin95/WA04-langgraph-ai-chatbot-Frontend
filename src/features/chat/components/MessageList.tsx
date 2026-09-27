"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { ChatMessage, type ChatMessageModel } from "@/features/chat/components/ChatMessage";
import { Skeleton } from "@/components/ui/skeleton";

export interface MessageListProps {
  messages: ChatMessageModel[];
  isLoading: boolean;
  hasThread: boolean;
  retryKey: string | null;
  isRetrying: boolean;
  onRetry: (key: string) => void;
  hasMore?: boolean;
  isFetchingMore?: boolean;
  onLoadMore?: () => void;
  onDeleteMessage?: (turnId: string) => void;
  deletingTurnId?: string | null;
}

export function MessageList({
  messages,
  isLoading,
  hasThread,
  retryKey,
  isRetrying,
  onRetry,
  hasMore = false,
  isFetchingMore = false,
  onLoadMore,
  onDeleteMessage,
  deletingTurnId = null,
}: MessageListProps): React.JSX.Element {
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const pinnedRef = React.useRef(true);
  const [showTopFade, setShowTopFade] = React.useState(false);

  function handleScroll(): void {
    const node = scrollRef.current;
    if (node === null) return;
    const distance = node.scrollHeight - node.scrollTop - node.clientHeight;
    pinnedRef.current = distance < 80;
    setShowTopFade(node.scrollTop > 8);
  }

  React.useEffect(() => {
    const node = scrollRef.current;
    if (node === null || !pinnedRef.current) return;
    node.scrollTop = node.scrollHeight;
  }, [messages]);

  if (isLoading) {
    return (
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-clip"
      >
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-4 pt-1" aria-label="Loading messages">
          <p className="text-[13px] text-slate-500 dark:text-slate-400">Loading messages.</p>
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (!hasThread) {
    return (
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-clip"
      >
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-2 px-4 py-16 text-center">
          <p className="text-[15px] text-slate-900 dark:text-slate-100">
            No chats yet. Start your first chat below.
          </p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-clip"
      >
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-2 px-4 py-16 text-center">
          <p className="text-[15px] text-slate-900 dark:text-slate-100">
            Ask a question to begin. Replies show sources when available.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-clip"
    >
      {showTopFade ? (
        <div
          aria-hidden="true"
          className="pointer-events-none sticky top-0 z-10 -mb-6 h-6 shrink-0 bg-gradient-to-b from-slate-50 to-transparent dark:from-slate-950"
        />
      ) : null}
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 pb-10 pt-1">
      {hasMore && onLoadMore !== undefined ? (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onLoadMore}
            disabled={isFetchingMore}
          >
            {isFetchingMore ? "Loading more." : "Load more"}
          </Button>
        </div>
      ) : null}
      {messages.map((message) => {
        const turnId = message.turnId ?? message.key;
        const isSystemKey =
          message.key.startsWith("pending-") ||
          message.key.endsWith("-thinking") ||
          message.key === "streaming" ||
          message.key === "stream-failed" ||
          message.key === "stopped";
        const canDelete =
          message.status === "settled" && !isSystemKey && onDeleteMessage !== undefined;
        return (
          <ChatMessage
            key={message.key}
            message={message}
            onRetry={message.status === "failed" || message.status === "stopped" ? () => onRetry(message.key) : undefined}
            isRetrying={retryKey === message.key && isRetrying}
            onDelete={canDelete && onDeleteMessage !== undefined ? () => onDeleteMessage(turnId) : undefined}
            isDeleting={deletingTurnId !== null && deletingTurnId === turnId}
          />
        );
      })}
      </div>
    </div>
  );
}
