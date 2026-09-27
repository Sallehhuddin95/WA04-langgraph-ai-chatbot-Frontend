import { z } from "zod";

const emailField = z
  .string()
  .trim()
  .min(1, "Email is required.")
  .max(320, "Keep email under 320 characters.")
  .email("Enter a valid email.");

const passwordField = z
  .string()
  .min(1, "Password is required.")
  .max(72, "Keep password under 72 characters.")
  .refine((value) => value.length >= 8, "Use at least 8 characters.");

export const loginSchema = z.object({
  email: emailField,
  password: passwordField,
});

export type LoginInput = z.infer<typeof loginSchema>;

export const signupSchema = z
  .object({
    email: emailField,
    password: passwordField,
    confirmPassword: z.string().min(1, "Confirm your password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type SignupInput = z.infer<typeof signupSchema>;

// Payload sent to the API. No refinement here because Zod 4 forbids
// .pick() on refined schemas and the server needs no confirm field.
export const signupPayloadSchema = z.object({
  email: emailField,
  password: passwordField,
});

export type SignupPayloadInput = z.infer<typeof signupPayloadSchema>;
