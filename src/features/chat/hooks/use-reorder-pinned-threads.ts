"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { chatKeys } from "@/features/chat/hooks/use-chat-keys";
import { describeChatError } from "@/features/chat/services/chat-errors";
import {
  REORDER_FAILED_NOTICE,
  applyPinnedOrder,
  reorderPinnedThreads,
} from "@/features/chat/services/chat-threads";
import type { ThreadInfo } from "@/features/chat/types/chat";

export function useReorderPinnedThreads(): {
  reorder: (orderedIds: string[]) => Promise<void>;
  isReordering: boolean;
} {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isReordering, setIsReordering] = React.useState(false);

  async function reorder(orderedIds: string[]): Promise<void> {
    const key = chatKeys.threads();
    const previous = queryClient.getQueryData<ThreadInfo[]>(key);
    if (previous !== undefined) {
      queryClient.setQueryData<ThreadInfo[]>(key, applyPinnedOrder(previous, orderedIds));
    }
    setIsReordering(true);
    try {
      await reorderPinnedThreads(orderedIds);
      await queryClient.invalidateQueries({ queryKey: key });
    } catch (error) {
      if (previous !== undefined) {
        queryClient.setQueryData<ThreadInfo[]>(key, previous);
      }
      const { kind } = describeChatError(error);
      if (kind === "signed-out") {
        router.push("/login");
        return;
      }
      toast.error(REORDER_FAILED_NOTICE);
    } finally {
      setIsReordering(false);
    }
  }

  return { reorder, isReordering };
}
