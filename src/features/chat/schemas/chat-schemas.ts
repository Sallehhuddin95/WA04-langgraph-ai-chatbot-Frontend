import { z } from "zod";

export const chatModelSchema = z.enum([
  "deepseek-v4-flash",
  "deepseek-v4-flash-vision-exp",
  "muse-spark-1.3",
]);

export type ChatModelInput = z.infer<typeof chatModelSchema>;

export const attachmentIdSchema = z.string().trim().uuid("Attachment id is not valid.");

export const chatCitationSchema = z.object({
  chunk_id: z.string().min(1),
  document_id: z.string().min(1),
  quote: z.string().min(1),
});

export const chatAttachmentSchema = z.object({
  attachment_id: z.string().uuid(),
  filename: z.string().min(1),
  mime: z.string().min(1),
});

export const uploadAttachmentResponseSchema = z.object({
  attachment_id: z.string().uuid(),
  filename: z.string().min(1),
  mime: z.string().min(1),
  size: z.number().int().min(1),
});

export const threadSummarySchema = z.object({
  thread_id: z.string().uuid(),
  title: z.string().min(1),
  updated_at: z.string().min(1),
  is_pinned: z.boolean().default(false),
  pin_order: z.number().int().min(0).nullable().default(null),
});

export const listThreadsResponseSchema = z.object({
  threads: z.array(threadSummarySchema),
});

export const renameThreadSchema = z.object({
  thread_id: z.string().trim().min(1, "Chat id is required."),
  title: z
    .string()
    .trim()
    .min(1, "Give the chat a short title.")
    .max(120, "Keep the title under 120 characters."),
});

export type RenameThreadInput = z.infer<typeof renameThreadSchema>;

export const pinThreadSchema = z.object({
  thread_id: z.string().trim().min(1, "Chat id is required."),
  position: z.number().int().min(0).optional(),
});

export type PinThreadInput = z.infer<typeof pinThreadSchema>;

export const reorderPinnedThreadsSchema = z.object({
  thread_ids: z
    .array(z.string().trim().uuid("Chat id is not valid."))
    .min(1)
    .max(5),
});

export type ReorderPinnedThreadsInput = z.infer<typeof reorderPinnedThreadsSchema>;

export const turnItemSchema = z.object({
  turn_id: z.string().min(1),
  role: z.enum(["user", "assistant"]),
  text: z.string(),
  citations: z.array(chatCitationSchema).default([]),
  intent_category: z.enum(["simple_chat", "rag_search", "complex_task"]).optional(),
  is_grounded: z.boolean().optional(),
  trace_id: z.string().optional(),
  created_at: z.string().min(1),
});

export const createThreadSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Give the chat a short title.")
    .max(120, "Keep the title under 120 characters.")
    .optional(),
});

export type CreateThreadInput = z.infer<typeof createThreadSchema>;

export const createTurnSchema = z.object({
  thread_id: z.string().trim().min(1, "Chat id is required.").uuid("Chat id is not valid."),
  message: z
    .string()
    .trim()
    .min(1, "Type a message before sending.")
    .max(4000, "Keep your message under 4000 characters."),
  idempotency_key: z.string().trim().uuid("Idempotency key is not valid.").optional(),
  model: chatModelSchema.default("deepseek-v4-flash"),
  attachment_ids: z.array(z.string().trim().uuid("Attachment id is not valid.")).default([]),
});

export type CreateTurnInput = z.infer<typeof createTurnSchema>;

export const listTurnsParamsSchema = z.object({
  thread_id: z.string().trim().min(1, "Chat id is required.").uuid("Chat id is not valid."),
  limit: z.number().int().min(1).max(50).default(20),
  cursor: z.string().min(1).nullable().default(null),
});

export type ListTurnsInput = z.infer<typeof listTurnsParamsSchema>;

export function formatFirstIssue(error: z.ZodError): string {
  const first = error.issues[0];
  if (first !== undefined) return first.message;
  return "That message could not be sent. Edit it and try again.";
}
