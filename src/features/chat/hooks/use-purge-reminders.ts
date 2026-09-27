"use client";

import { useQuery } from "@tanstack/react-query";
import { chatKeys } from "@/features/chat/hooks/use-chat-keys";
import { listPurgeReminders } from "@/features/chat/services/chat-delete";

export function usePurgeReminders(enabled = true) {
  return useQuery({
    queryKey: chatKeys.purgeReminders(),
    queryFn: listPurgeReminders,
    enabled,
    staleTime: 60_000,
    retry: false,
  });
}
