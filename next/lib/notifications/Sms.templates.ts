import type { SMSTemplate } from '@/lib/notifications/_Notifications.index';

interface BodyContent {
  type: 'general' | 'code' | 'bold';
  content: string;
}

interface GenerateGlobalSmsParams {
  title: string;
  body?: BodyContent[];
  username?: string;
}

interface SmsResult {
  smsGenerated: boolean;
  smsBody: {
    message: string;
  };
}

/**
 * Global SMS Template
 * This template generates SMS messages with consistent formatting
 */
function generateGlobalSms({
  title,
  body = [],
  username
}: GenerateGlobalSmsParams): SmsResult {
  // Validate required parameters
  if (!title) {
    throw new Error('Title is required for global SMS template');
  }

  const displayName = username || 'User';

  // Generate body content based on types
  const generateBodyContent = (bodyItems: BodyContent[]): string => {
    return bodyItems.map(item => {
      switch (item.type) {
        case 'general':
          return item.content;
        case 'code':
          return `${item.content}`;
        case 'bold':
          return item.content.toUpperCase();
        default:
          return item.content;
      }
    }).join('\n');
  };

  // Combine title and body content
  const message = `${title}\n\n${generateBodyContent(body)}`;

  return {
    smsGenerated: true,
    smsBody: {
      message: message
    }
  };
}

/**
 * Legacy OTP SMS Template - Use generateGlobalSms instead
 * @deprecated Use generateGlobalSms for new implementations
 */
function generateOtpSms({
  username,
  otp,
  expiryMinutes = 10
}: {
  username?: string;
  otp: string;
  expiryMinutes?: number;
}): SmsResult {
  // Validate required parameters
  if (!otp) {
    throw new Error('OTP is required for OTP SMS');
  }

  const displayName = username || 'User';

  return generateGlobalSms({
    title: 'TikTak - Password Reset Code',
    username: displayName,
    body: [
      { type: 'general', content: `Hello ${displayName},` },
      { type: 'general', content: 'Your password reset code is:' },
      { type: 'code', content: otp },
      { type: 'general', content: `This code expires in ${expiryMinutes} minutes.` }
    ]
  });
}

/**
 * Phone Verification OTP SMS Template
 */
export function generateVerificationOtpSms({
  username,
  otp,
  expiryMinutes = 10
}: {
  username: string;
  otp: string;
  expiryMinutes?: number;
}): SmsResult {
  // Validate required parameters
  if (!otp) {
    throw new Error('OTP is required for verification SMS');
  }

  const displayName = username || 'User';

  return generateGlobalSms({
    title: 'TikTak - Verification Code',
    username: displayName,
    body: [
      { type: 'general', content: `Hello ${displayName},` },
      { type: 'general', content: 'Your verification code is:' },
      { type: 'code', content: otp },
      { type: 'general', content: `This code expires in ${expiryMinutes} minutes.` }
    ]
  });
}

export {
  generateGlobalSms,
  generateOtpSms
};

