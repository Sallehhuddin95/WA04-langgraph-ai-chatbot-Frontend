import { describe, expect, it } from "vitest";
import {
  describeAuthError,
  getAuthErrorMessage,
  getAuthFieldErrors,
} from "@/features/auth/services/auth-errors";
import { AuthApiError } from "@/features/auth/types/auth";

describe("describeAuthError", () => {
  it("maps 409 to conflict", () => {
    // Arrange
    const error = new AuthApiError(409, "conflict", "Auth request failed.", null);

    // Act
    const result = describeAuthError(error);

    // Assert
    expect(result.kind).toBe("conflict");
  });

  it("maps 401 to invalid credentials", () => {
    // Arrange
    const error = new AuthApiError(401, "unauthorized", "Auth request failed.", null);

    // Act
    const result = describeAuthError(error);

    // Assert
    expect(result.kind).toBe("invalid-credentials");
  });

  it("maps 422 to validation", () => {
    // Arrange
    const error = new AuthApiError(422, "validation", "Auth request failed.", {
      email: "Enter a valid email.",
    });

    // Act
    const result = describeAuthError(error);

    // Assert
    expect(result.kind).toBe("validation");
  });

  it("maps 500 to server", () => {
    // Arrange
    const error = new AuthApiError(500, "server_error", "Auth request failed.", null);

    // Act
    const result = describeAuthError(error);

    // Assert
    expect(result.kind).toBe("server");
  });

  it("maps status 0 to offline", () => {
    // Arrange
    const error = new AuthApiError(0, "network_error", "Network request failed.", null);

    // Act
    const result = describeAuthError(error);

    // Assert
    expect(result.kind).toBe("offline");
  });

  it("maps unknown errors to unknown", () => {
    // Act
    const result = describeAuthError(new Error("boom"));

    // Assert
    expect(result.kind).toBe("unknown");
  });
});

describe("getAuthErrorMessage", () => {
  it("uses sign-in copy for taken emails", () => {
    // Arrange
    const error = new AuthApiError(409, "conflict", "Auth request failed.", null);

    // Act
    const message = getAuthErrorMessage(error);

    // Assert
    expect(message).toBe("This email is taken. Try signing in.");
  });

  it("uses retry copy for bad credentials", () => {
    // Arrange
    const error = new AuthApiError(401, "unauthorized", "Auth request failed.", null);

    // Act
    const message = getAuthErrorMessage(error);

    // Assert
    expect(message).toBe("Email or password is wrong. Try again.");
  });

  it("uses field copy for validation failures", () => {
    // Arrange
    const error = new AuthApiError(422, "validation", "Auth request failed.", null);

    // Act
    const message = getAuthErrorMessage(error);

    // Assert
    expect(message).toBe("Check the highlighted fields and try again.");
  });

  it("uses generic copy for server failures", () => {
    // Arrange
    const error = new AuthApiError(500, "server_error", "Auth request failed.", null);

    // Act
    const message = getAuthErrorMessage(error);

    // Assert
    expect(message).toBe("Something went wrong. Try again later.");
  });

  it("never exposes raw backend text", () => {
    // Arrange
    const error = new AuthApiError(500, "db_down", "SECRET: pg connection failed", null);

    // Act
    const message = getAuthErrorMessage(error);

    // Assert
    expect(message).not.toContain("SECRET");
    expect(message).not.toContain("pg connection");
  });
});

describe("getAuthFieldErrors", () => {
  it("returns field errors for validation failures", () => {
    // Arrange
    const error = new AuthApiError(422, "validation", "Auth request failed.", {
      email: "Enter a valid email.",
    });

    // Act
    const fields = getAuthFieldErrors(error);

    // Assert
    expect(fields).toEqual({ email: "Enter a valid email." });
  });

  it("returns null when no field errors exist", () => {
    // Arrange
    const error = new AuthApiError(401, "unauthorized", "Auth request failed.", null);

    // Act
    const fields = getAuthFieldErrors(error);

    // Assert
    expect(fields).toBeNull();
  });
});
