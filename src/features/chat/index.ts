// Public API for the chat feature. Routes import from here, not from internals.

export { ChatView } from "@/features/chat/components/ChatView";
export { PurgeReminderBanner } from "@/features/chat/components/PurgeReminderBanner";
export { ThreadList } from "@/features/chat/components/ThreadList";
export { Composer } from "@/features/chat/components/Composer";
export { ConfirmDialog } from "@/features/chat/components/ConfirmDialog";
export { MessageList } from "@/features/chat/components/MessageList";
export { CitationList } from "@/features/chat/components/CitationList";
export { ChatMessage, SessionExpiredNotice, TypingIndicator } from "@/features/chat/components/ChatMessage";
export { FormattedMessageText, parseBlocks, parseInline } from "@/features/chat/components/FormattedMessageText";
export { ModelSelect } from "@/features/chat/components/ModelSelect";
export { AttachmentButton } from "@/features/chat/components/AttachmentButton";
export { AttachmentChips } from "@/features/chat/components/AttachmentChips";

export { chatKeys } from "@/features/chat/hooks/use-chat-keys";
export { useChatThreads } from "@/features/chat/hooks/use-chat-threads";
export { useChatThread } from "@/features/chat/hooks/use-chat-thread";
export { useChatTurns } from "@/features/chat/hooks/use-chat-turns";
export { useCreateThread } from "@/features/chat/hooks/use-create-thread";
export { useCreateTurn, notifyChatTurnFailed } from "@/features/chat/hooks/use-create-turn";
export { useDeleteThread } from "@/features/chat/hooks/use-delete-thread";
export { usePurgeReminders } from "@/features/chat/hooks/use-purge-reminders";
export { useDeleteTurn } from "@/features/chat/hooks/use-delete-turn";
export { useRenameThread } from "@/features/chat/hooks/use-rename-thread";
export { usePinThread } from "@/features/chat/hooks/use-pin-thread";
export { useReorderPinnedThreads } from "@/features/chat/hooks/use-reorder-pinned-threads";
export { useChatStream } from "@/features/chat/hooks/use-chat-stream";
export { useOnlineStatus } from "@/features/chat/hooks/use-online-status";
export { useChatModel } from "@/features/chat/hooks/use-chat-model";

export {
  createThread,
  createChatTurn,
  listThreads,
  listTurns,
  uploadThreadAttachment,
  streamChatTurn,
  ensureIdempotencyKey,
} from "@/features/chat/services/chat-service";
export {
  UNDO_TOAST_DURATION_MS,
  UNDO_EXPIRED_NOTICE,
  NOT_DELETED_NOTICE,
  PURGE_RETENTION_DAYS,
  PURGE_WARNING_DAYS,
  formatPurgeNotice,
  formatReminderBanner,
  deleteChatThread,
  restoreChatThread,
  deleteChatTurn,
  restoreChatTurn,
  listDeletedThreads,
  listPurgeReminders,
  isUndoExpiredError,
  isNotDeletedError,
} from "@/features/chat/services/chat-delete";
export {
  MAX_PINNED_THREADS,
  PIN_LIMIT_NOTICE,
  NOT_PINNED_NOTICE,
  REORDER_FAILED_NOTICE,
  RENAME_FAILED_NOTICE,
  renameChatThread,
  pinChatThread,
  unpinChatThread,
  reorderPinnedThreads,
  isPinLimitError,
  isNotPinnedError,
  isReorderValidationError,
  getPinnedThreads,
  getUnpinnedThreads,
  movePinnedThreadOrder,
  applyPinnedOrder,
} from "@/features/chat/services/chat-threads";
export {
  parseSseBuffer,
  applySseEvent,
  readSseStream,
  INITIAL_ACCUMULATOR,
} from "@/features/chat/services/sse-parser";
export {
  isChatApiError,
  chatErrorStatus,
  chatErrorTraceId,
  chatErrorCode,
  describeChatError,
  isModelNoVisionError,
  isInvalidFileError,
  getChatErrorNotice,
  getRetryAfterSeconds,
} from "@/features/chat/services/chat-errors";
export {
  CHAT_MODEL_STORAGE_KEY,
  DEFAULT_CHAT_MODEL,
  VISION_MODEL,
  VISION_MODELS,
  ATTACH_GATE_NOTICE,
  MAX_ATTACHMENT_BYTES,
  CHAT_MODEL_OPTIONS,
  isChatModel,
  isVisionModel,
  canAttachWithModel,
  getAttachGateNotice,
  loadChatModel,
  saveChatModel,
  getAttachmentFileError,
} from "@/features/chat/services/chat-model";

export {
  createThreadSchema,
  createTurnSchema,
  listTurnsParamsSchema,
  chatModelSchema,
  chatCitationSchema,
  chatAttachmentSchema,
  uploadAttachmentResponseSchema,
  threadSummarySchema,
  listThreadsResponseSchema,
  turnItemSchema,
  renameThreadSchema,
  pinThreadSchema,
  reorderPinnedThreadsSchema,
  formatFirstIssue,
} from "@/features/chat/schemas/chat-schemas";

export { ChatApiError } from "@/features/chat/types/chat";
export type {
  IntentCategory,
  TurnRole,
  CreateThreadPayload,
  CreateThreadResponse,
  ThreadInfo,
  ListThreadsResponse,
  RenameThreadPayload,
  RenameThreadResponse,
  PinThreadPayload,
  PinThreadResponse,
  UnpinThreadResponse,
  ReorderPinnedThreadsPayload,
  ReorderPinnedThreadsResponse,
  DeleteThreadResponse,
  RestoreThreadResponse,
  DeleteTurnResponse,
  RestoreTurnResponse,
  CreateTurnPayload,
  ChatCitation,
  ChatAttachment,
  UploadAttachmentResponse,
  ChatModel,
  CreateTurnResponse,
  TurnItem,
  ListTurnsParams,
  ListTurnsResponse,
  SseEventName,
  SseDeltaEvent,
  SseDoneEvent,
  StreamAccumulator,
  ApiErrorBody,
} from "@/features/chat/types/chat";
