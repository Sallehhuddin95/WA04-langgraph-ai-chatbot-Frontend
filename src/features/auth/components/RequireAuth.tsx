"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AuthSkeleton } from "@/features/auth/components/AuthSkeleton";
import { useMe } from "@/features/auth/hooks/use-me";

export function RequireAuth({ children }: { children: React.ReactNode }): React.JSX.Element {
  const { isLoading, isAuthenticated } = useMe();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login");
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) {
    return <AuthSkeleton message="Loading your chats." />;
  }
  return <>{children}</>;
}
