"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function AuthSkeleton({ message }: { message: string }): React.JSX.Element {
  return (
    <div className="flex flex-col gap-3" aria-label="Loading account">
      <p className="text-[13px] text-slate-500 dark:text-slate-400">{message}</p>
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}
