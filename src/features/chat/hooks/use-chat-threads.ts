"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import * as React from "react";
import { chatKeys } from "@/features/chat/hooks/use-chat-keys";
import { listThreads } from "@/features/chat/services/chat-service";
import { describeChatError } from "@/features/chat/services/chat-errors";
import type { ThreadInfo } from "@/features/chat/types/chat";

export function useChatThreads(): {
  threads: ThreadInfo[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
} {
  const router = useRouter();
  const query = useQuery({
    queryKey: chatKeys.threads(),
    queryFn: () => listThreads().then((data) => data.threads),
    staleTime: 15_000,
    retry: false,
  });

  const kind =
    query.isError && query.error !== null
      ? describeChatError(query.error).kind
      : null;

  React.useEffect(() => {
    if (kind === "signed-out") router.push("/login");
  }, [kind, router]);

  return {
    threads: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError && kind !== "signed-out",
    error: query.error,
    refetch: () => {
      void query.refetch();
    },
  };
}
