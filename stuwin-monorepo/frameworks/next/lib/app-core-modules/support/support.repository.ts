
import { eq, and, desc, sql, count } from "drizzle-orm";
import { accountNotifications, accountBookmarks, cities, countries, providerQuestions as questionsTable } from "@/lib/app-infrastructure/database/schema";
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

    async listNotificationsPaginated(accountId: string, options: { limit: number; offset: number }, tx?: DbClient) {
        const client = tx ?? this.db;
        return await client
            .select()
            .from(accountNotifications)
            .where(eq(accountNotifications.accountId, accountId))
            .orderBy(desc(accountNotifications.createdAt))
            .limit(options.limit)
            .offset(options.offset);
    }

    async countNotifications(accountId: string, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client
            .select({ count: count() })
            .from(accountNotifications)
            .where(eq(accountNotifications.accountId, accountId));
        return Number(result[0]?.count || 0);
    }

    async countUnreadNotifications(accountId: string, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client
            .select({ count: count() })
            .from(accountNotifications)
            .where(
                and(
                    eq(accountNotifications.accountId, accountId),
                    eq(accountNotifications.markAsRead, false)
                )
            );
        return Number(result[0]?.count || 0);
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

    async listBookmarksWithQuestions(accountId: string, workspaceId: string, options: { limit: number; offset: number }, tx?: DbClient) {
        const client = tx ?? this.db;
        return await client
            .select({
                bookmark: accountBookmarks,
                question: questionsTable
            })
            .from(accountBookmarks)
            .leftJoin(questionsTable, eq(accountBookmarks.questionId, questionsTable.id))
            .where(
                and(
                    eq(accountBookmarks.accountId, accountId),
                    eq(accountBookmarks.workspaceId, workspaceId)
                )
            )
            .orderBy(desc(accountBookmarks.createdAt))
            .limit(options.limit)
            .offset(options.offset);
    }

    async countBookmarks(accountId: string, workspaceId: string, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client
            .select({ count: sql<number>`count(*)` })
            .from(accountBookmarks)
            .where(
                and(
                    eq(accountBookmarks.accountId, accountId),
                    eq(accountBookmarks.workspaceId, workspaceId)
                )
            );
        return Number(result[0]?.count || 0);
    }

    async findBookmark(accountId: string, questionId: string, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client
            .select()
            .from(accountBookmarks)
            .where(
                and(
                    eq(accountBookmarks.accountId, accountId),
                    eq(accountBookmarks.questionId, questionId)
                )
            )
            .limit(1);
        return result[0];
    }

    async deleteBookmark(accountId: string, questionId: string, tx?: DbClient) {
        const client = tx ?? this.db;
        return await client
            .delete(accountBookmarks)
            .where(
                and(
                    eq(accountBookmarks.accountId, accountId),
                    eq(accountBookmarks.questionId, questionId)
                )
            )
            .returning();
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

    async listAllCities(tx?: DbClient) {
        const client = tx ?? this.db;
        return await client.select().from(cities).orderBy(cities.title);
    }

    // ═══════════════════════════════════════════════════════════════
    // WORKSPACE STATS
    // ═══════════════════════════════════════════════════════════════

    async countActiveProviders(tx?: DbClient) {
        const client = tx ?? this.db;
        const { workspaces } = require("@/lib/app-infrastructure/database/schema");
        const { and, eq, count } = require("drizzle-orm");

        const result = await client
            .select({ value: count() })
            .from(workspaces)
            .where(
                and(
                    eq(workspaces.type, 'provider'),
                    eq(workspaces.isActive, true)
                )
            );
        return result[0]?.value || 0;
    }

    async countActiveProvidersWithLocation(tx?: DbClient) {
        const client = tx ?? this.db;
        const { workspaces } = require("@/lib/app-infrastructure/database/schema");
        const { and, eq, count, isNotNull } = require("drizzle-orm");

        const result = await client
            .select({ value: count() })
            .from(workspaces)
            .where(
                and(
                    eq(workspaces.type, 'provider'),
                    eq(workspaces.isActive, true),
                    isNotNull(workspaces.cityId)
                )
            );
        return result[0]?.value || 0;
    }
}
