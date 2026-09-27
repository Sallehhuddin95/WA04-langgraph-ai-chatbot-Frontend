"use client";

import * as React from "react";
import Link from "next/link";
import { LogIn } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLogin } from "@/features/auth/hooks/use-login";
import { loginSchema } from "@/features/auth/schemas/auth-schemas";
import {
  describeAuthError,
  getAuthErrorMessage,
  getAuthFieldErrors,
} from "@/features/auth/services/auth-errors";

interface FieldErrors {
  email?: string;
  password?: string;
}

export function LoginForm(): React.JSX.Element {
  const { login, isPending } = useLogin();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [fieldErrors, setFieldErrors] = React.useState<FieldErrors>({});
  const [serverError, setServerError] = React.useState<string | null>(null);

  function setFieldError(name: "email" | "password", message: string): void {
    setFieldErrors((prev) => ({ ...prev, [name]: message }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setServerError(null);
    setFieldErrors({});
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const name = issue.path[0];
        if (name === "email" && next.email === undefined) next.email = issue.message;
        if (name === "password" && next.password === undefined) next.password = issue.message;
      }
      setFieldErrors(next);
      return;
    }
    try {
      await login(parsed.data);
    } catch (error) {
      const { kind } = describeAuthError(error);
      if (kind === "invalid-credentials") {
        setServerError("Email or password is wrong. Try again.");
        return;
      }
      if (kind === "validation") {
        const mapped = getAuthFieldErrors(error);
        if (mapped !== null) {
          if (mapped["email"] !== undefined) setFieldError("email", mapped["email"]);
          if (mapped["password"] !== undefined) setFieldError("password", mapped["password"]);
        }
        setServerError("Check the highlighted fields and try again.");
        return;
      }
      toast.error(getAuthErrorMessage(error));
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Sign in
          </h1>
          <p className="text-[13px] text-slate-500 dark:text-slate-400">
            Sign in to keep chatting.
          </p>
        </div>
        <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-3" noValidate>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="login-email"
              className="text-[13px] font-medium text-slate-900 dark:text-slate-100"
            >
              Email
            </label>
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setFieldErrors((prev) => ({ ...prev, email: undefined }));
              }}
              aria-invalid={fieldErrors.email !== undefined}
              aria-describedby={fieldErrors.email !== undefined ? "login-email-error" : undefined}
            />
            {fieldErrors.email !== undefined ? (
              <p id="login-email-error" role="alert" className="text-[13px] text-slate-900 dark:text-slate-100">
                {fieldErrors.email}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="login-password"
              className="text-[13px] font-medium text-slate-900 dark:text-slate-100"
            >
              Password
            </label>
            <Input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setFieldErrors((prev) => ({ ...prev, password: undefined }));
              }}
              aria-invalid={fieldErrors.password !== undefined}
              aria-describedby={fieldErrors.password !== undefined ? "login-password-error" : undefined}
            />
            {fieldErrors.password !== undefined ? (
              <p id="login-password-error" role="alert" className="text-[13px] text-slate-900 dark:text-slate-100">
                {fieldErrors.password}
              </p>
            ) : null}
          </div>
          {serverError !== null ? (
            <p role="alert" className="text-[13px] text-slate-900 dark:text-slate-100">
              {serverError}
            </p>
          ) : null}
          <Button type="submit" disabled={isPending}>
            <LogIn aria-hidden="true" /> {isPending ? "Signing in." : "Sign in"}
          </Button>
        </form>
        <p className="text-[13px] text-slate-500 dark:text-slate-400">
          No account? <Link href="/signup" className="text-blue-600 hover:underline dark:text-blue-400">Create one.</Link>
        </p>
      </CardContent>
    </Card>
  );
}
