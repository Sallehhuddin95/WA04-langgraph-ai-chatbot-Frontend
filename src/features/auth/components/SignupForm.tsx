"use client";

import * as React from "react";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useSignup } from "@/features/auth/hooks/use-signup";
import { signupSchema } from "@/features/auth/schemas/auth-schemas";
import {
  describeAuthError,
  getAuthErrorMessage,
  getAuthFieldErrors,
} from "@/features/auth/services/auth-errors";

interface FieldErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export function SignupForm(): React.JSX.Element {
  const { signup, isPending } = useSignup();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [fieldErrors, setFieldErrors] = React.useState<FieldErrors>({});
  const [serverError, setServerError] = React.useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setServerError(null);
    setFieldErrors({});
    const parsed = signupSchema.safeParse({ email, password, confirmPassword });
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const name = issue.path[0];
        if (name === "email" && next.email === undefined) next.email = issue.message;
        if (name === "password" && next.password === undefined) next.password = issue.message;
        if (name === "confirmPassword" && next.confirmPassword === undefined)
          next.confirmPassword = issue.message;
      }
      setFieldErrors(next);
      return;
    }
    try {
      await signup({ email: parsed.data.email, password: parsed.data.password });
    } catch (error) {
      const { kind } = describeAuthError(error);
      if (kind === "conflict") {
        setServerError("This email is taken. Try signing in.");
        return;
      }
      if (kind === "validation") {
        const mapped = getAuthFieldErrors(error);
        const next: FieldErrors = {};
        if (mapped !== null) {
          if (mapped["email"] !== undefined) next.email = mapped["email"];
          if (mapped["password"] !== undefined) next.password = mapped["password"];
          if (mapped["confirmPassword"] !== undefined || mapped["confirm_password"] !== undefined) {
            next.confirmPassword =
              mapped["confirmPassword"] ?? mapped["confirm_password"] ?? "Check this field and try again.";
          }
        }
        setFieldErrors(next);
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
            Create account
          </h1>
          <p className="text-[13px] text-slate-500 dark:text-slate-400">
            Create an account to start chatting.
          </p>
        </div>
        <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-3" noValidate>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="signup-email"
              className="text-[13px] font-medium text-slate-900 dark:text-slate-100"
            >
              Email
            </label>
            <Input
              id="signup-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setFieldErrors((prev) => ({ ...prev, email: undefined }));
              }}
              aria-invalid={fieldErrors.email !== undefined}
              aria-describedby={fieldErrors.email !== undefined ? "signup-email-error" : undefined}
            />
            {fieldErrors.email !== undefined ? (
              <p id="signup-email-error" role="alert" className="text-[13px] text-slate-900 dark:text-slate-100">
                {fieldErrors.email}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="signup-password"
              className="text-[13px] font-medium text-slate-900 dark:text-slate-100"
            >
              Password
            </label>
            <Input
              id="signup-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setFieldErrors((prev) => ({ ...prev, password: undefined }));
              }}
              aria-invalid={fieldErrors.password !== undefined}
              aria-describedby={fieldErrors.password !== undefined ? "signup-password-error" : undefined}
            />
            {fieldErrors.password !== undefined ? (
              <p id="signup-password-error" role="alert" className="text-[13px] text-slate-900 dark:text-slate-100">
                {fieldErrors.password}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="signup-confirm"
              className="text-[13px] font-medium text-slate-900 dark:text-slate-100"
            >
              Confirm password
            </label>
            <Input
              id="signup-confirm"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value);
                setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
              }}
              aria-invalid={fieldErrors.confirmPassword !== undefined}
              aria-describedby={fieldErrors.confirmPassword !== undefined ? "signup-confirm-error" : undefined}
            />
            {fieldErrors.confirmPassword !== undefined ? (
              <p id="signup-confirm-error" role="alert" className="text-[13px] text-slate-900 dark:text-slate-100">
                {fieldErrors.confirmPassword}
              </p>
            ) : null}
          </div>
          {serverError !== null ? (
            <p role="alert" className="text-[13px] text-slate-900 dark:text-slate-100">
              {serverError}
            </p>
          ) : null}
          <Button type="submit" disabled={isPending}>
            <UserPlus aria-hidden="true" /> {isPending ? "Creating account." : "Create account"}
          </Button>
        </form>
        <p className="text-[13px] text-slate-500 dark:text-slate-400">
          Have an account? <Link href="/login" className="text-blue-600 hover:underline dark:text-blue-400">Sign in.</Link>
        </p>
      </CardContent>
    </Card>
  );
}
