import { AuthContext } from "@/lib/app-core-modules/types";
import { BaseService } from "./BaseService";
import { sendMail } from "@/lib/integrations/mailService";

/**
 * MailService - Handles email sending operations
 */
export class MailService extends BaseService {
    constructor(private readonly ctx: AuthContext) {
        super();
    }

    async send(to: string, subject: string, html: string) {
        try {
            if (!to || !subject || !html) {
                throw new Error("Missing required email parameters");
            }

            await sendMail({
                to: to,
                subject: subject,
                html: html,
            });

            return { success: true as const };
        } catch (error) {
            this.handleError(error, "MailService.send");
            return { success: false as const, error: "Failed to send email" };
        }
    }

    async sendEmail(data: {
        to_email: string;
        to_name?: string;
        subject: string;
        htmlbody: string;
        textbody?: string;
    }) {
        try {
            const result = await sendMail({
                to: data.to_email,
                subject: data.subject,
                html: data.htmlbody,
                text: data.textbody
            });

            if (!result.success) {
                return { success: false as const, error: result.error };
            }

            return {
                success: true as const,
                data: {
                    message_id: result.messageId,
                    status: 'success'
                }
            };
        } catch (error) {
            this.handleError(error, "MailService.sendEmail");
            return { success: false as const, error: "Failed to send email" };
        }
    }

    async getConfig() {
        try {
            const config = {
                smtp_host: "smtp.zeptomail.com",
                smtp_port: process.env.ZEPTOMAIL_SMTP_PORT || "587",
                smtp_username: "emailapikey",
                from_email: process.env.ZEPTOMAIL_FROM_EMAIL || "",
                from_name: process.env.ZEPTOMAIL_FROM_NAME || "",
                api_key: process.env.ZEPTOMAIL_API_KEY ? "***configured***" : "",
                smtp_password: process.env.ZEPTOMAIL_SMTP_PASSWORD
                    ? "***configured***"
                    : "",
            };
            return { success: true as const, data: { config } };
        } catch (error) {
            this.handleError(error, "MailService.getConfig");
            return { success: false as const, error: "Failed to fetch configuration" };
        }
    }

    async updateConfig(data: any) {
        try {
            const { api_key, smtp_password, from_email } = data;

            if (!api_key || !smtp_password || !from_email) {
                return { success: false, error: "Missing required configuration fields", code: 400 };
            }

            return {
                success: true,
                message: "Configuration saved successfully. Please update your environment variables."
            };
        } catch (error) {
            this.handleError(error, "MailService.updateConfig");
            return { success: false, error: "Failed to save configuration" };
        }
    }

    async getStatus() {
        try {
            const apiKey = process.env.ZEPTOMAIL_API_KEY;
            const smtpPassword = process.env.ZEPTOMAIL_SMTP_PASSWORD;
            const mailAgent = process.env.ZEPTOMAIL_MAIL_AGENT;

            const api_configured = !!apiKey;
            const smtp_configured = !!smtpPassword;

            let status = "operational";
            let message = "ZeptoMail service is operational";

            if (!api_configured && !smtp_configured) {
                status = "down";
                message = "ZeptoMail is not configured.";
            } else if (!api_configured || !smtp_configured) {
                status = "degraded";
                message = "ZeptoMail is partially configured.";
            }

            return {
                success: true,
                data: {
                    status,
                    message,
                    api_configured,
                    smtp_configured,
                    mail_agent: mailAgent || "Not configured",
                    last_checked: new Date().toISOString(),
                }
            };
        } catch (error) {
            this.handleError(error, "MailService.getStatus");
            return { success: false, error: "Failed to check service status" };
        }
    }

    async testConnection(apiKey: string, fromEmail: string) {
        try {
            if (!apiKey || !fromEmail) {
                return { success: false as const, error: "API key and from email are required for testing", code: 400 };
            }

            const response = await fetch('https://zeptomail.zoho.com/v1.1/email', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Zoho-enczapikey ${apiKey}`
                },
                body: JSON.stringify({
                    from: {
                        address: fromEmail,
                        name: 'Test'
                    },
                    to: [{
                        email_address: {
                            address: 'test@example.com',
                            name: 'Test'
                        }
                    }],
                    subject: 'Test Connection',
                    htmlbody: '<p>This is a test</p>'
                })
            });

            if (response.status === 400 || response.status === 200) {
                return {
                    success: true,
                    message: 'Connection to ZeptoMail API successful'
                };
            } else if (response.status === 401) {
                return { success: false, error: 'Invalid API key or authentication failed', code: 400 };
            } else {
                return { success: false, error: 'Failed to connect to ZeptoMail API', code: 400 };
            }
        } catch (error) {
            this.handleError(error, "MailService.testConnection");
            return { success: false, error: 'Network error connecting to ZeptoMail API', code: 400 };
        }
    }
}
