import type { ChatModel } from "@/features/chat/types/chat";

export const CHAT_MODEL_STORAGE_KEY = "chat.model.v1";

export const DEFAULT_CHAT_MODEL: ChatModel = "deepseek-v4-flash";

export const VISION_MODEL: ChatModel = "deepseek-v4-flash-vision-exp";

export const VISION_MODELS: readonly ChatModel[] = [
  "deepseek-v4-flash-vision-exp",
  "muse-spark-1.3",
];

export const ATTACH_GATE_NOTICE = "Select the vision model to attach images.";

export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;

export interface ChatModelOption {
  value: ChatModel;
  label: string;
}

export const CHAT_MODEL_OPTIONS: ChatModelOption[] = [
  { value: "deepseek-v4-flash", label: "DeepSeek V4 Flash" },
  { value: "deepseek-v4-flash-vision-exp", label: "DeepSeek V4 Flash Vision" },
  { value: "muse-spark-1.3", label: "Muse Spark 1.3" },
];

export function isChatModel(value: unknown): value is ChatModel {
  return (
    value === "deepseek-v4-flash" ||
    value === "deepseek-v4-flash-vision-exp" ||
    value === "muse-spark-1.3"
  );
}

export function isVisionModel(model: ChatModel): boolean {
  return (VISION_MODELS as readonly string[]).includes(model);
}

export function canAttachWithModel(model: ChatModel): boolean {
  return isVisionModel(model);
}

export function getAttachGateNotice(model: ChatModel): string | null {
  if (isVisionModel(model)) return null;
  return ATTACH_GATE_NOTICE;
}

export function loadChatModel(): ChatModel {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return DEFAULT_CHAT_MODEL;
  }
  try {
    const raw = window.localStorage.getItem(CHAT_MODEL_STORAGE_KEY);
    if (raw !== null && isChatModel(raw)) return raw;
  } catch {
    // Storage blocked. Use the default model.
  }
  return DEFAULT_CHAT_MODEL;
}

export function saveChatModel(model: ChatModel): void {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") return;
  try {
    window.localStorage.setItem(CHAT_MODEL_STORAGE_KEY, model);
  } catch {
    // Storage full or blocked. Model stays in memory only.
  }
}

export interface AttachmentFileLike {
  type: string;
  size: number;
}

export function getAttachmentFileError(file: AttachmentFileLike): string | null {
  if (typeof file.type !== "string" || !file.type.startsWith("image/")) {
    return "Only image files are allowed.";
  }
  if (typeof file.size !== "number" || file.size > MAX_ATTACHMENT_BYTES) {
    return "Image is too large. Max size is 5MB.";
  }
  return null;
}
