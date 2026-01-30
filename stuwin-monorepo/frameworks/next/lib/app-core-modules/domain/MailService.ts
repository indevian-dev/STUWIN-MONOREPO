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

            return { success: true };
        } catch (error) {
            this.handleError(error, "MailService.send");
            return { success: false, error: "Failed to send email" };
        }
    }
}
