"use client";

import * as React from "react";
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { toast } from "sonner";

function createQueryClient(): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        // 401 is handled at the feature layer with a redirect. Keep this
        // toast for list and history failures only.
        if (error instanceof Error && error.name === "ChatApiError") {
          const status = (error as { status?: number }).status;
          if (status === 401) return;
        }
        // Auth session checks redirect on 401. Never toast for them.
        if (error instanceof Error && error.name === "AuthApiError") {
          const status = (error as { status?: number }).status;
          if (status === 401) return;
        }
        toast.error("Could not load data. Try again.");
      },
    }),
    mutationCache: new MutationCache({
      onError: (error) => {
        // Feature mutations show their own copy. Log here for correlation.
        // eslint-disable-next-line no-console
        console.error("Mutation failed.", error);
      },
    }),
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false,
        staleTime: 15_000,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

export function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const [client] = React.useState(() => createQueryClient());
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
