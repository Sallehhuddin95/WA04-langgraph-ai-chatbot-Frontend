// Chat feature contracts. Field names mirror the backend spec verbatim.
// Backend owner: backend specs/api/chat-api.md. On mismatch, fix this file.

export type IntentCategory = "simple_chat" | "rag_search" | "complex_task";

export type TurnRole = "user" | "assistant";

export interface CreateThreadPayload {
  title?: string;
}

export interface CreateThreadResponse {
  thread_id: string;
  title: string;
  created_at: string;
}

export type ChatModel = "deepseek-v4-flash" | "deepseek-v4-flash-vision-exp" | "muse-spark-1.3";

export interface ChatAttachment {
  attachment_id: string;
  filename: string;
  mime: string;
}

export interface UploadAttachmentResponse {
  attachment_id: string;
  filename: string;
  mime: string;
  size: number;
}

export interface ThreadInfo {
  thread_id: string;
  title: string;
  updated_at: string;
  created_at?: string;
  is_pinned: boolean;
  pin_order: number | null;
}

export interface ListThreadsResponse {
  threads: ThreadInfo[];
}

export interface RenameThreadPayload {
  title: string;
}

export interface RenameThreadResponse {
  thread_id: string;
  title: string;
  updated_at: string;
  is_pinned: boolean;
  pin_order: number | null;
}

export interface PinThreadPayload {
  position?: number;
}

export interface PinThreadResponse {
  thread_id: string;
}

export interface UnpinThreadResponse {
  thread_id: string;
}

export interface ReorderPinnedThreadsPayload {
  thread_ids: string[];
}

export interface ReorderPinnedThreadsResponse {
  thread_ids: string[];
}

export interface CreateTurnPayload {
  thread_id: string;
  message: string;
  idempotency_key?: string;
  model?: ChatModel;
  attachment_ids?: string[];
}

export interface ChatCitation {
  chunk_id: string;
  document_id: string;
  quote: string;
}

export interface CreateTurnResponse {
  thread_id: string;
  turn_id: string;
  reply_text: string;
  citations: ChatCitation[];
  intent_category: IntentCategory;
  is_grounded: boolean;
  trace_id: string;
  attachments?: ChatAttachment[];
}

export interface TurnItem {
  turn_id: string;
  role: TurnRole;
  text: string;
  citations?: ChatCitation[];
  intent_category?: IntentCategory;
  is_grounded?: boolean;
  trace_id?: string;
  created_at: string;
}

export interface ListTurnsParams {
  thread_id: string;
  limit: number;
  cursor: string | null;
}

export interface ListTurnsResponse {
  items: TurnItem[];
  next_cursor: string | null;
}

export interface DeleteThreadResponse {
  thread_id: string;
  deleted_at?: string | null;
  purge_at?: string | null;
  days_remaining?: number | null;
}

export interface DeletedThreadInfo {
  thread_id: string;
  title: string | null;
  deleted_at: string;
  purge_at: string;
  days_remaining: number;
  needs_reminder: boolean;
}

export interface ListDeletedThreadsResponse {
  threads: DeletedThreadInfo[];
}

export interface RestoreThreadResponse {
  thread_id: string;
}

export interface DeleteTurnResponse {
  turn_id: string;
}

export interface RestoreTurnResponse {
  turn_id: string;
}

export type SseEventName = "delta" | "citation" | "done" | "error";

export interface SseDeltaEvent {
  turn_id: string;
  trace_id: string;
  delta: string;
}

export interface SseDoneEvent {
  turn_id: string;
  trace_id: string;
  intent_category: IntentCategory;
  is_grounded: boolean;
}

export interface StreamAccumulator {
  text: string;
  citations: ChatCitation[];
  turn_id: string | null;
  trace_id: string | null;
  intent_category: IntentCategory | null;
  is_grounded: boolean | null;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    trace_id: string;
  };
}

export class ChatApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly traceId: string | null;
  readonly retryAfter: number | null;

  constructor(
    status: number,
    code: string,
    message: string,
    traceId: string | null,
    retryAfter: number | null = null,
  ) {
    super(message);
    this.name = "ChatApiError";
    this.status = status;
    this.code = code;
    this.traceId = traceId;
    this.retryAfter = retryAfter;
  }
}
