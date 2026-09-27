"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { PanelLeft, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Composer } from "@/features/chat/components/Composer";
import { ConfirmDialog } from "@/features/chat/components/ConfirmDialog";
import { MessageList } from "@/features/chat/components/MessageList";
import { SessionExpiredNotice } from "@/features/chat/components/ChatMessage";
import type { ChatMessageModel } from "@/features/chat/components/ChatMessage";
import { ThreadList } from "@/features/chat/components/ThreadList";
import { PurgeReminderBanner } from "@/features/chat/components/PurgeReminderBanner";
import { ModelSelect } from "@/features/chat/components/ModelSelect";
import { AttachmentButton } from "@/features/chat/components/AttachmentButton";
import { AttachmentChips } from "@/features/chat/components/AttachmentChips";
import { chatKeys } from "@/features/chat/hooks/use-chat-keys";
import { useChatThreads } from "@/features/chat/hooks/use-chat-threads";
import { useChatTurns } from "@/features/chat/hooks/use-chat-turns";
import { useChatStream } from "@/features/chat/hooks/use-chat-stream";
import { useCreateThread } from "@/features/chat/hooks/use-create-thread";
import { useCreateTurn } from "@/features/chat/hooks/use-create-turn";
import { useDeleteThread } from "@/features/chat/hooks/use-delete-thread";
import { useDeleteTurn } from "@/features/chat/hooks/use-delete-turn";
import { useRenameThread } from "@/features/chat/hooks/use-rename-thread";
import { usePinThread } from "@/features/chat/hooks/use-pin-thread";
import { useReorderPinnedThreads } from "@/features/chat/hooks/use-reorder-pinned-threads";
import { useOnlineStatus } from "@/features/chat/hooks/use-online-status";
import { useChatModel } from "@/features/chat/hooks/use-chat-model";
import {
  describeChatError,
  getChatErrorNotice,
  isInvalidFileError,
} from "@/features/chat/services/chat-errors";
import {
  ATTACH_GATE_NOTICE,
  canAttachWithModel,
  getAttachmentFileError,
} from "@/features/chat/services/chat-model";
import {
  uploadThreadAttachment,
} from "@/features/chat/services/chat-service";
import type {
  ChatAttachment,
  ChatModel,
  TurnItem,
} from "@/features/chat/types/chat";

export interface ChatViewProps {
  threadId: string | null;
}

interface FailedTurn {
  message: string;
  key: string;
  allowRetry: boolean;
  model: ChatModel;
  attachmentIds: string[];
}

interface StagedFile {
  clientId: string;
  file: File;
}

function toMessageModel(item: TurnItem): ChatMessageModel {
  const citations = item.citations ?? [];
  if (item.role === "user") {
    return {
      key: item.turn_id,
      role: "user",
      text: item.text,
      status: "settled",
      citations: [],
      isGrounded: null,
      createdAt: item.created_at,
    };
  }
  return {
    key: item.turn_id,
    role: "assistant",
    text: item.text,
    status: "settled",
    citations: [...citations],
    isGrounded: item.is_grounded ?? null,
    intentCategory: item.intent_category ?? null,
    turnId: item.turn_id,
    createdAt: item.created_at,
  };
}

function newClientId(): string {
  try {
    const c = globalThis.crypto;
    if (typeof c?.randomUUID === "function") return c.randomUUID();
    if (typeof c?.getRandomValues === "function") {
      const bytes = c.getRandomValues(new Uint32Array(1));
      const first = bytes[0] ?? 0;
      return `staged-${Date.now()}-${first}`;
    }
  } catch {
    // Crypto blocked. Use timestamp fallback below.
  }
  return `staged-${Date.now()}-0`;
}

export function ChatView({ threadId }: ChatViewProps): React.JSX.Element {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();
  const { model, setModel } = useChatModel();

  const [createdThreadId, setCreatedThreadId] = React.useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [isSending, setIsSending] = React.useState(false);
  const [pendingUser, setPendingUser] = React.useState<{ text: string; key: string } | null>(null);
  const [failedTurn, setFailedTurn] = React.useState<FailedTurn | null>(null);
  const [sessionExpired, setSessionExpired] = React.useState(false);
  const [forbidden, setForbidden] = React.useState(false);
  const [serverValidation, setServerValidation] = React.useState<string | null>(null);
  const [restoredDraft, setRestoredDraft] = React.useState<string | null>(null);
  const [conflictRetried, setConflictRetried] = React.useState(false);
  const [attachments, setAttachments] = React.useState<ChatAttachment[]>([]);
  const [stagedFiles, setStagedFiles] = React.useState<StagedFile[]>([]);
  const [isUploading, setIsUploading] = React.useState(false);
  const [attachNotice, setAttachNotice] = React.useState<string | null>(null);
  const [threadDeleteId, setThreadDeleteId] = React.useState<string | null>(null);
  const [turnDeleteId, setTurnDeleteId] = React.useState<string | null>(null);
  const signInRef = React.useRef<HTMLAnchorElement | null>(null);

  const SIDEBAR_MIN_WIDTH = 240;
  const SIDEBAR_MAX_WIDTH = 480;
  const SIDEBAR_DEFAULT_WIDTH = 280;
  const SIDEBAR_STORAGE_KEY = "singularity-sidebar-width";
  const [sidebarWidth, setSidebarWidth] = React.useState(SIDEBAR_DEFAULT_WIDTH);
  const sidebarDrag = React.useRef<{ startX: number; startWidth: number } | null>(null);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (raw !== null) {
        const saved = Number.parseInt(raw, 10);
        if (!Number.isNaN(saved)) {
          setSidebarWidth(Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, saved)));
        }
      }
    } catch {
      // Private mode. Keep the default width.
    }
  }, []);

  function handleSidebarResizeMove(event: MouseEvent): void {
    const drag = sidebarDrag.current;
    if (drag === null) return;
    const next = drag.startWidth + (event.clientX - drag.startX);
    const clamped = Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, next));
    setSidebarWidth(clamped);
    try {
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(Math.round(clamped)));
    } catch {
      // Private mode. Width still applies for this session.
    }
  }

  function stopSidebarResize(): void {
    if (sidebarDrag.current === null) return;
    sidebarDrag.current = null;
    window.removeEventListener("mousemove", handleSidebarResizeMove);
    window.removeEventListener("mouseup", stopSidebarResize);
  }

  function startSidebarResize(event: React.MouseEvent<HTMLDivElement>): void {
    event.preventDefault();
    sidebarDrag.current = { startX: event.clientX, startWidth: sidebarWidth };
    window.addEventListener("mousemove", handleSidebarResizeMove);
    window.addEventListener("mouseup", stopSidebarResize);
  }

  const effectiveThreadId = threadId ?? createdThreadId;

  const threadsQuery = useChatThreads();
  const turnsQuery = useChatTurns(effectiveThreadId);
  const createThread = useCreateThread();
  const createTurn = useCreateTurn(effectiveThreadId ?? "");
  const deleteThreadFlow = useDeleteThread(effectiveThreadId);
  const deleteTurnFlow = useDeleteTurn(effectiveThreadId);
  const renameThreadFlow = useRenameThread();
  const pinThreadFlow = usePinThread();
  const reorderPinnedFlow = useReorderPinnedThreads();
  const stream = useChatStream();

  const isStreaming = stream.status === "streaming";
  const isBusy = isSending || isStreaming || createThread.isPending || isUploading;
  const canAttach = canAttachWithModel(model);

  React.useEffect(() => {
    if (sessionExpired) signInRef.current?.focus();
  }, [sessionExpired]);

  React.useEffect(() => {
    setAttachments([]);
    setStagedFiles([]);
    setAttachNotice(null);
  }, [effectiveThreadId]);

  // Merge the streamed reply into history once the refetch carries it.
  React.useEffect(() => {
    if (stream.turnId === null) return;
    if (stream.status !== "done" && stream.status !== "error") return;
    const found = turnsQuery.items.some((item) => item.turn_id === stream.turnId);
    if (found) {
      stream.reset();
      setPendingUser(null);
    }
  }, [stream, turnsQuery.items]);

  function handleNewThread(): void {
    setSidebarOpen(false);
    router.push("/chat");
  }

  function handleSelectThread(id: string): void {
    setSidebarOpen(false);
    stream.stop();
    setPendingUser(null);
    setFailedTurn(null);
    setSessionExpired(false);
    setForbidden(false);
    setServerValidation(null);
    setAttachNotice(null);
    if (id === effectiveThreadId) return;
    router.push(`/chat/${id}`);
  }

  function handleAttachBlocked(): void {
    setAttachNotice(ATTACH_GATE_NOTICE);
  }

  async function handlePickFile(file: File): Promise<void> {
    const fileError = getAttachmentFileError({ type: file.type, size: file.size });
    if (fileError !== null) {
      setAttachNotice(fileError);
      return;
    }
    if (!canAttachWithModel(model)) {
      setAttachNotice(ATTACH_GATE_NOTICE);
      return;
    }
    if (effectiveThreadId === null) {
      setStagedFiles((current) => [...current, { clientId: newClientId(), file }]);
      setAttachNotice(null);
      return;
    }
    setIsUploading(true);
    setAttachNotice(null);
    try {
      const uploaded = await uploadThreadAttachment(effectiveThreadId, file);
      setAttachments((current) => [
        ...current,
        {
          attachment_id: uploaded.attachment_id,
          filename: uploaded.filename,
          mime: uploaded.mime,
        },
      ]);
    } catch (error) {
      const { kind } = describeChatError(error);
      if (kind === "signed-out") {
        setSessionExpired(true);
        return;
      }
      if (kind === "forbidden") {
        setForbidden(true);
        return;
      }
      if (isInvalidFileError(error)) {
        setAttachNotice(getChatErrorNotice(error));
        return;
      }
      setAttachNotice(getChatErrorNotice(error));
    } finally {
      setIsUploading(false);
    }
  }

  function handleRemoveAttachment(attachmentId: string): void {
    setAttachments((current) => current.filter((item) => item.attachment_id !== attachmentId));
    setStagedFiles((current) => current.filter((item) => item.clientId !== attachmentId));
  }

  async function uploadStagedFiles(threadIdForUpload: string, staged: StagedFile[]): Promise<string[]> {
    const ids: string[] = [];
    for (const stagedItem of staged) {
      const uploaded = await uploadThreadAttachment(threadIdForUpload, stagedItem.file);
      ids.push(uploaded.attachment_id);
      setAttachments((current) => [
        ...current,
        {
          attachment_id: uploaded.attachment_id,
          filename: uploaded.filename,
          mime: uploaded.mime,
        },
      ]);
    }
    return ids;
  }

  async function sendTurn(
    id: string,
    message: string,
    key: string,
    sendModel: ChatModel,
    sendAttachmentIds: string[],
  ): Promise<void> {
    setIsSending(true);
    setPendingUser({ text: message, key });
    setFailedTurn(null);
    setServerValidation(null);
    try {
      const response = await createTurn.send({
        thread_id: id,
        message,
        model: sendModel,
        attachment_ids: sendAttachmentIds,
      });
      setSessionExpired(false);
      setForbidden(false);
      setConflictRetried(false);
      setAttachments([]);
      setStagedFiles([]);
      setAttachNotice(null);
      await stream.start({ threadId: id, turnId: response.turn_id });
      void queryClient.invalidateQueries({ queryKey: chatKeys.turns(id) });
    } catch (error) {
      const { kind } = describeChatError(error);
      if (kind === "signed-out") {
        setSessionExpired(true);
        setRestoredDraft(message);
        setPendingUser(null);
        return;
      }
      if (kind === "forbidden") {
        setForbidden(true);
        setPendingUser(null);
        return;
      }
      if (kind === "validation") {
        setServerValidation(getChatErrorNotice(error));
        setRestoredDraft(message);
        setPendingUser(null);
        return;
      }
      if (kind === "conflict") {
        void queryClient.invalidateQueries({ queryKey: chatKeys.turns(id) });
        setFailedTurn({ message, key, allowRetry: !conflictRetried, model: sendModel, attachmentIds: sendAttachmentIds });
        setConflictRetried(true);
        setPendingUser(null);
        return;
      }
      // Rate-limited, server, offline, and unknown keep an inline retry.
      // Toasts for these cases fire in the mutation handler.
      setFailedTurn({ message, key, allowRetry: true, model: sendModel, attachmentIds: sendAttachmentIds });
      setPendingUser(null);
    } finally {
      setIsSending(false);
    }
  }

  async function handleSend(message: string): Promise<void> {
    if (!isOnline) {
      toast.error("You are offline. Check your connection and try again.");
      return;
    }
    if (isBusy) {
      toast.error("Still working on the last message. Wait a moment.");
      return;
    }
    const key = `pending-${Date.now()}`;
    if (effectiveThreadId !== null) {
      let stagedIds: string[] = [];
      if (stagedFiles.length > 0) {
        setIsUploading(true);
        try {
          stagedIds = await uploadStagedFiles(effectiveThreadId, stagedFiles);
          setStagedFiles([]);
        } catch (error) {
          setAttachNotice(getChatErrorNotice(error));
          setIsUploading(false);
          return;
        }
        setIsUploading(false);
      }
      const ids = [...attachments.map((item) => item.attachment_id), ...stagedIds];
      await sendTurn(effectiveThreadId, message, key, model, ids);
      return;
    }
    // First message on /chat: create the thread, then send in place.
    setIsSending(true);
    try {
      const created = await createThread.create({
        title: message.slice(0, 60),
      });
      setCreatedThreadId(created.thread_id);
      let stagedIds: string[] = [];
      if (stagedFiles.length > 0) {
        setIsUploading(true);
        try {
          stagedIds = await uploadStagedFiles(created.thread_id, stagedFiles);
        } catch (error) {
          setAttachNotice(getChatErrorNotice(error));
          setIsUploading(false);
          router.push(`/chat/${created.thread_id}`);
          setIsSending(false);
          return;
        }
        setIsUploading(false);
      }
      const ids = [...attachments.map((item) => item.attachment_id), ...stagedIds];
      setIsSending(false);
      await sendTurn(created.thread_id, message, key, model, ids);
      router.push(`/chat/${created.thread_id}`);
    } catch {
      // Create-thread toasts already fired in the hook. Keep composer usable.
      setPendingUser(null);
    } finally {
      setIsSending(false);
      setIsUploading(false);
    }
  }

  function handleStop(): void {
    stream.stop();
  }

  async function handleRetry(key: string): Promise<void> {
    if (key === "stream-failed" || key === stream.turnId) {
      await stream.retry();
      return;
    }
    if (failedTurn !== null && failedTurn.key === key && effectiveThreadId !== null) {
      await sendTurn(effectiveThreadId, failedTurn.message, `pending-${Date.now()}`, failedTurn.model, failedTurn.attachmentIds);
    }
  }

  const messages: ChatMessageModel[] = React.useMemo(() => {
    // The live stream owns its turn id until reset. Skipping the server
    // twin here makes duplicate React keys impossible, so a streamed
    // reply can never be dropped or duplicated during the merge frame.
    const ownedTurnId =
      stream.status === "idle" || stream.turnId === null ? null : stream.turnId;
    const models = turnsQuery.items
      .filter((item) => item.turn_id !== ownedTurnId)
      .map(toMessageModel);
    if (pendingUser !== null) {
      models.push({
        key: pendingUser.key,
        role: "user",
        text: pendingUser.text,
        status: "settled",
        citations: [],
        isGrounded: null,
      });
      if (stream.status === "idle" && failedTurn === null) {
        models.push({
          key: `${pendingUser.key}-thinking`,
          role: "assistant",
          text: "",
          status: "streaming",
          citations: [],
          isGrounded: null,
        });
      }
    }
    if (stream.status === "streaming" || stream.status === "done") {
      models.push({
        key: stream.turnId ?? "streaming",
        role: "assistant",
        text: stream.text,
        status: stream.status === "done" ? "settled" : "streaming",
        citations: stream.citations,
        isGrounded: stream.isGrounded,
        intentCategory: stream.intentCategory,
        turnId: stream.turnId ?? undefined,
      });
    } else if (stream.status === "stopped") {
      models.push({
        key: stream.turnId ?? "stopped",
        role: "assistant",
        text: stream.text,
        status: "stopped",
        citations: stream.citations,
        isGrounded: stream.isGrounded,
        intentCategory: stream.intentCategory,
        turnId: stream.turnId ?? undefined,
      });
    } else if (stream.status === "error") {
      models.push({
        key: "stream-failed",
        role: "assistant",
        text: stream.text,
        status: "failed",
        citations: stream.citations,
        isGrounded: stream.isGrounded,
        intentCategory: stream.intentCategory,
        turnId: stream.turnId ?? undefined,
      });
    }
    if (failedTurn !== null) {
      models.push({
        key: failedTurn.key,
        role: "assistant",
        text: "",
        status: "failed",
        citations: [],
        isGrounded: null,
      });
    }
    return models;
  }, [turnsQuery.items, pendingUser, stream, failedTurn]);

  const turnsErrorKind =
    turnsQuery.isError && effectiveThreadId !== null ? describeChatError(turnsQuery.error).kind : null;

  function renderTurnsPane(): React.JSX.Element {
    if (effectiveThreadId === null) {
      return (
        <MessageList
          messages={[]}
          isLoading={false}
          hasThread={false}
          retryKey={null}
          isRetrying={false}
          onRetry={handleRetry}
        />
      );
    }
    if (turnsErrorKind === "signed-out") {
      return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-2 px-4 py-8">
          <SessionExpiredNotice />
        </div>
      );
    }
    if (turnsErrorKind === "forbidden" || forbidden) {
      return (
        <div role="alert" className="mx-auto flex w-full max-w-3xl flex-col gap-2 px-4 py-8">
          <p className="text-[15px] text-slate-900 dark:text-slate-100">
            You do not have access to this chat.
          </p>
          <div>
            <Button variant="outline" size="sm" type="button" onClick={() => router.push("/chat")}>
              Back to chats
            </Button>
          </div>
        </div>
      );
    }
    if (turnsErrorKind === "not-found") {
      return (
        <div role="alert" className="mx-auto flex w-full max-w-3xl flex-col gap-2 px-4 py-8">
          <p className="text-[15px] text-slate-900 dark:text-slate-100">
            This chat was not found. Pick another chat or start a new one.
          </p>
          <div>
            <Button variant="outline" size="sm" type="button" onClick={() => router.push("/chat")}>
              Open chat list
            </Button>
          </div>
        </div>
      );
    }
    if (turnsQuery.isError) {
      return (
        <div role="alert" className="mx-auto flex w-full max-w-3xl flex-col gap-2 px-4 py-8">
          <p className="text-[15px] text-slate-900 dark:text-slate-100">
            Could not load messages. Try again.
          </p>
            <div>
              <Button variant="outline" size="sm" type="button" onClick={() => turnsQuery.refetch()}>
                <RotateCcw aria-hidden="true" /> Retry
              </Button>
            </div>
        </div>
      );
    }
    return (
      <MessageList
        messages={messages}
        isLoading={turnsQuery.isLoading}
        hasThread
        retryKey={failedTurn?.key ?? (stream.status === "error" ? "stream-failed" : null)}
        isRetrying={isSending}
        onRetry={handleRetry}
        hasMore={turnsQuery.hasMore}
        isFetchingMore={turnsQuery.isFetchingMore}
        onLoadMore={turnsQuery.loadMore}
        onDeleteMessage={(turnId) => setTurnDeleteId(turnId)}
        deletingTurnId={deleteTurnFlow.deletingTurnId}
      />
    );
  }

  const combinedChips: ChatAttachment[] = React.useMemo(() => {
    const stagedAsChips: ChatAttachment[] = stagedFiles.map((staged) => ({
      attachment_id: staged.clientId,
      filename: staged.file.name,
      mime: staged.file.type,
    }));
    return [...attachments, ...stagedAsChips];
  }, [attachments, stagedFiles]);

  return (
    <div className="flex h-[calc(100dvh-3.5rem-2.5rem)] min-h-0 flex-1 bg-slate-50 dark:bg-slate-950">
      {sidebarOpen ? (
        <button
          type="button"
          aria-label="Close chat list"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-20 bg-slate-900/40 md:hidden"
        />
      ) : null}

      <aside
        style={{ width: sidebarWidth }}
        className={`${sidebarOpen ? "flex" : "hidden"} fixed bottom-0 left-0 top-14 z-30 w-[280px] shrink-0 flex-col border-r border-slate-300 bg-slate-200 md:bottom-auto md:relative md:top-auto md:z-auto md:flex dark:border-slate-800 dark:bg-black`}
        aria-label="Thread list"
      >
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize chat list"
          title="Drag to resize (240-480px). Double-click to reset."
          onMouseDown={startSidebarResize}
          onDoubleClick={() => setSidebarWidth(SIDEBAR_DEFAULT_WIDTH)}
          className="absolute -right-1.5 top-0 z-40 hidden h-full w-3 cursor-col-resize items-center justify-center md:flex"
        >
          <span
            aria-hidden="true"
            className="h-10 w-1 rounded-full bg-slate-300 opacity-0 transition-opacity hover:opacity-100 dark:bg-slate-700"
          />
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overflow-x-hidden p-4">
          <PurgeReminderBanner />
          <ThreadList
            threads={threadsQuery.threads}
            activeThreadId={effectiveThreadId}
            isLoading={threadsQuery.isLoading}
            isCreating={createThread.isPending}
            onSelect={handleSelectThread}
            onNew={handleNewThread}
            onDelete={(id) => setThreadDeleteId(id)}
            deletingThreadId={deleteThreadFlow.deletingThreadId}
            onRename={(id, title) => {
              void renameThreadFlow.renameThread(id, title);
            }}
            renamingThreadId={renameThreadFlow.renamingThreadId}
            onPin={(id) => {
              void pinThreadFlow.pinThread(id);
            }}
            onUnpin={(id) => {
              void pinThreadFlow.unpinThread(id);
            }}
            pinningThreadId={pinThreadFlow.pinningThreadId}
            onReorderPinned={(ids) => {
              void reorderPinnedFlow.reorder(ids);
            }}
            isReordering={reorderPinnedFlow.isReordering}
          />
          {threadsQuery.isError ? (
            <div role="alert" className="mt-2 flex flex-col gap-2">
              <p className="text-[13px] text-slate-500 dark:text-slate-400">
                Could not load chats. Try again.
              </p>
              <div>
                <Button variant="outline" size="sm" type="button" onClick={() => threadsQuery.refetch()}>
                  <RotateCcw aria-hidden="true" /> Retry
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="border-b border-slate-200 px-4 py-2 md:hidden dark:border-slate-800">
          <Button
            variant="outline"
            size="sm"
            type="button"
            aria-expanded={sidebarOpen}
            onClick={() => setSidebarOpen((open) => !open)}
          >
            <PanelLeft aria-hidden="true" /> Chats
          </Button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          {sessionExpired ? (
            <div role="alert" className="mx-auto flex w-full max-w-3xl flex-col gap-2 px-4 pt-1">
              <p className="text-[13px] text-slate-900 dark:text-slate-100">
                Your session expired. Sign in again to keep chatting.
              </p>
              <div>
                <Button asChild size="sm" type="button">
                  <Link ref={signInRef} href="/login">
                    Sign in
                  </Link>
                </Button>
              </div>
            </div>
          ) : null}

          {renderTurnsPane()}

          <div className="relative z-10 -mt-8 flex shrink-0 flex-col bg-gradient-to-b from-transparent via-slate-50/80 to-slate-50 px-4 pb-2 pt-8 dark:via-slate-950/80 dark:to-slate-950">
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <ModelSelect model={model} onChange={setModel} disabled={isBusy} />
                <AttachmentButton
                  canAttach={canAttach}
                  isUploading={isUploading}
                  onPick={(file) => {
                    void handlePickFile(file);
                  }}
                  onBlocked={handleAttachBlocked}
                />
              </div>
              <AttachmentChips attachments={combinedChips} onRemove={handleRemoveAttachment} />
              {attachNotice !== null ? (
                <p role="alert" className="text-[13px] text-slate-900 dark:text-slate-100">
                  {attachNotice}
                </p>
              ) : null}
              <Composer
                isBusy={isBusy}
                isStreaming={isStreaming}
                isOnline={isOnline}
                restoredDraft={restoredDraft}
                serverError={serverValidation}
                onSend={(message) => {
                  void handleSend(message);
                }}
                onStop={handleStop}
                onRestored={() => setRestoredDraft(null)}
              />
            </div>
          </div>
        </div>
      </div>
      <ConfirmDialog
        open={threadDeleteId !== null}
        title="Delete this chat?"
        description="This removes the chat and its messages. You can undo for 10 seconds. Deleted chats are permanently removed after 30 days, with a reminder 3 days before."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isConfirming={deleteThreadFlow.isDeleting}
        onCancel={() => {
          if (!deleteThreadFlow.isDeleting) setThreadDeleteId(null);
        }}
        onConfirm={() => {
          const id = threadDeleteId;
          if (id === null) return;
          void (async () => {
            await deleteThreadFlow.deleteThread(id);
            setThreadDeleteId(null);
          })();
        }}
      />
      <ConfirmDialog
        open={turnDeleteId !== null}
        title="Delete this message?"
        description="This removes the message. You can undo for 10 seconds."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isConfirming={deleteTurnFlow.isDeleting}
        onCancel={() => {
          if (!deleteTurnFlow.isDeleting) setTurnDeleteId(null);
        }}
        onConfirm={() => {
          const id = turnDeleteId;
          if (id === null) return;
          void (async () => {
            await deleteTurnFlow.deleteTurn(id);
            setTurnDeleteId(null);
          })();
        }}
      />
    </div>
  );
}
