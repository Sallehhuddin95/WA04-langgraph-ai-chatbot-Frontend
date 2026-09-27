import type { ChatApiError } from "@/features/chat/types/chat";
import { ChatApiError as ChatApiErrorClass } from "@/features/chat/types/chat";

export function isChatApiError(error: unknown): error is ChatApiError {
  return error instanceof ChatApiErrorClass;
}

export function chatErrorStatus(error: unknown): number | null {
  if (isChatApiError(error)) return error.status;
  return null;
}

export function chatErrorTraceId(error: unknown): string | null {
  if (isChatApiError(error)) return error.traceId;
  return null;
}

export type ChatErrorKind =
  | "validation"
  | "signed-out"
  | "forbidden"
  | "not-found"
  | "conflict"
  | "rate-limited"
  | "server"
  | "offline"
  | "unknown";

export const MODEL_NO_VISION_CODE = "model_no_vision";

export const INVALID_FILE_CODES = [
  "invalid_file",
  "invalid_file_type",
  "file_too_large",
  "attachment_too_large",
  "invalid_attachment",
] as const;

export function chatErrorCode(error: unknown): string | null {
  if (isChatApiError(error)) return error.code;
  return null;
}

export function isModelNoVisionError(error: unknown): boolean {
  if (!isChatApiError(error)) return false;
  return error.code === MODEL_NO_VISION_CODE;
}

export function isInvalidFileError(error: unknown): boolean {
  if (!isChatApiError(error)) return false;
  if ((INVALID_FILE_CODES as readonly string[]).includes(error.code)) return true;
  if (error.status === 422) {
    const code = error.code.toLowerCase();
    if (code.includes("file") || code.includes("image") || code.includes("attachment")) {
      return true;
    }
  }
  return false;
}

export function getRetryAfterSeconds(error: unknown): number | null {
  if (isChatApiError(error)) return error.retryAfter;
  return null;
}

export function getChatErrorNotice(error: unknown): string {
  if (isModelNoVisionError(error)) {
    return "This model cannot use images. Select the vision model to attach images.";
  }
  if (isInvalidFileError(error)) {
    return "That file could not be attached. Use an image under 5MB.";
  }
  const { kind } = describeChatError(error);
  if (kind === "validation") return "That message could not be sent. Edit it and try again.";
  if (kind === "signed-out") return "Your session expired. Sign in again to keep chatting.";
  if (kind === "forbidden") return "You do not have access to this chat.";
  if (kind === "offline") return "You are offline. Check your connection and try again.";
  if (kind === "rate-limited") {
    const wait = getRetryAfterSeconds(error);
    if (wait !== null) return `Rate limit hit. Try again in ${wait} seconds.`;
    return "Rate limit hit. Wait a moment and try again.";
  }
  return "This reply failed to load. Retry this turn.";
}

export function describeChatError(error: unknown): {
  kind: ChatErrorKind;
  traceId: string | null;
  code: string | null;
} {
  if (error instanceof DOMException && error.name === "AbortError") {
    return { kind: "unknown", traceId: null, code: null };
  }
  if (isChatApiError(error)) {
    if (error.status === 0 && error.code === "timeout")
      return { kind: "server", traceId: null, code: error.code };
    if (error.status === 0) return { kind: "offline", traceId: null, code: error.code };
    if (error.status === 400 || error.status === 422)
      return { kind: "validation", traceId: error.traceId, code: error.code };
    if (error.status === 401)
      return { kind: "signed-out", traceId: error.traceId, code: error.code };
    if (error.status === 403)
      return { kind: "forbidden", traceId: error.traceId, code: error.code };
    if (error.status === 404)
      return { kind: "not-found", traceId: error.traceId, code: error.code };
    if (error.status === 409)
      return { kind: "conflict", traceId: error.traceId, code: error.code };
    if (error.status === 429)
      return { kind: "rate-limited", traceId: error.traceId, code: error.code };
    if (error.status >= 500)
      return { kind: "server", traceId: error.traceId, code: error.code };
    return { kind: "unknown", traceId: error.traceId, code: error.code };
  }
  if (error instanceof TypeError) return { kind: "offline", traceId: null, code: null };
  return { kind: "unknown", traceId: null, code: null };
}
