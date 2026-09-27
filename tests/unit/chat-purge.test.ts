import { describe, expect, it } from "vitest";
import {
  formatPurgeNotice,
  formatReminderBanner,
} from "@/features/chat/services/chat-delete";

describe("purge notices", () => {
  it("mentions 30 days and 3-day reminder by default", () => {
    expect(formatPurgeNotice(30)).toContain("30 days");
    expect(formatPurgeNotice(30)).toContain("3 days before");
  });

  it("warns directly inside the reminder window", () => {
    expect(formatPurgeNotice(2)).toContain("2 days");
    expect(formatPurgeNotice(2)).toContain("Restore it");
  });

  it("formats a single-thread banner", () => {
    const text = formatReminderBanner([
      {
        thread_id: "t1",
        title: "Refund chat",
        deleted_at: "2026-09-27T00:00:00Z",
        purge_at: "2026-10-27T00:00:00Z",
        days_remaining: 2,
        needs_reminder: true,
      },
    ]);
    expect(text).toContain("Refund chat");
    expect(text).toContain("2 days");
  });
});
