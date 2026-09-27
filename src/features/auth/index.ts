// Public API for the auth feature. Routes import from here, not from internals.

export { LoginForm } from "@/features/auth/components/LoginForm";
export { SignupForm } from "@/features/auth/components/SignupForm";
export { RequireAuth } from "@/features/auth/components/RequireAuth";
export { RedirectWhenAuthenticated } from "@/features/auth/components/RedirectWhenAuthenticated";
export { AuthSkeleton } from "@/features/auth/components/AuthSkeleton";

export { authKeys } from "@/features/auth/hooks/use-auth-keys";
export { useMe } from "@/features/auth/hooks/use-me";
export { useLogin } from "@/features/auth/hooks/use-login";
export { useSignup } from "@/features/auth/hooks/use-signup";
export { useLogout } from "@/features/auth/hooks/use-logout";

export { signup, login, logout, fetchMe } from "@/features/auth/services/auth-service";
export {
  isAuthApiError,
  authErrorStatus,
  describeAuthError,
  getAuthFieldErrors,
  getAuthErrorMessage,
} from "@/features/auth/services/auth-errors";
export type { AuthErrorKind } from "@/features/auth/services/auth-errors";

export { loginSchema, signupSchema } from "@/features/auth/schemas/auth-schemas";
export type { LoginInput, SignupInput } from "@/features/auth/schemas/auth-schemas";

export { AuthApiError } from "@/features/auth/types/auth";
export type {
  AuthUser,
  LoginPayload,
  SignupPayload,
} from "@/features/auth/types/auth";
