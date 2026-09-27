"use client";

import * as React from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  GripVertical,
  MessageSquarePlus,
  MoreHorizontal,
  Pencil,
  Pin,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { ThreadInfo } from "@/features/chat/types/chat";
import {
  getPinnedThreads,
  getUnpinnedThreads,
  movePinnedThreadOrder,
} from "@/features/chat/services/chat-threads";
import { cn } from "@/lib/utils";

export interface ThreadListProps {
  threads: ThreadInfo[];
  activeThreadId: string | null;
  isLoading: boolean;
  isCreating: boolean;
  onSelect: (threadId: string) => void;
  onNew: () => void;
  onDelete?: (threadId: string) => void;
  deletingThreadId?: string | null;
  onRename?: (threadId: string, title: string) => void | Promise<unknown>;
  renamingThreadId?: string | null;
  onPin?: (threadId: string) => void | Promise<unknown>;
  onUnpin?: (threadId: string) => void | Promise<unknown>;
  pinningThreadId?: string | null;
  onReorderPinned?: (orderedIds: string[]) => void | Promise<unknown>;
  isReordering?: boolean;
}

function menuTriggerClass(isActive: boolean): string {
  return cn(
    "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-opacity",
    "text-slate-400 opacity-60 hover:bg-slate-100 hover:text-slate-900 hover:opacity-100",
    "focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
    "disabled:opacity-50",
    "dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-100 dark:focus-visible:ring-blue-400",
    isActive
      ? "hover:bg-white/20 hover:text-white dark:hover:bg-white/20 dark:hover:text-white"
      : undefined,
    "md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100",
  );
}

function menuItemClass(danger = false): string {
  return cn(
    "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
    "disabled:cursor-not-allowed disabled:opacity-40",
    danger
      ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
      : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800",
  );
}

export function ThreadList({
  threads,
  activeThreadId,
  isLoading,
  isCreating,
  onSelect,
  onNew,
  onDelete,
  deletingThreadId = null,
  onRename,
  renamingThreadId = null,
  onPin,
  onUnpin,
  pinningThreadId = null,
  onReorderPinned,
  isReordering = false,
}: ThreadListProps): React.JSX.Element {
  const [editingThreadId, setEditingThreadId] = React.useState<string | null>(null);
  const [draftTitle, setDraftTitle] = React.useState("");
  const [draggedThreadId, setDraggedThreadId] = React.useState<string | null>(null);
  const [dragOverThreadId, setDragOverThreadId] = React.useState<string | null>(null);
  const [openMenuThreadId, setOpenMenuThreadId] = React.useState<string | null>(null);

  const pinnedThreads = React.useMemo(() => getPinnedThreads(threads), [threads]);
  const unpinnedThreads = React.useMemo(() => getUnpinnedThreads(threads), [threads]);
  const pinnedOrder = React.useMemo(
    () => pinnedThreads.map((thread) => thread.thread_id),
    [pinnedThreads],
  );

  function startEdit(thread: ThreadInfo): void {
    setEditingThreadId(thread.thread_id);
    setDraftTitle(thread.title);
  }

  function cancelEdit(): void {
    setEditingThreadId(null);
    setDraftTitle("");
  }

  function saveEdit(thread: ThreadInfo): void {
    const trimmed = draftTitle.trim();
    if (trimmed.length === 0) return;
    if (trimmed === thread.title) {
      cancelEdit();
      return;
    }
    setEditingThreadId(null);
    setDraftTitle("");
    void onRename?.(thread.thread_id, trimmed);
  }

  function handleMove(threadId: string, direction: -1 | 1): void {
    const from = pinnedOrder.indexOf(threadId);
    if (from < 0) return;
    const to = from + direction;
    if (to < 0 || to >= pinnedOrder.length) return;
    const next = movePinnedThreadOrder(pinnedOrder, from, to);
    void onReorderPinned?.(next);
  }

  function handleDropTarget(targetThreadId: string): void {
    if (draggedThreadId === null) return;
    if (draggedThreadId === targetThreadId) return;
    const from = pinnedOrder.indexOf(draggedThreadId);
    const to = pinnedOrder.indexOf(targetThreadId);
    if (from < 0 || to < 0) return;
    const next = movePinnedThreadOrder(pinnedOrder, from, to);
    setDraggedThreadId(null);
    setDragOverThreadId(null);
    void onReorderPinned?.(next);
  }

  function renderRow(thread: ThreadInfo, options: { isPinned: boolean }): React.JSX.Element {
    const isActive = thread.thread_id === activeThreadId;
    const isDeleting = deletingThreadId === thread.thread_id;
    const isRenaming = renamingThreadId === thread.thread_id;
    const isPinning = pinningThreadId === thread.thread_id;
    const isEditing = editingThreadId === thread.thread_id;
    const pinnedIndex = options.isPinned ? pinnedOrder.indexOf(thread.thread_id) : -1;
    const isFirstPinned = pinnedIndex === 0;
    const isLastPinned = pinnedIndex === pinnedOrder.length - 1;
    const isDragOver = dragOverThreadId === thread.thread_id;

    if (isEditing) {
      const trimmed = draftTitle.trim();
      const canSave = trimmed.length > 0 && !isRenaming;
      return (
        <div
          className={cn(
            "flex flex-col gap-1.5 rounded-2xl border p-2 shadow-sm",
            "border-blue-500/60 bg-white dark:border-blue-400/60 dark:bg-slate-900",
          )}
        >
          <form
            className="flex min-w-0 flex-1 items-center gap-1.5"
            onSubmit={(event) => {
              event.preventDefault();
              saveEdit(thread);
            }}
          >
            <Input
              value={draftTitle}
              onChange={(event) => setDraftTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.preventDefault();
                  cancelEdit();
                }
              }}
              autoFocus
              maxLength={120}
              aria-label={`Rename ${thread.title}`}
              placeholder="Name this chat"
              disabled={isRenaming}
              className="h-9 flex-1 rounded-xl border-slate-200 bg-slate-50 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-800"
            />
            <button
              type="submit"
              disabled={!canSave}
              aria-label="Save title"
              title="Save"
              className={cn(
                "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors",
                "bg-blue-600 text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                "disabled:cursor-not-allowed disabled:opacity-40",
                "dark:bg-blue-500 dark:hover:bg-blue-400",
              )}
            >
              <Check aria-hidden="true" className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              aria-label="Cancel rename"
              title="Cancel (Esc)"
              className={cn(
                "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors",
                "text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                "dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100",
              )}
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          </form>
          <p className="px-1 text-[12px] text-slate-400 dark:text-slate-500">
            Enter to save, Esc to cancel.
          </p>
        </div>
      );
    }

    const menuOpen = openMenuThreadId === thread.thread_id;
    const updatedLabel = new Date(thread.updated_at).toLocaleString();

    function closeMenu(): void {
      setOpenMenuThreadId(null);
    }

    return (
      <div
        className={cn(
          "relative flex items-center gap-0.5 rounded-xl border transition-colors",
          isDragOver ? "ring-2 ring-blue-500 dark:ring-blue-400" : undefined,
          isActive
            ? "border-blue-600 bg-blue-600 text-white dark:border-blue-500 dark:bg-blue-500"
            : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800",
        )}
      >
        {options.isPinned ? (
          <span
            aria-hidden="true"
            title="Drag to reorder"
            className="inline-flex h-8 w-5 shrink-0 cursor-grab items-center justify-center text-slate-400 dark:text-slate-500"
          >
            <GripVertical className="h-4 w-4" />
          </span>
        ) : null}
        <button
          type="button"
          onClick={() => {
            closeMenu();
            onSelect(thread.thread_id);
          }}
          aria-current={isActive ? "true" : undefined}
          title={`${thread.title} - ${updatedLabel}`}
          className="flex min-w-0 flex-1 flex-col gap-0.5 rounded-xl px-2 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400"
        >
          <span title={thread.title} className="block w-full truncate text-sm font-medium">
            {thread.title}
          </span>
          <span
            title={updatedLabel}
            className={cn(
              "block w-full truncate whitespace-nowrap text-[12px]",
              isActive ? "text-white/80" : "text-slate-500 dark:text-slate-400",
            )}
          >
            {updatedLabel}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setOpenMenuThreadId(menuOpen ? null : thread.thread_id)}
          disabled={isDeleting || isRenaming || isPinning}
          aria-label={`Options for ${thread.title}`}
          aria-expanded={menuOpen}
          title="Chat options"
          className={cn(menuTriggerClass(isActive), "mr-1")}
        >
          <MoreHorizontal aria-hidden="true" className="h-4 w-4" />
        </button>
        {menuOpen ? (
          <>
            <button
              type="button"
              aria-hidden="true"
              tabIndex={-1}
              onClick={closeMenu}
              className="fixed inset-0 z-10 cursor-default"
            />
            <div
              role="menu"
              aria-label={`Options for ${thread.title}`}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.preventDefault();
                  closeMenu();
                }
              }}
              className="absolute right-1 top-[calc(100%+4px)] z-20 flex w-48 flex-col gap-0.5 rounded-xl border border-slate-200 bg-white p-1.5 text-slate-900 shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              {onRename !== undefined ? (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    closeMenu();
                    startEdit(thread);
                  }}
                  className={menuItemClass()}
                >
                  <Pencil aria-hidden="true" className="h-4 w-4 shrink-0" /> Rename
                </button>
              ) : null}
              {options.isPinned ? (
                onUnpin !== undefined ? (
                  <button
                    type="button"
                    role="menuitem"
                    disabled={isPinning}
                    onClick={() => {
                      closeMenu();
                      void onUnpin(thread.thread_id);
                    }}
                    className={menuItemClass()}
                  >
                    <Pin aria-hidden="true" className="h-4 w-4 shrink-0" fill="currentColor" /> Unpin
                  </button>
                ) : null
              ) : onPin !== undefined ? (
                <button
                  type="button"
                  role="menuitem"
                  disabled={isPinning}
                  onClick={() => {
                    closeMenu();
                    void onPin(thread.thread_id);
                  }}
                  className={menuItemClass()}
                >
                  <Pin aria-hidden="true" className="h-4 w-4 shrink-0" /> Pin
                </button>
              ) : null}
              {options.isPinned && onReorderPinned !== undefined ? (
                <>
                  <button
                    type="button"
                    role="menuitem"
                    disabled={isFirstPinned || isReordering}
                    onClick={() => {
                      closeMenu();
                      handleMove(thread.thread_id, -1);
                    }}
                    className={menuItemClass()}
                  >
                    <ArrowUp aria-hidden="true" className="h-4 w-4 shrink-0" /> Move up
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    disabled={isLastPinned || isReordering}
                    onClick={() => {
                      closeMenu();
                      handleMove(thread.thread_id, 1);
                    }}
                    className={menuItemClass()}
                  >
                    <ArrowDown aria-hidden="true" className="h-4 w-4 shrink-0" /> Move down
                  </button>
                </>
              ) : null}
              {onDelete !== undefined ? (
                <button
                  type="button"
                  role="menuitem"
                  disabled={isDeleting}
                  onClick={() => {
                    closeMenu();
                    onDelete(thread.thread_id);
                  }}
                  className={menuItemClass(true)}
                >
                  <Trash2 aria-hidden="true" className="h-4 w-4 shrink-0" /> Delete
                </button>
              ) : null}
            </div>
          </>
        ) : null}
      </div>
    );
  }

  return (
    <section aria-label="Chats" className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Chats
        </h2>
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={onNew}
          disabled={isCreating}
          aria-label="Start new chat"
        >
          <MessageSquarePlus aria-hidden="true" /> {isCreating ? "Starting." : "New chat"}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2" aria-label="Loading chats">
          <p className="text-[13px] text-slate-500 dark:text-slate-400">Loading your chats.</p>
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : threads.length === 0 ? (
        <p className="text-[13px] text-slate-500 dark:text-slate-400">
          No chats yet. Start your first chat below.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {pinnedThreads.length > 0 ? (
            <div className="flex flex-col gap-1">
              <h3 className="text-[13px] font-semibold tracking-tight text-slate-500 dark:text-slate-400">
                Pinned
              </h3>
              <ul aria-label="Pinned chats" className="flex flex-col gap-1">
                {pinnedThreads.map((thread) => (
                  <li
                    key={thread.thread_id}
                    className="group"
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.setData("text/plain", thread.thread_id);
                      event.dataTransfer.effectAllowed = "move";
                      setDraggedThreadId(thread.thread_id);
                    }}
                    onDragOver={(event) => {
                      event.preventDefault();
                      event.dataTransfer.dropEffect = "move";
                      if (dragOverThreadId !== thread.thread_id) {
                        setDragOverThreadId(thread.thread_id);
                      }
                    }}
                    onDragLeave={() => {
                      if (dragOverThreadId === thread.thread_id) {
                        setDragOverThreadId(null);
                      }
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      handleDropTarget(thread.thread_id);
                    }}
                    onDragEnd={() => {
                      setDraggedThreadId(null);
                      setDragOverThreadId(null);
                    }}
                  >
                    {renderRow(thread, { isPinned: true })}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {unpinnedThreads.length > 0 ? (
            <div className="flex flex-col gap-1">
              {pinnedThreads.length > 0 ? (
                <h3 className="text-[13px] font-semibold tracking-tight text-slate-500 dark:text-slate-400">
                  Chats
                </h3>
              ) : null}
              <ul
                aria-label={pinnedThreads.length > 0 ? "Unpinned chats" : "Chat threads"}
                className="flex flex-col gap-1"
              >
                {unpinnedThreads.map((thread) => (
                  <li key={thread.thread_id} className="group">
                    {renderRow(thread, { isPinned: false })}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
