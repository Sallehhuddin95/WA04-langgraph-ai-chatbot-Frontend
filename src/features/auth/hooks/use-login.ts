"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authKeys } from "@/features/auth/hooks/use-auth-keys";
import { login } from "@/features/auth/services/auth-service";
import type { AuthUser, LoginPayload } from "@/features/auth/types/auth";

export function useLogin(): {
  login: (payload: LoginPayload) => Promise<AuthUser>;
  isPending: boolean;
  error: unknown;
  reset: () => void;
} {
  const queryClient = useQueryClient();
  const router = useRouter();
  const mutation = useMutation({
    mutationFn: (payload: LoginPayload) => login(payload),
    onSuccess: (user) => {
      queryClient.setQueryData(authKeys.me(), user);
      queryClient.removeQueries({ queryKey: ["chat"] });
      router.push("/chat");
    },
  });
  return {
    login: (payload) => mutation.mutateAsync(payload),
    isPending: mutation.isPending,
    error: mutation.error,
    reset: () => mutation.reset(),
  };
}
