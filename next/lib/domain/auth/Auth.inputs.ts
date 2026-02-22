
import { z } from "zod";
import type { UserCreateInput } from "./Auth.types";

// ═══════════════════════════════════════════════════════════════
// AUTH INPUT SCHEMAS
// ═══════════════════════════════════════════════════════════════

// ─── LOGIN ─────────────────────────────────────────────────────

export const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    deviceInfo: z.object({
        userAgent: z.string().optional(),
    }).optional(),
});

export type LoginInput = z.infer<typeof LoginSchema>;

// ─── REGISTER ──────────────────────────────────────────────────

export const RegisterSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(2).optional(),
    lastName: z.string().min(2).optional(),
    phone: z.string().optional(),
}) satisfies z.ZodType<UserCreateInput>;

export type RegisterInput = z.infer<typeof RegisterSchema>;

// ─── OTP ───────────────────────────────────────────────────────

export const EmailOtpSchema = z.object({
    email: z.string().email(),
    otp: z.string().length(6),
});

export type EmailOtpInput = z.infer<typeof EmailOtpSchema>;

export const PhoneOtpSchema = z.object({
    phone: z.string(),
    otp: z.string().length(6),
});

export type PhoneOtpInput = z.infer<typeof PhoneOtpSchema>;
