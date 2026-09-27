"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { logout } from "@/features/auth/services/auth-service";

export function useLogout(): {
  logout: () => Promise<void>;
  isPending: boolean;
  error: unknown;
  reset: () => void;
} {
  const queryClient = useQueryClient();
  const router = useRouter();
  const mutation = useMutation({
    mutationFn: () => logout(),
    onSettled: () => {
      queryClient.removeQueries({ queryKey: ["auth", "me"] });
      queryClient.removeQueries({ queryKey: ["chat"] });
      router.push("/login");
    },
  });
  return {
    logout: () => mutation.mutateAsync().then(() => undefined),
    isPending: mutation.isPending,
    error: mutation.error,
    reset: () => mutation.reset(),
  };
}
