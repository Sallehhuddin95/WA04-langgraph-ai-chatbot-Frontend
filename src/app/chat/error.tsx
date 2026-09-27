"use client";

import { Button } from "@/components/ui/button";

export default function ChatError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.JSX.Element {
  return (
    <div role="alert" className="flex flex-col gap-3 py-8">
      <h1 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
        This chat view failed to load.
      </h1>
      <p className="text-[15px] text-slate-500 dark:text-slate-400">
        Try again. Your other chats are safe.
      </p>
      <div>
        <Button type="button" onClick={() => reset()}>
          Retry
        </Button>
      </div>
    </div>
  );
}
