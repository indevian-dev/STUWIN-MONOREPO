
import { z } from "zod";

/**
 * Zod schemas for Auth module entities and API validation
 */

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    deviceInfo: z.object({
        userAgent: z.string().optional(),
    }).optional(),
});

export const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(2).optional(),
    lastName: z.string().min(2).optional(),
    phone: z.string().optional(),
});

export const userSchema = z.object({
    id: z.string().uuid().optional(),
    email: z.string().email(),
    name: z.string().optional(),
    lastName: z.string().optional(),
    phone: z.string().optional(),
    emailIsVerified: z.boolean().default(false),
    phoneIsVerified: z.boolean().default(false),
});

export const accountSchema = z.object({
    id: z.string().optional(),
    userId: z.string().uuid(),
    suspended: z.boolean().default(false),
});

export const emailOtpSchema = z.object({
    email: z.string().email(),
    otp: z.string().length(6),
});

export const phoneOtpSchema = z.object({
    phone: z.string(),
    otp: z.string().length(6),
});
