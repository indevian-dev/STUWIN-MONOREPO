/** Common result type for all notification channels */
export interface NotificationResult {
    success: boolean;
    messageId?: string;
    error?: string;
}

/** Supported notification channels */
export type NotificationChannel = 'mail' | 'sms' | 'push';

/** Base notification payload shared across channels */
export interface NotificationPayload {
    to: string;
    subject?: string;
    body: string;
}

export interface EmailTemplate {
    subject: string;
    body: string;
    html?: string;
    templateId?: string;
}

export interface SMSTemplate {
    body: string;
    templateId?: string;
}
