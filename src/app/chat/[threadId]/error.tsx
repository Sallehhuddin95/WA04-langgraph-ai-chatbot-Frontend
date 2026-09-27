"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function ChatThreadError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.JSX.Element {
  const router = useRouter();
  return (
    <div role="alert" className="flex flex-col gap-3 py-8">
      <h1 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
        This chat failed to load.
      </h1>
      <p className="text-[15px] text-slate-500 dark:text-slate-400">
        Try again, or go back to the chat list.
      </p>
      <div className="flex gap-2">
        <Button type="button" onClick={() => reset()}>
          Retry
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/chat")}>
          Back to chats
        </Button>
      </div>
    </div>
  );
}
