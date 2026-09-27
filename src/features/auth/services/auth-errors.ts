import { AuthApiError } from "@/features/auth/types/auth";

export type AuthErrorKind =
  | "conflict"
  | "invalid-credentials"
  | "validation"
  | "server"
  | "offline"
  | "unknown";

export function isAuthApiError(error: unknown): error is AuthApiError {
  return error instanceof AuthApiError;
}

export function authErrorStatus(error: unknown): number | null {
  if (isAuthApiError(error)) return error.status;
  return null;
}

export function describeAuthError(error: unknown): {
  kind: AuthErrorKind;
  status: number | null;
  code: string | null;
} {
  if (error instanceof DOMException && error.name === "AbortError") {
    return { kind: "unknown", status: null, code: null };
  }
  if (isAuthApiError(error)) {
    if (error.status === 0) return { kind: "offline", status: 0, code: error.code };
    if (error.status === 409) return { kind: "conflict", status: 409, code: error.code };
    if (error.status === 401)
      return { kind: "invalid-credentials", status: 401, code: error.code };
    if (error.status === 400 || error.status === 422)
      return { kind: "validation", status: error.status, code: error.code };
    if (error.status >= 500)
      return { kind: "server", status: error.status, code: error.code };
    return { kind: "unknown", status: error.status, code: error.code };
  }
  if (error instanceof TypeError) return { kind: "offline", status: null, code: null };
  return { kind: "unknown", status: null, code: null };
}

export function getAuthFieldErrors(error: unknown): Record<string, string> | null {
  if (isAuthApiError(error) && error.fieldErrors !== null) return error.fieldErrors;
  return null;
}

export function getAuthErrorMessage(error: unknown): string {
  if (
    isAuthApiError(error) &&
    error.status === 429 &&
    error.retryAfter !== null
  ) {
    return `Too many attempts. Try again in ${error.retryAfter} seconds.`;
  }
  if (isAuthApiError(error) && error.status === 429) {
    return "Too many attempts. Wait a moment and try again.";
  }
  const { kind } = describeAuthError(error);
  if (kind === "conflict") return "This email is taken. Try signing in.";
  if (kind === "invalid-credentials") return "Email or password is wrong. Try again.";
  if (kind === "validation") return "Check the highlighted fields and try again.";
  if (kind === "offline") return "You are offline. Check your connection and try again.";
  return "Something went wrong. Try again later.";
}
