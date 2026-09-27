import * as React from "react";
import Link from "next/link";
import { Check, Copy, RotateCcw, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CitationList } from "@/features/chat/components/CitationList";
import { FormattedMessageText } from "@/features/chat/components/FormattedMessageText";
import type { ChatCitation, IntentCategory } from "@/features/chat/types/chat";
import { cn } from "@/lib/utils";

export type ChatMessageStatus = "settled" | "streaming" | "stopped" | "failed";

export interface ChatMessageModel {
  key: string;
  role: "user" | "assistant";
  text: string;
  status: ChatMessageStatus;
  citations: ChatCitation[];
  isGrounded: boolean | null;
  intentCategory?: IntentCategory | null;
  turnId?: string;
  createdAt?: string;
}

export interface ChatMessageProps {
  message: ChatMessageModel;
  onRetry?: () => void;
  isRetrying?: boolean;
  onDelete?: () => void;
  isDeleting?: boolean;
}

export async function copyMessageText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "absolute";
      area.style.left = "-9999px";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(area);
      return ok;
    } catch {
      return false;
    }
  }
}

function CopyMessageButton({ text, label }: { text: string; label: string }): React.JSX.Element {
  const [copied, setCopied] = React.useState(false);
  const timer = React.useRef<number | null>(null);

  React.useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, []);

  async function handleCopy(): Promise<void> {
    const ok = await copyMessageText(text);
    if (!ok) return;
    setCopied(true);
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={() => {
        void handleCopy();
      }}
      aria-label={copied ? "Copied" : label}
      title={copied ? "Copied" : "Copy"}
      className={cn(
        "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-opacity",
        "text-slate-400 opacity-60 hover:bg-slate-100 hover:text-slate-900 hover:opacity-100",
        "focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
        "dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-100 dark:focus-visible:ring-blue-400",
        "md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100",
      )}
    >
      {copied ? (
        <Check aria-hidden="true" className="h-4 w-4 text-green-600 dark:text-green-400" />
      ) : (
        <Copy aria-hidden="true" className="h-4 w-4" />
      )}
    </button>
  );
}

function DeleteMessageButton({
  label,
  onDelete,
  isDeleting = false,
}: {
  label: string;
  onDelete: () => void;
  isDeleting?: boolean;
}): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={isDeleting}
      aria-label={label}
      className={cn(
        "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-opacity",
        "text-slate-400 opacity-60 hover:bg-slate-100 hover:text-slate-900 hover:opacity-100",
        "focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
        "disabled:opacity-50",
        "dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-100 dark:focus-visible:ring-blue-400",
        "md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100",
      )}
    >
      <Trash2 aria-hidden="true" className="h-4 w-4" />
    </button>
  );
}

function MarkerLinks({ turnId, count }: { turnId: string; count: number }): React.JSX.Element | null {
  if (count === 0) return null;
  return (
    <span className="ml-1 inline-flex gap-1 align-super text-xs">
      {Array.from({ length: count }, (_, index) => (
        <a
          key={index}
          href={`#cite-${turnId}-${index + 1}`}
          className="text-blue-600 underline-offset-2 hover:underline dark:text-blue-400"
          aria-label={`Go to source ${index + 1}`}
        >
          [{index + 1}]
        </a>
      ))}
    </span>
  );
}

export function TypingIndicator({ label = "Writing reply" }: { label?: string }): React.JSX.Element {
  return (
    <span
      role="status"
      aria-label={`${label}...`}
      className="inline-flex animate-pulse items-center gap-2 text-slate-500 dark:text-slate-400"
    >
      <span className="inline-flex items-center gap-1" aria-hidden="true">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current opacity-70 [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current opacity-70 [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current opacity-70 [animation-delay:300ms]" />
      </span>
      <span className="text-[13px]">{label}</span>
    </span>
  );
}

export function ChatMessage({ message, onRetry, isRetrying = false, onDelete, isDeleting = false }: ChatMessageProps): React.JSX.Element {
  if (message.role === "user") {
    return (
      <div className="group flex justify-end gap-2">
        <div className="flex items-start gap-0.5 pt-2">
          <CopyMessageButton text={message.text} label="Copy question" />
          {onDelete !== undefined ? (
            <DeleteMessageButton label="Delete message" onDelete={onDelete} isDeleting={isDeleting} />
          ) : null}
        </div>
        <div className="max-w-[85%] rounded-xl bg-blue-50 px-4 py-3 text-[15px] leading-relaxed text-slate-900 dark:bg-slate-800 dark:text-slate-100">
          <FormattedMessageText text={message.text} />
        </div>
        <Avatar aria-hidden="true">
          <AvatarFallback>You</AvatarFallback>
        </Avatar>
      </div>
    );
  }

  const turnId = message.turnId ?? message.key;

  return (
    <div className="group flex gap-2">
      <Avatar aria-hidden="true">
        <AvatarFallback>S</AvatarFallback>
      </Avatar>
      <Card className="max-w-[85%] flex-1">
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">
              Singularity
            </p>
            <div className="flex items-center gap-0.5">
              {message.text.length > 0 ? (
                <CopyMessageButton text={message.text} label="Copy answer" />
              ) : null}
              {onDelete !== undefined ? (
                <DeleteMessageButton label="Delete message" onDelete={onDelete} isDeleting={isDeleting} />
              ) : null}
            </div>
          </div>
          <div aria-live={message.status === "streaming" ? "polite" : undefined}>
            {message.text.length > 0 ? (
              <div className="text-[15px] leading-relaxed text-slate-900 dark:text-slate-100">
                <FormattedMessageText text={message.text} />
                <MarkerLinks turnId={turnId} count={message.citations.length} />
              </div>
            ) : message.status === "streaming" ? (
              <TypingIndicator label="Writing reply" />
            ) : null}
          </div>

          {message.status === "streaming" && message.text.length > 0 ? (
            <TypingIndicator label="Streaming" />
          ) : null}

          {message.status === "stopped" ? (
            <div role="alert" className="flex flex-col gap-2">
              <p className="text-[13px] text-slate-500 dark:text-slate-400">
                Reply stopped. You can retry or ask a new question.
              </p>
              {onRetry !== undefined ? (
                <div>
                  <Button variant="outline" size="sm" type="button" onClick={onRetry} disabled={isRetrying}>
                    <RotateCcw aria-hidden="true" /> {isRetrying ? "Retrying." : "Retry this turn"}
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}

          {message.status === "failed" ? (
            <div role="alert" className="flex flex-col gap-2">
              <p className="text-[13px] text-slate-900 dark:text-slate-100">
                This reply failed to load. Retry this turn.
              </p>
              {onRetry !== undefined ? (
                <div>
                  <Button variant="outline" size="sm" type="button" onClick={onRetry} disabled={isRetrying}>
                    <RotateCcw aria-hidden="true" /> {isRetrying ? "Retrying." : "Retry this turn"}
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}

          {message.status === "settled" || message.status === "stopped" ? (
            <div className="flex flex-col gap-2">
              {message.isGrounded === false ? (
                <p role="note" className="text-[13px] text-slate-500 dark:text-slate-400">
                  This reply has no supporting sources. Check the answer before you use it.
                </p>
              ) : (
                <CitationList citations={message.citations} turnId={turnId} />
              )}
              {message.createdAt !== undefined ? (
                <p className="text-[13px] text-slate-500 dark:text-slate-400">
                  {new Date(message.createdAt).toLocaleString()}
                </p>
              ) : null}
            </div>
          ) : null}

          {message.status === "streaming" && message.citations.length > 0 ? (
            <CitationList citations={message.citations} turnId={turnId} />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

export function FailedTurnNotice({ onRetry }: { onRetry?: () => void }): React.JSX.Element {
  return (
    <div role="alert" className={cn("flex flex-col gap-2")}>
      <p className="text-[13px] text-slate-900 dark:text-slate-100">
        This reply failed to load. Retry this turn.
      </p>
      {onRetry !== undefined ? (
        <div>
          <Button variant="outline" size="sm" type="button" onClick={onRetry}>
            <RotateCcw aria-hidden="true" /> Retry this turn
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function SessionExpiredNotice(): React.JSX.Element {
  return (
    <div role="alert" className="flex flex-col gap-2">
      <p className="text-[13px] text-slate-900 dark:text-slate-100">
        Your session expired. Sign in again to keep chatting.
      </p>
      <div>
        <Button asChild size="sm" type="button">
          <Link href="/login">Sign in</Link>
        </Button>
      </div>
    </div>
  );
}
