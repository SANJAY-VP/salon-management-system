// Validation schemas for auth forms
import { z } from "zod";

const emailField = z.email("Enter a valid email address");

const passwordField = z
  .string()
  .min(1, "Password is required")
  .min(8, "Password must be at least 8 characters");

const phoneField = z
  .string()
  .min(1, "Phone number is required")
  .regex(/^\d{10}$/, "Enter a valid 10-digit phone number");

export const loginSchema = z.object({
  email: emailField,
  password: passwordField,
});
export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    phone: phoneField,
    email: emailField,
    password: passwordField,
    confirmPassword: z.string().min(1, "Please confirm your password"),
    role: z.enum(["customer", "barber"]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type RegisterFormData = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: emailField,
});
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export const barberStep1Schema = z.object({
  shopName: z.string().min(2, "Salon name must be at least 2 characters"),
  ownerName: z.string().min(2, "Owner name must be at least 2 characters"),
  phone: phoneField,
  location: z.string().min(5, "Please enter a valid location"),
});

export const barberStep2Schema = z
  .object({
    email: emailField,
    password: passwordField,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
