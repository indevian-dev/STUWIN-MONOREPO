import type { ApiRouteHandler, ApiHandlerContext } from '@/types/next';
import { NextRequest, NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/app-access-control/interceptors';
import { sendMail } from '@/lib/integrations/mailService';
import { generateVerificationOtpEmail } from '@/lib/app-infrastructure/notificators/mail/mailGenerator';
import { issueOtp } from '@/lib/utils/otpHandlingUtility';
import { sendOtpSmsPlus } from '@/lib/integrations/smsService';
import type { OtpType } from '@/lib/utils/otpHandlingUtility';
import { users, accounts } from '@/lib/app-infrastructure/database/schema';
import { eq, or } from 'drizzle-orm';

export const POST: ApiRouteHandler = withApiHandler(async (request: NextRequest, { log, db }: ApiHandlerContext) => {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, phone, operation = 'verification' } = body || {};

    const allowedOperations = ['verification', 'password_reset', '2fa', 'email_change', 'phone_change'] as const;
    if (!allowedOperations.includes(operation)) {
      return NextResponse.json({ error: 'Invalid operation type' }, { status: 400 });
    }

    const hasEmail = typeof email === 'string' && email.trim().length > 0;
    const hasPhone = typeof phone === 'string' && phone.trim().length > 0;

    if (!hasEmail && !hasPhone) return NextResponse.json({ error: 'Email or phone is required' }, { status: 400 });
    if (hasEmail && hasPhone) return NextResponse.json({ error: 'Provide only one of email or phone' }, { status: 400 });

    const channel = hasEmail ? 'email' : 'phone';
    const normalizedTarget = hasEmail ? email.trim().toLowerCase() : phone.trim();

    // Map operation to proper OTP type
    let verifyType: OtpType;
    if (operation === 'verification') {
      verifyType = hasEmail ? 'email_verification' : 'phone_verification';
    } else if (operation === 'email_change') {
      verifyType = 'email_change' as OtpType;
    } else if (operation === 'phone_change') {
      verifyType = 'phone_change' as OtpType;
    } else {
      verifyType = operation as OtpType;
    }

    // Find user and their account
    const userResult = await db
      .select({
        userId: users.id,
        email: users.email,
        phone: users.phone,
        firstName: users.firstName,
        lastName: users.lastName,
        emailVerified: users.emailIsVerified,
        phoneVerified: users.phoneIsVerified,
        accountId: accounts.id
      })
      .from(users)
      .leftJoin(accounts, eq(users.id, accounts.userId))
      .where(hasEmail ? eq(users.email, normalizedTarget) : eq(users.phone, normalizedTarget))
      .limit(1);

    if (!userResult?.length) return NextResponse.json({ error: 'User not found' }, { status: 400 });
    const user = userResult[0];

    if (!user.accountId) {
      return NextResponse.json({ error: 'Account not found for this user' }, { status: 400 });
    }

    if (operation === 'verification') {
      if (channel === 'email' && user.emailVerified) {
        return NextResponse.json({ success: true, alreadyVerified: true, message: 'Email already verified' }, { status: 200 });
      }
      if (channel === 'phone' && user.phoneVerified) {
        return NextResponse.json({ success: true, alreadyVerified: true, message: 'Phone already verified' }, { status: 200 });
      }
    }

    // Get OTP expiry from env (in seconds) and convert to minutes
    const otpExpireSeconds = parseInt(process.env.OTP_EXPIRE_TIME || '1200', 10);
    const otpExpireMinutes = Math.ceil(otpExpireSeconds / 60);

    const otp = await issueOtp({
      accountId: user.accountId,
      type: verifyType,
      destination: normalizedTarget,
      ttlMinutes: otpExpireMinutes
    });

    if (channel === 'email') {
      const emailSubjects: Record<string, string> = {
        verification: 'Verify Your Email - stuwin.ai',
        password_reset: 'Password Reset - stuwin.ai',
        '2fa': 'Two-Factor Authentication - stuwin.ai',
        email_change: 'Verify Your New Email - stuwin.ai',
        phone_change: 'Verify Email for Phone Change - stuwin.ai'
      };

      const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || 'User';

      const { html } = generateVerificationOtpEmail({
        username: fullName,
        otp,
        expiryMinutes: otpExpireMinutes
      });

      const result = await sendMail({
        to: user.email,
        subject: emailSubjects[operation] || 'Verification Code - stuwin.ai',
        html: html || ''
      });

      if (!result?.success) return NextResponse.json({ error: 'Failed to send verification email' }, { status: 500 });
    } else {
      const sms = await sendOtpSmsPlus({
        number: user.phone || '',
        otp,
        expiryMinutes: otpExpireMinutes
      });

      if (!sms?.success) {
        return NextResponse.json({ error: sms?.error || 'Failed to send verification SMS' }, { status: 500 });
      }
    }

    const operationMessages: Record<string, string> = {
      verification: `Verification code sent to ${channel}`,
      password_reset: `Password reset code sent to ${channel}`,
      '2fa': `Two-factor authentication code sent to ${channel}`,
      email_change: `Email change verification code sent to ${channel}`,
      phone_change: `Phone change verification code sent to ${channel}`
    };

    const payload: any = {
      success: true,
      message: operationMessages[operation] || `Verification code sent to ${channel}`,
      operation,
      channel
    };
    if (process.env.NODE_ENV !== 'production') payload.devCode = otp;

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    console.error('OTP request error:', error);
    return NextResponse.json({ error: 'Failed to process verification request' }, { status: 500 });
  }
});


