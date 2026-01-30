import { db } from '@/lib/app-infrastructure/database';
import { accountOtps } from '@/lib/app-infrastructure/database/schema';
import { eq, and, gt, lt, desc } from 'drizzle-orm';
import { sendMail } from '@/lib/integrations/mailService';
import { sendOtpSmsPlus } from '@/lib/integrations/smsService';
import { generateVerificationOtpEmail } from '@/lib/app-infrastructure/notificators/mail/mailGenerator';
import { generateVerificationOtpSms } from '@/lib/app-infrastructure/notificators/sms/smsGenerator';

export function generateOtp(): { otpCode: string } {
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  return { otpCode };
}

export type OtpType =
  | 'email_verification'
  | 'phone_verification'
  | 'password_reset'
  | '2fa_email'
  | '2fa_phone';

interface OtpRecord {
  id: string;
  accountId: string | null;
  code: string | null;
  type: OtpType | null;
  expireAt: Date | null;
  createdAt: Date;
  destination: string | null;
}

interface RecentOtpRecord {
  id: string;
  createdAt: Date;
  expireAt: Date | null;
}

interface StoreOtpParams {
  otpCode: string;
  accountId: string;
  type: OtpType;
  destination: string;
  ttlMinutes?: number;
}

interface StoreOtpResult {
  storedOtp: string | null;
  isOtpIssued: boolean;
  error?: string;
}

// Store OTP for account
export async function storeOtp({
  otpCode,
  accountId,
  type,
  destination,
  ttlMinutes = 2
}: StoreOtpParams): Promise<StoreOtpResult> {
  const expireAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

  try {
    const result = await db.insert(accountOtps).values({
      accountId,
      code: otpCode,
      expireAt,
      type,
      destination
    }).returning({ code: accountOtps.code });

    return {
      storedOtp: otpCode,
      isOtpIssued: true
    };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    return {
      storedOtp: null,
      isOtpIssued: false,
      error: err.message
    };
  }
}

export async function validateOtp({
  accountId,
  type,
  otp,
  destination
}: {
  accountId: string;
  type: OtpType;
  otp: string;
  destination?: string;
}): Promise<boolean> {
  const result = await db
    .select()
    .from(accountOtps)
    .where(and(
      eq(accountOtps.accountId, accountId),
      eq(accountOtps.type, type),
      eq(accountOtps.code, otp),
      destination ? eq(accountOtps.destination, destination) : undefined,
      gt(accountOtps.expireAt, new Date())
    ))
    .limit(1);

  return result.length > 0;
}

// Check if recent OTP exists (created less than 2 minutes ago)
export async function checkRecentOtpExists({
  accountId,
  type
}: {
  accountId: string;
  type: OtpType;
}): Promise<RecentOtpRecord | null> {
  const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);

  const result = await db
    .select({
      id: accountOtps.id,
      createdAt: accountOtps.createdAt,
      expireAt: accountOtps.expireAt
    })
    .from(accountOtps)
    .where(and(
      eq(accountOtps.accountId, accountId),
      eq(accountOtps.type, type),
      gt(accountOtps.createdAt, twoMinutesAgo),
      gt(accountOtps.expireAt, new Date())
    ))
    .orderBy(accountOtps.createdAt)
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function checkOtpExists({
  accountId,
  type
}: {
  accountId: string;
  type: OtpType;
}): Promise<RecentOtpRecord | null> {
  const result = await db
    .select({
      id: accountOtps.id,
      createdAt: accountOtps.createdAt,
      expireAt: accountOtps.expireAt
    })
    .from(accountOtps)
    .where(and(
      eq(accountOtps.accountId, accountId),
      eq(accountOtps.type, type),
      gt(accountOtps.expireAt, new Date())
    ))
    .orderBy(accountOtps.createdAt)
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * Issue OTP (generate and store)
 */
export async function issueOtp({
  accountId,
  type,
  destination,
  ttlMinutes = 10
}: {
  accountId: string;
  type: OtpType;
  destination: string;
  ttlMinutes?: number;
}): Promise<string> {
  const { otpCode } = generateOtp();
  await storeOtp({
    otpCode,
    accountId,
    type,
    destination,
    ttlMinutes
  });
  return otpCode;
}

/**
 * Get valid OTP from database
 */
export async function getValidOtp({
  accountId,
  type,
  code,
  destination,
  client
}: {
  accountId: string;
  type: OtpType;
  code: string;
  destination?: string;
  client?: typeof db;
}): Promise<OtpRecord | null> {
  const queryClient = client || db;

  const result = await queryClient
    .select({
      id: accountOtps.id,
      accountId: accountOtps.accountId,
      code: accountOtps.code,
      type: accountOtps.type,
      expireAt: accountOtps.expireAt,
      createdAt: accountOtps.createdAt
    })
    .from(accountOtps)
    .where(and(
      eq(accountOtps.accountId, accountId),
      eq(accountOtps.type, type),
      eq(accountOtps.code, code),
      destination ? eq(accountOtps.destination, destination) : undefined,
      gt(accountOtps.expireAt, new Date())
    ))
    .limit(1);

  // Cast type explicitly since Drizzle logical types and OtpRecord enum might have slight inference mismatches
  return result.length > 0 ? result[0] as unknown as OtpRecord : null;
}

/**
 * Consume (delete) OTP after verification
 */
export async function consumeOtp({
  otpId,
  client
}: {
  otpId: string;
  client?: typeof db;
}): Promise<void> {
  const queryClient = client || db;
  await queryClient
    .delete(accountOtps)
    .where(eq(accountOtps.id, otpId));
}

/**
 * Legacy function for email OTP verification
 * @deprecated Use getValidOtp + consumeOtp instead
 */
export async function verifyEmailOtp(accountId: string, otp: string): Promise<{ accountId: string } | null> {
  const validOtp = await getValidOtp({
    accountId,
    type: 'email_verification',
    code: otp
  });

  if (!validOtp) return null;

  await consumeOtp({ otpId: validOtp.id });
  return { accountId };
}

interface StoreAndSendOtpResult {
  success: boolean;
  otp: string | null;
  emailSent: boolean;
  smsSent: boolean;
  emailError?: string | null;
  smsError?: string | null;
  error?: string;
}

/**
 * Store and send registration OTP to both email and phone
 */
export async function storeAndSendRegistrationOtp({
  accountId,
  email,
  phone,
  type = 'email_verification',
  ttlMinutes = 10
}: {
  accountId: string;
  email?: string;
  phone?: string;
  type?: OtpType;
  ttlMinutes?: number;
}): Promise<StoreAndSendOtpResult> {
  try {
    // Generate OTP
    const { otpCode } = generateOtp();

    // Store OTP in database
    const { storedOtp, isOtpIssued } = await storeOtp({
      otpCode,
      accountId,
      type,
      destination: (type === 'phone_verification' || type === '2fa_phone') ? (phone || '') : (email || ''),
      ttlMinutes
    });

    if (!isOtpIssued) {
      return {
        success: false,
        error: 'Failed to store OTP',
        emailSent: false,
        smsSent: false,
        otp: null
      };
    }

    // Initialize result tracking
    let emailSent = false;
    let smsSent = false;
    let emailError: string | null = null;
    let smsError: string | null = null;

    // Send OTP via email
    if (email) {
      try {
        const emailTemplate = generateVerificationOtpEmail({
          username: email.split('@')[0],
          otp: otpCode,
          expiryMinutes: ttlMinutes
        });

        const emailResult = await sendMail({
          to: email,
          subject: 'Verification Code - Complete Your Registration',
          html: emailTemplate.html || ''
        });

        emailSent = emailResult.success;
        if (!emailResult.success) {
          emailError = emailResult.error || 'Failed to send email';
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        emailError = err.message;
      }
    }

    // Send OTP via SMS
    if (phone) {
      try {
        const smsTemplate = generateVerificationOtpSms({
          username: phone,
          otp: otpCode,
          expiryMinutes: ttlMinutes
        });

        const smsResult = await sendOtpSmsPlus({
          number: phone,
          otp: otpCode,
          expiryMinutes: ttlMinutes
        });

        smsSent = smsResult.success;
        if (!smsResult.success) {
          smsError = smsResult.error || 'Failed to send SMS';
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        smsError = err.message;
      }
    }

    // Return comprehensive result
    return {
      success: emailSent || smsSent, // At least one should succeed
      otp: otpCode,
      emailSent,
      smsSent,
      emailError,
      smsError
    };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    return {
      success: false,
      error: err.message,
      emailSent: false,
      smsSent: false,
      otp: null
    };
  }
}

