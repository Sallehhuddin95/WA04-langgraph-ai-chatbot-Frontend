import { getApiBaseUrl } from "@/lib/api-base";
import {
  loginSchema,
  signupPayloadSchema,
} from "@/features/auth/schemas/auth-schemas";
import {
  AuthApiError,
  type AuthUser,
  type LoginPayload,
  type SignupPayload,
} from "@/features/auth/types/auth";

function toFieldErrors(body: unknown): Record<string, string> | null {
  if (typeof body !== "object" || body === null) return null;
  const record = body as Record<string, unknown>;
  const error = record["error"];
  if (typeof error === "object" && error !== null) {
    const fields = (error as Record<string, unknown>)["fields"];
    if (typeof fields === "object" && fields !== null && !Array.isArray(fields)) {
      const out: Record<string, string> = {};
      for (const [key, value] of Object.entries(fields)) {
        if (typeof value === "string") out[key] = value;
      }
      if (Object.keys(out).length > 0) return out;
    }
  }
  const detail = record["detail"];
  if (Array.isArray(detail)) {
    const out: Record<string, string> = {};
    for (const item of detail) {
      if (typeof item !== "object" || item === null) continue;
      const entry = item as Record<string, unknown>;
      const loc = entry["loc"];
      const msg = entry["msg"];
      if (Array.isArray(loc) && typeof msg === "string") {
        const last = loc[loc.length - 1];
        if (typeof last === "string") out[last] = msg;
      }
    }
    if (Object.keys(out).length > 0) return out;
  }
  return null;
}

function errorCode(body: unknown): string {
  if (typeof body !== "object" || body === null) return "request_failed";
  const record = body as Record<string, unknown>;
  const error = record["error"];
  if (typeof error === "object" && error !== null) {
    const code = (error as Record<string, unknown>)["code"];
    if (typeof code === "string" && code.length > 0) return code;
  }
  return "request_failed";
}

function readRetryAfter(response: Response): number | null {
  const raw = response.headers.get("Retry-After");
  if (raw === null) return null;
  const seconds = Number.parseInt(raw, 10);
  if (Number.isNaN(seconds) || seconds < 0) return null;
  return seconds;
}

async function throwFromResponse(response: Response): Promise<never> {
  let code = "request_failed";
  let fieldErrors: Record<string, string> | null = null;
  try {
    const body: unknown = await response.json();
    code = errorCode(body);
    fieldErrors = toFieldErrors(body);
  } catch {
    // Keep defaults when the body is not JSON.
  }
  throw new AuthApiError(
    response.status,
    code,
    "Auth request failed.",
    fieldErrors,
    readRetryAfter(response),
  );
}

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) await throwFromResponse(response);
  return (await response.json()) as T;
}

export async function signup(payload: SignupPayload): Promise<AuthUser> {
  const input = signupPayloadSchema.parse({
    email: payload.email,
    password: payload.password,
  });
  const response = await fetch(`${getApiBaseUrl()}/api/auth/signup`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseJson<AuthUser>(response);
}

export async function login(payload: LoginPayload): Promise<AuthUser> {
  const input = loginSchema.parse(payload);
  const response = await fetch(`${getApiBaseUrl()}/api/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseJson<AuthUser>(response);
}

export async function logout(): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new AuthApiError(0, "network_error", "Network request failed.", null);
    }
    throw error;
  }
  if (!response.ok) await throwFromResponse(response);
}

export async function fetchMe(): Promise<AuthUser> {
  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}/api/auth/me`, {
      method: "GET",
      credentials: "include",
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new AuthApiError(0, "network_error", "Network request failed.", null);
    }
    throw error;
  }
  return parseJson<AuthUser>(response);
}
