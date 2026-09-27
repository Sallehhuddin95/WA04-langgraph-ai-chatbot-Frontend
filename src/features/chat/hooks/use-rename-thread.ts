"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { chatKeys } from "@/features/chat/hooks/use-chat-keys";
import { describeChatError } from "@/features/chat/services/chat-errors";
import { RENAME_FAILED_NOTICE, renameChatThread } from "@/features/chat/services/chat-threads";
import type { RenameThreadResponse } from "@/features/chat/types/chat";

export function useRenameThread(): {
  renameThread: (threadId: string, title: string) => Promise<RenameThreadResponse | null>;
  isRenaming: boolean;
  renamingThreadId: string | null;
} {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [renamingThreadId, setRenamingThreadId] = React.useState<string | null>(null);

  async function renameThread(
    threadId: string,
    title: string,
  ): Promise<RenameThreadResponse | null> {
    const trimmed = title.trim();
    if (trimmed.length === 0) return null;
    setRenamingThreadId(threadId);
    try {
      const result = await renameChatThread(threadId, trimmed);
      await queryClient.invalidateQueries({ queryKey: chatKeys.threads() });
      toast.success("Chat renamed.");
      return result;
    } catch (error) {
      const { kind } = describeChatError(error);
      if (kind === "signed-out") {
        router.push("/login");
        return null;
      }
      if (kind === "forbidden") {
        toast.error("You do not have access to this chat.");
        return null;
      }
      if (kind === "not-found") {
        await queryClient.invalidateQueries({ queryKey: chatKeys.threads() });
        toast.error("This chat was not found. Pick another chat or start a new one.");
        return null;
      }
      if (kind === "validation") {
        toast.error("Keep the title 1-120 characters.");
        return null;
      }
      toast.error(RENAME_FAILED_NOTICE);
      return null;
    } finally {
      setRenamingThreadId(null);
    }
  }

  return {
    renameThread,
    isRenaming: renamingThreadId !== null,
    renamingThreadId,
  };
}
