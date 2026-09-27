"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { chatKeys } from "@/features/chat/hooks/use-chat-keys";
import { describeChatError } from "@/features/chat/services/chat-errors";
import {
  NOT_PINNED_NOTICE,
  PIN_LIMIT_NOTICE,
  isNotPinnedError,
  isPinLimitError,
  pinChatThread,
  unpinChatThread,
} from "@/features/chat/services/chat-threads";

export function usePinThread(): {
  pinThread: (threadId: string, position?: number) => Promise<void>;
  unpinThread: (threadId: string) => Promise<void>;
  isPinning: boolean;
  pinningThreadId: string | null;
} {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [pinningThreadId, setPinningThreadId] = React.useState<string | null>(null);

  async function pinThread(threadId: string, position?: number): Promise<void> {
    setPinningThreadId(threadId);
    try {
      await pinChatThread(threadId, position);
      await queryClient.invalidateQueries({ queryKey: chatKeys.threads() });
      toast.success("Chat pinned.");
    } catch (error) {
      if (isPinLimitError(error)) {
        toast.error(PIN_LIMIT_NOTICE);
        return;
      }
      const { kind } = describeChatError(error);
      if (kind === "signed-out") {
        router.push("/login");
        return;
      }
      if (kind === "forbidden") {
        toast.error("You do not have access to this chat.");
        return;
      }
      if (kind === "not-found") {
        await queryClient.invalidateQueries({ queryKey: chatKeys.threads() });
        toast.error("This chat was not found. Pick another chat or start a new one.");
        return;
      }
      toast.error("Could not pin the chat. Try again.");
    } finally {
      setPinningThreadId(null);
    }
  }

  async function unpinThread(threadId: string): Promise<void> {
    setPinningThreadId(threadId);
    try {
      await unpinChatThread(threadId);
      await queryClient.invalidateQueries({ queryKey: chatKeys.threads() });
      toast.success("Chat unpinned.");
    } catch (error) {
      if (isNotPinnedError(error)) {
        await queryClient.invalidateQueries({ queryKey: chatKeys.threads() });
        toast.error(NOT_PINNED_NOTICE);
        return;
      }
      const { kind } = describeChatError(error);
      if (kind === "signed-out") {
        router.push("/login");
        return;
      }
      if (kind === "forbidden") {
        toast.error("You do not have access to this chat.");
        return;
      }
      if (kind === "not-found") {
        await queryClient.invalidateQueries({ queryKey: chatKeys.threads() });
        toast.error("This chat was not found. Pick another chat or start a new one.");
        return;
      }
      toast.error("Could not unpin the chat. Try again.");
    } finally {
      setPinningThreadId(null);
    }
  }

  return {
    pinThread,
    unpinThread,
    isPinning: pinningThreadId !== null,
    pinningThreadId,
  };
}
