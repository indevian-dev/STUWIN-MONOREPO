import { SendMailClient } from "zeptomail";

import { ConsoleLogger } from '@/lib/logging/Console.logger';
// Create a reusable ZeptoMail client
const client = new SendMailClient({
  url: "https://api.zeptomail.eu/v1.1/email",
  token: process.env.ZEPTOMAIL_TOKEN!,
});

/**
 * Email sending options
 */
interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send mail result
 */
interface SendMailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send an email using ZeptoMail
 * @param options - Email options
 * @param options.to - Recipient email address(es), can be comma-separated
 * @param options.subject - Email subject
 * @param options.text - Plain text version of email (optional)
 * @param options.html - HTML version of email
 * @returns ZeptoMail send result
 */
export async function sendMail({ to, html, subject }: SendMailOptions): Promise<SendMailResult> {
  try {
    // Format recipients
    const recipients = to.split(',').map(email => ({
      email_address: {
        address: email.trim(),
        name: email.trim().split('@')[0]
      }
    }));

    // Prepare email payload
    const emailPayload = {
      from: {
        address: process.env.MAIL_FROM || process.env.MAIL_USER!,
        name: process.env.MAIL_FROM_NAME || "stuwin.ai"
      },
      to: recipients,
      subject: subject,
      htmlbody: html
    };

    // Send mail
    const result = await client.sendMail(emailPayload);

    return { success: true, messageId: result.data?.message_id };
  } catch (error) {
    const err = error as { message: string; error?: { details?: unknown } };
    ConsoleLogger.error('Email sending failed:', error);
    ConsoleLogger.error('Email sending failed details:', err?.error?.details);
    return { success: false, error: err.message };
  }
}

