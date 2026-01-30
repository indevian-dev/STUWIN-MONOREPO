import { sendOtpSmsPlus } from '@/lib/integrations/smsService';
import { generateGlobalSms, generateOtpSms } from './smsGenerator';

import { ConsoleLogger } from '@/lib/app-infrastructure/loggers/ConsoleLogger';
interface SendSmsResult {
  success: boolean;
  code?: string;
  message?: string;
  error?: string;
}

interface BodyContent {
  type: 'general' | 'code' | 'bold';
  content: string;
}

interface SendGenericSmsParams {
  to: string;
  title: string;
  body: BodyContent[];
  username?: string;
}

/**
 * Send a generic SMS
 */
export async function sendGenericSms({
  to,
  title,
  body,
  username
}: SendGenericSmsParams): Promise<SendSmsResult> {
  try {
    // Generate SMS content using template
    const smsContent = generateGlobalSms({
      title,
      body,
      username
    });

    // Send SMS using SMS service client
    const result = await sendOtpSmsPlus({
      number: to,
      otp: smsContent.smsBody.message,
      expiryMinutes: 0 // Not applicable for generic SMS
    });

    return {
      success: result.success,
      code: result.code,
      message: result.message,
      error: result.error
    };
  } catch (error: any) {
    ConsoleLogger.error('Error sending generic SMS:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

interface SendOtpSmsParams {
  to: string;
  otp: string;
  username?: string;
  expiryMinutes?: number;
  operation?: string;
}

/**
 * Send OTP SMS for verification
 */
export async function sendOtpSms({
  to,
  otp,
  username,
  expiryMinutes = 10,
  operation = 'verification'
}: SendOtpSmsParams): Promise<SendSmsResult> {
  try {
    // Send OTP SMS using SMS service client
    const result = await sendOtpSmsPlus({
      number: to,
      otp,
      expiryMinutes
    });

    return {
      success: result.success,
      code: result.code,
      message: result.message,
      error: result.error
    };
  } catch (error: any) {
    ConsoleLogger.error('Error sending OTP SMS:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Send registration verification SMS
 */
export async function sendRegistrationOtpSms({
  to,
  otp,
  username,
  expiryMinutes = 10
}: Omit<SendOtpSmsParams, 'operation'>): Promise<SendSmsResult> {
  return sendOtpSms({
    to,
    otp,
    username,
    expiryMinutes,
    operation: 'verification'
  });
}

/**
 * Send password reset OTP SMS
 */
export async function sendPasswordResetOtpSms({
  to,
  otp,
  username,
  expiryMinutes = 10
}: Omit<SendOtpSmsParams, 'operation'>): Promise<SendSmsResult> {
  return sendOtpSms({
    to,
    otp,
    username,
    expiryMinutes,
    operation: 'password_reset'
  });
}

