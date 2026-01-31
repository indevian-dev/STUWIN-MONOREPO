
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

    async getNotifications(accountId: string) {
        try {
            const notifications = await this.repository.listNotifications(accountId);
            return { success: true, data: notifications };
        } catch (error) {
            this.handleError(error, "getNotifications");
            return { success: false, error: "Failed to load notifications" };
        }
    }

    async getNotificationsContext(params: { accountId: string; page?: number; limit?: number }) {
        try {
            const page = params.page || 1;
            const limit = params.limit || 5;
            const offset = (page - 1) * limit;

            const [notifications, total, unreadCount] = await Promise.all([
                this.repository.listNotificationsPaginated(params.accountId, { limit, offset }),
                this.repository.countNotifications(params.accountId),
                this.repository.countUnreadNotifications(params.accountId)
            ]);

            return {
                success: true,
                data: {
                    notifications,
                    pagination: {
                        page,
                        limit,
                        total,
                        totalPages: Math.ceil(total / limit),
                        hasNext: page < Math.ceil(total / limit),
                        hasPrev: page > 1
                    },
                    unread_count: unreadCount
                }
            };
        } catch (error) {
            this.handleError(error, "getNotificationsContext");
            return { success: false, error: "Failed to load notifications context" };
        }
    }

    async markAsRead(notificationId: string) {
        try {
            const updated = await this.repository.markNotificationRead(notificationId);
            return { success: true, data: updated };
        } catch (error) {
            this.handleError(error, "markAsRead");
            return { success: false, error: "Failed to update notification" };
        }
    }

    async listBookmarks(accountId: string, workspaceId: string) {
        try {
            const bookmarks = await this.repository.listBookmarks(accountId, workspaceId);
            return { success: true, data: bookmarks };
        } catch (error) {
            this.handleError(error, "listBookmarks");
            return { success: false, error: "Failed to load bookmarks" };
        }
    }

    async getBookmarksContext(accountId: string, workspaceId: string, page: number = 1, limit: number = 20) {
        try {
            const offset = (page - 1) * limit;
            const [bookmarks, total] = await Promise.all([
                this.repository.listBookmarksWithQuestions(accountId, workspaceId, { limit, offset }),
                this.repository.countBookmarks(accountId, workspaceId)
            ]);

            return {
                success: true,
                data: {
                    bookmarks,
                    pagination: {
                        page,
                        limit,
                        total,
                        totalPages: Math.ceil(total / limit)
                    }
                }
            };
        } catch (error) {
            this.handleError(error, "getBookmarksContext");
            return { success: false, error: "Failed to load bookmarks context" };
        }
    }

    async addBookmark(data: { accountId: string; questionId: string; workspaceId: string }) {
        try {
            // Check if already bookmarked
            const existing = await this.repository.findBookmark(data.accountId, data.questionId);
            if (existing) {
                return { success: false, error: "Already bookmarked", code: "ALREADY_BOOKMARKED" };
            }

            const bookmark = await this.repository.addBookmark(data);
            return { success: true, data: bookmark[0] };
        } catch (error) {
            this.handleError(error, "addBookmark");
            return { success: false, error: "Failed to add bookmark" };
        }
    }

    async removeBookmark(accountId: string, questionId: string) {
        try {
            const deleted = await this.repository.deleteBookmark(accountId, questionId);
            if (!deleted.length) {
                return { success: false, error: "Bookmark not found", code: "BOOKMARK_NOT_FOUND" };
            }
            return { success: true, data: deleted[0] };
        } catch (error) {
            this.handleError(error, "removeBookmark");
            return { success: false, error: "Failed to remove bookmark" };
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

    async getPublicProviderStats() {
        try {
            const [total, withLocation] = await Promise.all([
                this.repository.countActiveProviders(),
                this.repository.countActiveProvidersWithLocation()
            ]);

            return {
                success: true,
                data: {
                    total,
                    active: total,
                    withLocation
                }
            };
        } catch (error) {
            this.handleError(error, "getPublicProviderStats");
            return { success: false, error: "Failed to load provider stats" };
        }
    }
}
