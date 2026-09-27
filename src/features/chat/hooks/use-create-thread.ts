"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { chatKeys } from "@/features/chat/hooks/use-chat-keys";
import { createThread } from "@/features/chat/services/chat-service";
import { describeChatError } from "@/features/chat/services/chat-errors";
import type {
  CreateThreadPayload,
  CreateThreadResponse,
} from "@/features/chat/types/chat";

export function useCreateThread(): {
  create: (payload: CreateThreadPayload) => Promise<CreateThreadResponse>;
  isPending: boolean;
} {
  const queryClient = useQueryClient();
  const router = useRouter();
  const mutation = useMutation({
    mutationFn: (payload: CreateThreadPayload) => createThread(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chatKeys.threads() });
    },
    onError: (error) => {
      const { kind } = describeChatError(error);
      if (kind === "signed-out") {
        router.push("/login");
        return;
      }
      if (kind === "rate-limited") {
        toast.error("Too many chats. Wait a moment and try again.");
        return;
      }
      toast.error("Could not start the chat. Try again.");
    },
  });
  return {
    create: (payload) => mutation.mutateAsync(payload),
    isPending: mutation.isPending,
  };
}
