import type { EmailTemplate } from '@/lib/notifications/_Notifications.index';

interface BodyContent {
  type: 'general' | 'copyable' | 'boldBig';
  content: string;
}

interface GenerateGlobalEmailParams {
  title: string;
  body?: BodyContent[];
  username?: string;
}

/**
 * Global Email Template
 * This template generates HTML for all emails with consistent header and footer
 */
function generateGlobalEmail({
  title,
  body = [],
  username
}: GenerateGlobalEmailParams): EmailTemplate {
  // Validate required parameters
  if (!title) {
    throw new Error('Title is required for global email template');
  }

  const displayName = username || 'User';

  // Generate body content based on types
  const generateBodyContent = (bodyItems: BodyContent[]): string => {
    return bodyItems.map(item => {
      switch (item.type) {
        case 'general':
          return `<p>${item.content}</p>`;
        case 'copyable':
          return `
            <div class="code-container">
              <div class="code">${item.content}</div>
            </div>`;
        case 'boldBig':
          return `<h1 class="bold-big">${item.content}</h1>`;
        default:
          return `<p>${item.content}</p>`;
      }
    }).join('\n');
  };

  return {
    subject: title,
    body: '', // Text version not implemented
    html:
      `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333333;
      margin: 0;
      padding: 0;
      background-color: #f4f4f4;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      padding: 20px 0;
      background-color: #ffffff;
      border-radius: 6px 6px 0 0;
    }
    .logo-container {
      display: block;
      text-align: center;
      line-height: 1;
    }
    .logo-container img {
      max-width: 100%;
      height: auto;
    }
    .content {
      background-color: #ffffff;
      padding: 30px;
      border-radius: 0 0 6px 6px;
      border: 1px solid #e0e0e0;
      border-top: none;
    }
    .code-container {
      margin: 30px 0;
      text-align: center;
    }
    .code {
      font-family: monospace;
      font-size: 32px;
      font-weight: bold;
      letter-spacing: 5px;
      padding: 15px 25px;
      background-color: #f7f7f7;
      border-radius: 5px;
      border: 1px dashed #cccccc;
      display: inline-block;
    }
    .bold-big {
      font-size: 28px;
      font-weight: bold;
      color: #333333;
      margin: 20px 0;
      text-align: center;
    }
    .footer {
      margin-top: 30px;
      text-align: center;
      font-size: 12px;
      color: #999999;
      background-color: #ffffff;
      padding: 20px;
      border-radius: 6px;
      border: 1px solid #e0e0e0;
    }
    @media only screen and (max-width: 480px) {
      .container {
        padding: 10px;
      }
      .content {
        padding: 20px;
      }
      .code {
        font-size: 24px;
        letter-spacing: 3px;
        padding: 10px 15px;
      }
      .bold-big {
        font-size: 24px;
      }
      .logo-container img {
        width: 220px;
        height: auto;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-container">
        <img src="https://stuwin.ai/stuwinlogo.png" alt="STUWIN.AI" width="280" style="display: inline-block; height: auto;">
      </div>
    </div>
    <div class="content">
      ${generateBodyContent(body)}
    </div>
    <div class="footer">
      <p><strong>stuwin.ai</strong></p>
      <p>Your trusted guide for educational institutions</p>
      <p style="margin-top: 15px;">Contact: support@stuwin.ai</p>
      <p>Visit us: <a href="https://stuwin.ai" style="color: #73C816; text-decoration: none;">www.stuwin.ai</a></p>
      <p style="margin-top: 15px; font-size: 11px;">This is an automated message, please do not reply to this email.</p>
      <p style="font-size: 11px;">&copy; ${new Date().getFullYear()} stuwin.ai. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`
  };
}

/**
 * Legacy OTP Email Template - Use generateGlobalEmail instead
 * @deprecated Use generateGlobalEmail for new implementations
 */
export function generateOtpEmail({
  username,
  otp,
  expiryMinutes = 10
}: {
  username?: string;
  otp: string;
  expiryMinutes?: number;
}): EmailTemplate {
  if (!otp) {
    throw new Error('OTP is required for reset password email');
  }

  const displayName = username || 'User';

  return generateGlobalEmail({
    title: 'Password Reset Code',
    username: displayName,
    body: [
      { type: 'boldBig', content: 'Password Reset Code' },
      { type: 'general', content: `Hello ${displayName},` },
      { type: 'general', content: 'We received a request to reset your password. Please use the verification code below to complete the process:' },
      { type: 'copyable', content: otp },
      { type: 'general', content: `This code will expire in ${expiryMinutes} minutes.` },
      { type: 'general', content: "If you didn't request this password reset, please ignore this email or contact our support team if you have concerns." },
      { type: 'general', content: 'Thank you,<br>The stuwin.ai Team' }
    ]
  });
}

export function generateVerificationOtpEmail({
  username,
  otp,
  expiryMinutes = 10
}: {
  username: string;
  otp: string;
  expiryMinutes?: number;
}): EmailTemplate {
  return generateGlobalEmail({
    title: 'Verification Code',
    username: username,
    body: [
      { type: 'boldBig', content: 'Verification Code' },
      { type: 'general', content: `Hello ${username},` },
      { type: 'general', content: 'We received a request to verify your email address. Please use the verification code below to complete the process:' },
      { type: 'copyable', content: otp },
      { type: 'general', content: `This code will expire in ${expiryMinutes} minutes.` },
      { type: 'general', content: "If you didn't request this email verification, please ignore this email or contact our support team if you have concerns." },
      { type: 'general', content: 'Thank you,<br>The stuwin.ai Team' }
    ]
  });
}

export function generateWelcomeEmail({ username }: { username: string }): EmailTemplate {
  if (!username) {
    throw new Error('Username is required for welcome email');
  }

  return generateGlobalEmail({
    title: 'Welcome to stuwin.ai!',
    username: username,
    body: [
      { type: 'boldBig', content: 'Welcome to stuwin.ai!' },
      { type: 'general', content: `Hello ${username},` },
      { type: 'general', content: 'Thank you for joining stuwin.ai! Your account has been successfully created and verified.' },
      { type: 'general', content: 'You can now start exploring educational institutions and their programs on our platform.' },
      { type: 'general', content: 'If you have any questions or need assistance, feel free to contact our support team.' },
      { type: 'general', content: 'Best regards,<br>The stuwin.ai Team' }
    ]
  });
}

export function generateCardApprovalEmail({
  username,
  cardTitle,
  cardId
}: {
  username: string;
  cardTitle: string;
  cardId: string;
}): EmailTemplate {
  if (!username || !cardTitle || !cardId) {
    throw new Error('Username, cardTitle, and cardId are required for card approval email');
  }

  return generateGlobalEmail({
    title: 'Your Listing Has Been Approved - stuwin.ai',
    username: username,
    body: [
      { type: 'boldBig', content: 'Your Listing Has Been Approved!' },
      { type: 'general', content: `Hello ${username},` },
      { type: 'general', content: `Great news! Your listing "${cardTitle}" has been reviewed and approved by our team.` },
      { type: 'general', content: 'Your listing is now live and visible on the stuwin.ai platform.' },
      { type: 'general', content: 'You can view and manage your listing from your dashboard.' },
      { type: 'general', content: 'Thank you for choosing stuwin.ai,<br>The stuwin.ai Team' }
    ]
  });
}

export function generateCardRejectionEmail({
  username,
  cardTitle,
  cardId,
  reasons = [],
  reasonText = ''
}: {
  username: string;
  cardTitle: string;
  cardId: string;
  reasons?: string[];
  reasonText?: string;
}): EmailTemplate {
  if (!username || !cardTitle || !cardId) {
    throw new Error('Username, cardTitle, and cardId are required for card rejection email');
  }

  const reasonsList = reasons.length > 0 ? reasons.join(', ') : 'various issues';
  const additionalText = reasonText ? ` Additional details: ${reasonText}` : '';

  return generateGlobalEmail({
    title: 'Listing Update Request - stuwin.ai',
    username: username,
    body: [
      { type: 'boldBig', content: 'Listing Update Required' },
      { type: 'general', content: `Hello ${username},` },
      { type: 'general', content: `We have reviewed your listing "${cardTitle}" and found some issues that need to be addressed before it can be published.` },
      { type: 'general', content: `Issues found: ${reasonsList}.${additionalText}` },
      { type: 'general', content: 'Please update your listing with the corrected information and resubmit it for review. You can make these changes from your dashboard.' },
      { type: 'general', content: 'If you have any questions about these requirements, please contact our support team.' },
      { type: 'general', content: 'Thank you for your understanding,<br>The stuwin.ai Team' }
    ]
  });
}

export { generateGlobalEmail };

