"use client";

import { CHAT_MODEL_OPTIONS } from "@/features/chat/services/chat-model";
import type { ChatModel } from "@/features/chat/types/chat";

export interface ModelSelectProps {
  model: ChatModel;
  onChange: (model: ChatModel) => void;
  disabled?: boolean;
}

export function ModelSelect({ model, onChange, disabled = false }: ModelSelectProps): React.JSX.Element {
  return (
    <label className="flex items-center gap-2 text-[13px] text-slate-500 dark:text-slate-400">
      <span>Model</span>
      <select
        aria-label="Model"
        value={model}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value as ChatModel)}
        className="rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-[13px] text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:focus-visible:ring-blue-400"
      >
        {CHAT_MODEL_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
