
import { SupportRepository } from "./support.repository";
import { BaseService } from "../domain/BaseService";
import { AuthContext } from "@/lib/app-core-modules/types";
import { DbClient } from "@/lib/app-infrastructure/database";

/**
 * SupportService - Manages notifications, bookmarks, and regional settings
 */
export class SupportService extends BaseService {
    constructor(
        private readonly repository: SupportRepository,
        private readonly ctx: AuthContext,
        private readonly db: DbClient
    ) {
        super();
    }

    async getNotifications(accountId: number) {
        try {
            const notifications = await this.repository.listNotifications(accountId);
            return { success: true, data: notifications };
        } catch (error) {
            this.handleError(error, "getNotifications");
            return { success: false, error: "Failed to load notifications" };
        }
    }

    async markAsRead(notificationId: number) {
        try {
            const updated = await this.repository.markNotificationRead(notificationId);
            return { success: true, data: updated };
        } catch (error) {
            this.handleError(error, "markAsRead");
            return { success: false, error: "Failed to update notification" };
        }
    }

    async getCountries() {
        try {
            const countries = await this.repository.listCountries();
            return { success: true, data: countries };
        } catch (error) {
            this.handleError(error, "getCountries");
            return { success: false, error: "Failed to load countries" };
        }
    }
}
