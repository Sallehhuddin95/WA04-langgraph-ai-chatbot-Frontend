"use client";

import { useQuery } from "@tanstack/react-query";
import { authKeys } from "@/features/auth/hooks/use-auth-keys";
import { fetchMe } from "@/features/auth/services/auth-service";
import { isAuthApiError } from "@/features/auth/services/auth-errors";
import type { AuthUser } from "@/features/auth/types/auth";

export function useMe(): {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: unknown;
  refetch: () => void;
} {
  const query = useQuery({
    queryKey: authKeys.me(),
    queryFn: fetchMe,
    retry: (failureCount, error) => {
      if (isAuthApiError(error) && error.status === 401) return false;
      return failureCount < 1;
    },
    staleTime: 30_000,
  });
  return {
    user: query.data ?? null,
    isLoading: query.isLoading,
    isAuthenticated: query.data !== undefined && !query.isError,
    error: query.error,
    refetch: () => {
      void query.refetch();
    },
  };
}
