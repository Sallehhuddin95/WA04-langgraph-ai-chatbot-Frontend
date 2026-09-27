"use client";

import * as React from "react";
import { Send, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export interface ComposerProps {
  isBusy: boolean;
  isStreaming: boolean;
  isOnline: boolean;
  restoredDraft?: string | null;
  serverError?: string | null;
  onSend: (message: string) => void;
  onStop: () => void;
  onRestored?: () => void;
}

export function Composer({
  isBusy,
  isStreaming,
  isOnline,
  restoredDraft = null,
  serverError = null,
  onSend,
  onStop,
  onRestored,
}: ComposerProps): React.JSX.Element {
  const [draft, setDraft] = React.useState("");
  const [fieldError, setFieldError] = React.useState<string | null>(null);
  const areaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const MAX_COMPOSER_HEIGHT = 200;

  React.useEffect(() => {
    if (restoredDraft !== null && restoredDraft.length > 0) {
      setDraft(restoredDraft);
      onRestored?.();
    }
  }, [restoredDraft, onRestored]);

  React.useEffect(() => {
    const node = areaRef.current;
    if (node === null) return;
    node.style.height = "auto";
    node.style.height = `${Math.min(node.scrollHeight, MAX_COMPOSER_HEIGHT)}px`;
    node.style.overflowY = node.scrollHeight > MAX_COMPOSER_HEIGHT ? "auto" : "hidden";
  }, [draft]);

  function handleChange(event: React.ChangeEvent<HTMLTextAreaElement>): void {
    setDraft(event.target.value);
    if (fieldError !== null) setFieldError(null);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const trimmed = draft.trim();
    if (trimmed.length === 0) {
      setFieldError("Type a message before sending.");
      return;
    }
    if (trimmed.length > 4000) {
      setFieldError("Keep your message under 4000 characters.");
      return;
    }
    if (!isOnline || isBusy) return;
    setFieldError(null);
    setDraft("");
    onSend(trimmed);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>): void {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  const isDisabled = isBusy || !isOnline;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      {!isOnline ? (
        <p role="alert" className="text-[13px] text-slate-500 dark:text-slate-400">
          You are offline. Check your connection and try again.
        </p>
      ) : null}
      <div className="relative">
        <Textarea
          ref={areaRef}
          aria-label="Message input"
          placeholder="Type a message. Shift + Enter for a new line."
          value={draft}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={isDisabled}
          rows={3}
          maxLength={4001}
          className="resize-none overflow-y-auto pr-12"
        />
        {isStreaming ? (
          <Button
            type="button"
            variant="secondary"
            size="icon"
            onClick={onStop}
            aria-label="Stop"
            title="Stop"
            className="absolute bottom-2 right-2 rounded-full"
          >
            <Square aria-hidden="true" />
          </Button>
        ) : (
          <Button
            type="submit"
            size="icon"
            disabled={isDisabled || draft.trim().length === 0}
            aria-label="Send"
            title="Send"
            className="absolute bottom-2 right-2 rounded-full"
          >
            <Send aria-hidden="true" />
          </Button>
        )}
      </div>
      <p className="text-[12px] text-slate-400 dark:text-slate-500">
        Enter to send, Shift + Enter for a new line.
      </p>
      {fieldError !== null ? (
        <p role="alert" className="text-[13px] text-slate-900 dark:text-slate-100">
          {fieldError}
        </p>
      ) : null}
      {serverError !== null ? (
        <p role="alert" className="text-[13px] text-slate-900 dark:text-slate-100">
          {serverError}
        </p>
      ) : null}
    </form>
  );
}
