"use client";

import { X } from "lucide-react";
import type { ChatAttachment } from "@/features/chat/types/chat";

export interface AttachmentChipsProps {
  attachments: ChatAttachment[];
  onRemove: (attachmentId: string) => void;
}

export function AttachmentChips({ attachments, onRemove }: AttachmentChipsProps): React.JSX.Element | null {
  if (attachments.length === 0) return null;
  return (
    <ul aria-label="Attached images" className="flex flex-wrap gap-2">
      {attachments.map((item) => (
        <li
          key={item.attachment_id}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2 py-1 text-[13px] text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
        >
          <span className="max-w-[160px] truncate">{item.filename}</span>
          <button
            type="button"
            aria-label={`Remove ${item.filename}`}
            onClick={() => onRemove(item.attachment_id)}
            className="rounded p-0.5 text-slate-500 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-slate-400 dark:hover:text-slate-100 dark:focus-visible:ring-blue-400"
          >
            <X aria-hidden="true" size={14} />
          </button>
        </li>
      ))}
    </ul>
  );
}
