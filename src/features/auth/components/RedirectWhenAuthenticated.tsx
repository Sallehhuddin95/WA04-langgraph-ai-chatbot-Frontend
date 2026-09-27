"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AuthSkeleton } from "@/features/auth/components/AuthSkeleton";
import { useMe } from "@/features/auth/hooks/use-me";

export function RedirectWhenAuthenticated({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const { isLoading, isAuthenticated } = useMe();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading && isAuthenticated) router.replace("/chat");
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || isAuthenticated) {
    return <AuthSkeleton message="Loading." />;
  }
  return <>{children}</>;
}
