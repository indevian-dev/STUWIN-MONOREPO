
import { eq, or, sql } from "drizzle-orm";
import { users, accounts, workspaces, workspaceToWorkspace, userCredentials } from "@/lib/app-infrastructure/database/schema";
import { BaseRepository } from "../domain/BaseRepository";
import { type DbClient } from "@/lib/app-infrastructure/database";

/**
 * AuthRepository - Handles database operations for Users and Accounts
 */
export class AuthRepository extends BaseRepository {
    // ═══════════════════════════════════════════════════════════════
    // USERS
    // ═══════════════════════════════════════════════════════════════

    async findUserByEmail(email: string, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client
            .select({
                user: users,
                credentials: userCredentials
            })
            .from(users)
            .leftJoin(userCredentials, eq(users.id, userCredentials.id))
            .where(eq(users.email, email))
            .limit(1);

        if (!result[0]) return null;

        return {
            ...result[0].user,
            password: result[0].credentials?.password,
            facebookId: result[0].credentials?.facebookId,
            googleId: result[0].credentials?.googleId,
            appleId: result[0].credentials?.appleId,
        };
    }

    async findUserById(id: string, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client
            .select({
                user: users,
                credentials: userCredentials
            })
            .from(users)
            .leftJoin(userCredentials, eq(users.id, userCredentials.id))
            .where(eq(users.id, id))
            .limit(1);

        if (!result[0]) return null;

        return {
            ...result[0].user,
            password: result[0].credentials?.password,
            facebookId: result[0].credentials?.facebookId,
            googleId: result[0].credentials?.googleId,
            appleId: result[0].credentials?.appleId,
        };
    }

    async checkUserExists(email?: string, phone?: string, tx?: DbClient) {
        const client = tx ?? this.db;
        const conditions = [];
        if (email) conditions.push(eq(users.email, email));
        if (phone) conditions.push(eq(users.phone, phone));

        if (conditions.length === 0) return { emailExists: false, phoneExists: false };

        const result = await client
            .select({
                email: users.email,
                phone: users.phone,
            })
            .from(users)
            .where(or(...conditions));

        return {
            emailExists: result.some((u) => u.email === email),
            phoneExists: result.some((u) => u.phone === phone),
        };
    }

    async updateUser(id: string, data: Partial<typeof users.$inferInsert>, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client
            .update(users)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(users.id, id))
            .returning();
        return result[0] || null;
    }

    // ═══════════════════════════════════════════════════════════════
    // ACCOUNTS
    // ═══════════════════════════════════════════════════════════════

    async findAccountByUserId(userId: string, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client
            .select({
                id: accounts.id,
                userId: accounts.userId,
                suspended: accounts.suspended,
                createdAt: accounts.createdAt,
                updatedAt: accounts.updatedAt,
            })
            .from(accounts)
            .where(eq(accounts.userId, userId))
            .limit(1);

        return result[0] || null;
    }

    async findAccountById(id: string, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client
            .select()
            .from(accounts)
            .where(eq(accounts.id, id))
            .limit(1);
        return result[0] || null;
    }

    async updateAccount(id: string, data: Partial<typeof accounts.$inferInsert>, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client
            .update(accounts)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(accounts.id, id))
            .returning();
        return result[0] || null;
    }

    // ═══════════════════════════════════════════════════════════════
    // WORKSPACES & RELATIONS
    // ═══════════════════════════════════════════════════════════════

    /**
     * Lists all workspaces owned by or connected to the account
     */
    async listWorkspacesByAccountId(accountId: string, tx?: DbClient) {
        const client = tx ?? this.db;

        // 1. Get owned workspaces
        const owned = await client
            .select()
            .from(workspaces)
            .where(eq(workspaces.ownerAccountId, accountId));

        // 2. Get connected workspaces (via relations)
        // For each owned workspace, find what it's connected TO
        const ownedIds = owned.map(w => w.id);
        let connected: any[] = [];

        if (ownedIds.length > 0) {
            const relations = await client
                .select({
                    relationType: workspaceToWorkspace.relationType,
                    workspace: workspaces
                })
                .from(workspaceToWorkspace)
                .innerJoin(workspaces, eq(workspaces.id, workspaceToWorkspace.toWorkspaceId))
                .where(or(...ownedIds.map(id => eq(workspaceToWorkspace.fromWorkspaceId, id))));

            connected = relations.map(r => ({
                ...r.workspace,
                relationType: r.relationType
            }));
        }

        return {
            owned,
            connected
        };
    }

    async findWorkspaceById(id: string, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client
            .select()
            .from(workspaces)
            .where(eq(workspaces.id, id))
            .limit(1);
        return result[0] || null;
    }
}
