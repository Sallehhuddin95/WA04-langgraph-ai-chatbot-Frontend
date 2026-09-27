"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { chatKeys } from "@/features/chat/hooks/use-chat-keys";
import {
  NOT_DELETED_NOTICE,
  UNDO_EXPIRED_NOTICE,
  UNDO_TOAST_DURATION_MS,
  deleteChatThread,
  formatPurgeNotice,
  isNotDeletedError,
  isUndoExpiredError,
  restoreChatThread,
} from "@/features/chat/services/chat-delete";
import { describeChatError } from "@/features/chat/services/chat-errors";

export function useDeleteThread(activeThreadId: string | null): {
  deleteThread: (threadId: string) => Promise<void>;
  restoreThread: (threadId: string) => Promise<void>;
  isDeleting: boolean;
  deletingThreadId: string | null;
} {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [deletingThreadId, setDeletingThreadId] = React.useState<string | null>(null);

  async function restoreThread(threadId: string): Promise<void> {
    try {
      await restoreChatThread(threadId);
      await queryClient.invalidateQueries({ queryKey: chatKeys.threads() });
      await queryClient.invalidateQueries({ queryKey: chatKeys.turns(threadId) });
      await queryClient.invalidateQueries({ queryKey: chatKeys.deletedThreads() });
      await queryClient.invalidateQueries({ queryKey: chatKeys.purgeReminders() });
      toast.success("Chat restored.");
    } catch (error) {
      if (isUndoExpiredError(error)) {
        toast.error(UNDO_EXPIRED_NOTICE);
        return;
      }
      if (isNotDeletedError(error)) {
        toast.error(NOT_DELETED_NOTICE);
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
      toast.error("Could not restore the chat. Try again.", {
        action: {
          label: "Retry",
          onClick: () => {
            void restoreThread(threadId);
          },
        },
      });
    }
  }

  async function deleteThread(threadId: string): Promise<void> {
    setDeletingThreadId(threadId);
    try {
      const deleted = await deleteChatThread(threadId);
      await queryClient.cancelQueries({ queryKey: chatKeys.turns(threadId) });
      queryClient.removeQueries({ queryKey: chatKeys.turns(threadId) });
      await queryClient.invalidateQueries({ queryKey: chatKeys.threads() });
      await queryClient.invalidateQueries({ queryKey: chatKeys.deletedThreads() });
      if (threadId === activeThreadId) router.push("/chat");
      toast.success(`Chat deleted. ${formatPurgeNotice(deleted.days_remaining)}`, {
        duration: UNDO_TOAST_DURATION_MS,
        action: {
          label: "Undo",
          onClick: () => {
            void restoreThread(threadId);
          },
        },
      });
    } catch (error) {
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
        await queryClient.cancelQueries({ queryKey: chatKeys.turns(threadId) });
        queryClient.removeQueries({ queryKey: chatKeys.turns(threadId) });
        await queryClient.invalidateQueries({ queryKey: chatKeys.threads() });
        if (threadId === activeThreadId) router.push("/chat");
        toast.error("This chat was not found. Pick another chat or start a new one.");
        return;
      }
      toast.error("Could not delete the chat. Try again.", {
        action: {
          label: "Retry",
          onClick: () => {
            void deleteThread(threadId);
          },
        },
      });
    } finally {
      setDeletingThreadId(null);
    }
  }

  return {
    deleteThread,
    restoreThread,
    isDeleting: deletingThreadId !== null,
    deletingThreadId,
  };
}
