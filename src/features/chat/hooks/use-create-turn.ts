"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createChatTurn } from "@/features/chat/services/chat-service";
import { describeChatError } from "@/features/chat/services/chat-errors";
import { chatKeys } from "@/features/chat/hooks/use-chat-keys";
import type {
  CreateTurnPayload,
  CreateTurnResponse,
} from "@/features/chat/types/chat";

export function notifyChatTurnFailed(error: unknown): void {
  const { kind } = describeChatError(error);
  if (kind === "rate-limited") {
    toast.error("Too many requests. Wait a moment and retry.");
    return;
  }
  if (kind === "offline") {
    toast.error("You are offline. Check your connection and try again.");
    return;
  }
  toast.error("Could not get the reply. Retry the failed turn.");
}

export function useCreateTurn(threadId: string): {
  send: (payload: CreateTurnPayload) => Promise<CreateTurnResponse>;
  isPending: boolean;
  error: unknown;
  reset: () => void;
} {
  const queryClient = useQueryClient();
  const router = useRouter();
  const mutation = useMutation({
    mutationFn: (payload: CreateTurnPayload) => createChatTurn(payload),
    onError: (error) => {
      const { kind } = describeChatError(error);
      if (kind === "signed-out") {
        router.push("/login");
        return;
      }
      if (kind === "conflict") {
        void queryClient.invalidateQueries({ queryKey: chatKeys.turns(threadId) });
      }
      notifyChatTurnFailed(error);
    },
  });
  return {
    send: (payload) => mutation.mutateAsync(payload),
    isPending: mutation.isPending,
    error: mutation.error,
    reset: () => mutation.reset(),
  };
}
