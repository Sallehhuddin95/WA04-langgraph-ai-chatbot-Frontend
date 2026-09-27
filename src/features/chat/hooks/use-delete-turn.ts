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
  deleteChatTurn,
  isNotDeletedError,
  isUndoExpiredError,
  restoreChatTurn,
} from "@/features/chat/services/chat-delete";
import { describeChatError } from "@/features/chat/services/chat-errors";

export function useDeleteTurn(threadId: string | null): {
  deleteTurn: (turnId: string) => Promise<void>;
  restoreTurn: (turnId: string) => Promise<void>;
  isDeleting: boolean;
  deletingTurnId: string | null;
} {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [deletingTurnId, setDeletingTurnId] = React.useState<string | null>(null);

  async function restoreTurn(turnId: string): Promise<void> {
    if (threadId === null || threadId.length === 0) return;
    const currentThreadId = threadId;
    try {
      await restoreChatTurn(currentThreadId, turnId);
      await queryClient.invalidateQueries({ queryKey: chatKeys.turns(currentThreadId) });
      toast.success("Message restored.");
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
        await queryClient.invalidateQueries({ queryKey: chatKeys.turns(currentThreadId) });
        toast.error("That message was not found. List refreshed.");
        return;
      }
      toast.error("Could not restore the message. Try again.", {
        action: {
          label: "Retry",
          onClick: () => {
            void restoreTurn(turnId);
          },
        },
      });
    }
  }

  async function deleteTurn(turnId: string): Promise<void> {
    if (threadId === null || threadId.length === 0) return;
    const currentThreadId = threadId;
    setDeletingTurnId(turnId);
    try {
      await deleteChatTurn(currentThreadId, turnId);
      await queryClient.invalidateQueries({ queryKey: chatKeys.turns(currentThreadId) });
      toast.success("Message deleted.", {
        duration: UNDO_TOAST_DURATION_MS,
        action: {
          label: "Undo",
          onClick: () => {
            void restoreTurn(turnId);
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
        await queryClient.invalidateQueries({ queryKey: chatKeys.turns(currentThreadId) });
        toast.error("That message was not found. List refreshed.");
        return;
      }
      toast.error("Could not delete the message. Try again.", {
        action: {
          label: "Retry",
          onClick: () => {
            void deleteTurn(turnId);
          },
        },
      });
    } finally {
      setDeletingTurnId(null);
    }
  }

  return {
    deleteTurn,
    restoreTurn,
    isDeleting: deletingTurnId !== null,
    deletingTurnId,
  };
}
