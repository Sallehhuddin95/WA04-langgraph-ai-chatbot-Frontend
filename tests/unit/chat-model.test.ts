import { describe, expect, it } from "vitest";
import {
  chatModelSchema,
  createTurnSchema,
} from "@/features/chat/schemas/chat-schemas";
import {
  ATTACH_GATE_NOTICE,
  canAttachWithModel,
  DEFAULT_CHAT_MODEL,
  getAttachGateNotice,
  getAttachmentFileError,
  isVisionModel,
  loadChatModel,
} from "@/features/chat/services/chat-model";

const THREAD_ID = "550e8400-e29b-41d4-a716-446655440000";
const ATTACH_ID = "660e8400-e29b-41d4-a716-446655440001";

describe("chatModelSchema", () => {
  it("accepts the three supported models", () => {
    // Arrange
    const models = ["deepseek-v4-flash", "deepseek-v4-flash-vision-exp", "muse-spark-1.3"];

    // Act
    const results = models.map((model) => chatModelSchema.safeParse(model));

    // Assert
    for (const result of results) expect(result.success).toBe(true);
  });

  it("rejects an unknown model", () => {
    // Arrange
    const input = "gpt-99";

    // Act
    const result = chatModelSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });
});

describe("createTurnSchema model and attachments", () => {
  it("defaults model and attachment ids when missing", () => {
    // Arrange
    const input = { thread_id: THREAD_ID, message: "hi" };

    // Act
    const result = createTurnSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.model).toBe("deepseek-v4-flash");
      expect(result.data.attachment_ids).toEqual([]);
    }
  });

  it("accepts vision model with attachment ids", () => {
    // Arrange
    const input = {
      thread_id: THREAD_ID,
      message: "what is in this image?",
      model: "deepseek-v4-flash-vision-exp",
      attachment_ids: [ATTACH_ID],
    };

    // Act
    const result = createTurnSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it("rejects an unknown model on turn create", () => {
    // Arrange
    const input = { thread_id: THREAD_ID, message: "hi", model: "other-model" };

    // Act
    const result = createTurnSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("rejects a non-uuid attachment id", () => {
    // Arrange
    const input = { thread_id: THREAD_ID, message: "hi", attachment_ids: ["not-a-uuid"] };

    // Act
    const result = createTurnSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });
});

describe("upload gating notice", () => {
  it("allows attach for both vision models and gates plain flash", () => {
    // Arrange
    const vision = "deepseek-v4-flash-vision-exp" as const;
    const flash = "deepseek-v4-flash" as const;
    const spark = "muse-spark-1.3" as const;

    // Act
    const visionResult = canAttachWithModel(vision);
    const flashResult = canAttachWithModel(flash);
    const sparkResult = canAttachWithModel(spark);

    // Assert
    expect(visionResult).toBe(true);
    expect(flashResult).toBe(false);
    expect(sparkResult).toBe(true);
  });

  it("returns null notice for vision models and gate copy for plain flash", () => {
    // Arrange
    const vision = "deepseek-v4-flash-vision-exp" as const;
    const flash = "deepseek-v4-flash" as const;
    const spark = "muse-spark-1.3" as const;

    // Act
    const visionNotice = getAttachGateNotice(vision);
    const flashNotice = getAttachGateNotice(flash);
    const sparkNotice = getAttachGateNotice(spark);

    // Assert
    expect(visionNotice).toBeNull();
    expect(sparkNotice).toBeNull();
    expect(flashNotice).toBe("Select the vision model to attach images.");
    expect(flashNotice).toBe(ATTACH_GATE_NOTICE);
  });

  it("marks both vision models as vision and gates plain flash", () => {
    // Act
    const vision = isVisionModel("deepseek-v4-flash-vision-exp");
    const spark = isVisionModel("muse-spark-1.3");
    const flash = isVisionModel("deepseek-v4-flash");

    // Assert
    expect(vision).toBe(true);
    expect(spark).toBe(true);
    expect(flash).toBe(false);
  });

  it("defaults stored model when no browser storage exists", () => {
    // Act
    const result = loadChatModel();

    // Assert
    expect(result).toBe(DEFAULT_CHAT_MODEL);
  });
});

describe("attachment file validation", () => {
  it("accepts a small image file", () => {
    // Arrange
    const file = { type: "image/png", size: 1024 };

    // Act
    const result = getAttachmentFileError(file);

    // Assert
    expect(result).toBeNull();
  });

  it("rejects a non-image file", () => {
    // Arrange
    const file = { type: "application/pdf", size: 1024 };

    // Act
    const result = getAttachmentFileError(file);

    // Assert
    expect(result).toBe("Only image files are allowed.");
  });

  it("rejects an image over 5MB", () => {
    // Arrange
    const file = { type: "image/jpeg", size: 6 * 1024 * 1024 };

    // Act
    const result = getAttachmentFileError(file);

    // Assert
    expect(result).toBe("Image is too large. Max size is 5MB.");
  });
});
