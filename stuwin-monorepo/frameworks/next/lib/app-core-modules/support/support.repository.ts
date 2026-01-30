
import { eq, and, desc } from "drizzle-orm";
import { accountNotifications, accountBookmarks, cities, countries } from "@/lib/app-infrastructure/database/schema";
import { BaseRepository } from "../domain/BaseRepository";
import { type DbClient } from "@/lib/app-infrastructure/database";

/**
 * SupportRepository - Handles notifications, bookmarks, cities, and countries
 */
export class SupportRepository extends BaseRepository {
    // ═══════════════════════════════════════════════════════════════
    // NOTIFICATIONS
    // ═══════════════════════════════════════════════════════════════

    async listNotifications(accountId: string, tx?: DbClient) {
        const client = tx ?? this.db;
        return await client
            .select()
            .from(accountNotifications)
            .where(eq(accountNotifications.accountId, accountId))
            .orderBy(desc(accountNotifications.createdAt));
    }

    async markNotificationRead(id: string, tx?: DbClient) {
        const client = tx ?? this.db;
        return await client
            .update(accountNotifications)
            .set({ markAsRead: true, updatedAt: new Date() })
            .where(eq(accountNotifications.id, id))
            .returning();
    }

    async createNotification(data: typeof accountNotifications.$inferInsert, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client.insert(accountNotifications).values(data).returning();
        return result[0];
    }

    // ═══════════════════════════════════════════════════════════════
    // BOOKMARKS
    // ═══════════════════════════════════════════════════════════════

    async listBookmarks(accountId: string, workspaceId: string, tx?: DbClient) {
        const client = tx ?? this.db;
        return await client
            .select()
            .from(accountBookmarks)
            .where(
                and(
                    eq(accountBookmarks.accountId, accountId),
                    eq(accountBookmarks.workspaceId, workspaceId)
                )
            );
    }

    async addBookmark(data: typeof accountBookmarks.$inferInsert, tx?: DbClient) {
        const client = tx ?? this.db;
        return await client.insert(accountBookmarks).values(data).returning();
    }

    // ═══════════════════════════════════════════════════════════════
    // GEOGRAPHY
    // ═══════════════════════════════════════════════════════════════

    async listCountries(tx?: DbClient) {
        const client = tx ?? this.db;
        return await client.select().from(countries).orderBy(countries.name);
    }

    async listCitiesByCountry(countryId: string, tx?: DbClient) {
        const client = tx ?? this.db;
        return await client
            .select()
            .from(cities)
            .where(eq(cities.countryId, countryId))
            .orderBy(cities.title);
    }
}
