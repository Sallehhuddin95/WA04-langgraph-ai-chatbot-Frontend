// Auth feature contracts. Field names mirror the backend auth contract.

export interface AuthUser {
  user_id: string;
  email: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignupPayload {
  email: string;
  password: string;
}

export class AuthApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fieldErrors: Record<string, string> | null;
  readonly retryAfter: number | null;

  constructor(
    status: number,
    code: string,
    message: string,
    fieldErrors: Record<string, string> | null = null,
    retryAfter: number | null = null,
  ) {
    super(message);
    this.name = "AuthApiError";
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
    this.retryAfter = retryAfter;
  }
}
