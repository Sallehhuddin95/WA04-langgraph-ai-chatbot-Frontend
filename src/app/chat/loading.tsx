import { Skeleton } from "@/components/ui/skeleton";

export default function ChatLoading(): React.JSX.Element {
  return (
    <div className="flex flex-col gap-3" aria-label="Loading chat">
      <p className="text-[13px] text-slate-500 dark:text-slate-400">Loading your chats.</p>
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}
