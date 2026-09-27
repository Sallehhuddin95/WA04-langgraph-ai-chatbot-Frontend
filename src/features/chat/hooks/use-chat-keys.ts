export const chatKeys = {
  threads: () => ["chat", "threads"] as const,
  thread: (threadId: string) => ["chat", "threads", threadId] as const,
  turns: (threadId: string) => ["chat", "turns", threadId] as const,
  turnsPage: (threadId: string, filters: { limit: number; cursor: string | null }) =>
    ["chat", "turns", threadId, filters] as const,
  deletedThreads: () => ["chat", "threads", "deleted"] as const,
  purgeReminders: () => ["chat", "threads", "purge-reminders"] as const,
};
