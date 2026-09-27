"use client";

import { TriangleAlert } from "lucide-react";
import { formatReminderBanner } from "@/features/chat/services/chat-delete";
import { usePurgeReminders } from "@/features/chat/hooks/use-purge-reminders";

export function PurgeReminderBanner(): React.JSX.Element | null {
  const { data } = usePurgeReminders(true);
  const threads = data?.threads ?? [];
  if (threads.length === 0) return null;
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-[13px] text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100"
    >
      <TriangleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
      <p>{formatReminderBanner(threads)}</p>
    </div>
  );
}
