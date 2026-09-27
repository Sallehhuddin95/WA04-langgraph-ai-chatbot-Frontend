import { describe, expect, it } from "vitest";
import {
  loginSchema,
  signupPayloadSchema,
  signupSchema,
} from "@/features/auth/schemas/auth-schemas";

describe("loginSchema", () => {
  it("accepts a valid email and password", () => {
    // Arrange
    const input = { email: "user@example.com", password: "secret123" };

    // Act
    const result = loginSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    // Arrange
    const input = { email: "not-an-email", password: "secret123" };

    // Act
    const result = loginSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("rejects a missing email", () => {
    // Arrange
    const input = { email: "", password: "secret123" };

    // Act
    const result = loginSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("rejects an email over 320 characters", () => {
    // Arrange
    const input = { email: `${"a".repeat(312)}@test.com`, password: "secret123" };

    // Act
    const result = loginSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("rejects a password shorter than 8 characters", () => {
    // Arrange
    const input = { email: "user@example.com", password: "short" };

    // Act
    const result = loginSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("rejects a password over 128 characters", () => {
    // Arrange
    const input = { email: "user@example.com", password: "a".repeat(129) };

    // Act
    const result = loginSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("trims the email before validation", () => {
    // Arrange
    const input = { email: "  user@example.com  ", password: "secret123" };

    // Act
    const result = loginSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe("user@example.com");
  });
});

describe("signupSchema", () => {
  it("accepts matching passwords", () => {
    // Arrange
    const input = {
      email: "user@example.com",
      password: "secret123",
      confirmPassword: "secret123",
    };

    // Act
    const result = signupSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it("rejects a mismatched confirm password", () => {
    // Arrange
    const input = {
      email: "user@example.com",
      password: "secret123",
      confirmPassword: "other1234",
    };

    // Act
    const result = signupSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["confirmPassword"]);
      expect(result.error.issues[0]?.message).toBe("Passwords do not match.");
    }
  });

  it("rejects a missing confirm password", () => {
    // Arrange
    const input = { email: "user@example.com", password: "secret123", confirmPassword: "" };

    // Act
    const result = signupSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    // Arrange
    const input = {
      email: "bad",
      password: "secret123",
      confirmPassword: "secret123",
    };

    // Act
    const result = signupSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("rejects a short password", () => {
    // Arrange
    const input = { email: "user@example.com", password: "short", confirmPassword: "short" };

    // Act
    const result = signupSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });
});

describe("signupPayloadSchema", () => {
  it("accepts email plus password without confirm", () => {
    // Arrange
    const input = { email: "user@example.com", password: "secret123" };

    // Act
    const result = signupPayloadSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it("rejects a short password", () => {
    // Arrange
    const input = { email: "user@example.com", password: "short" };

    // Act
    const result = signupPayloadSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });
});
