
import { eq, and, desc, asc, sql } from "drizzle-orm";
import { workspaces, workspaceToWorkspace, users, accounts } from "@/lib/app-infrastructure/database/schema";
import { BaseRepository } from "../domain/BaseRepository";
import { type DbClient } from "@/lib/app-infrastructure/database";

/**
 * WorkspaceRepository - Handles database operations for Workspaces and the W2W Graph
 */
export class WorkspaceRepository extends BaseRepository {
    // ═══════════════════════════════════════════════════════════════
    // WORKSPACES
    // ═══════════════════════════════════════════════════════════════

    async findById(id: string, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client
            .select()
            .from(workspaces)
            .where(eq(workspaces.id, id))
            .limit(1);
        return result[0] || null;
    }

    async findByOwnerId(ownerAccountId: string, tx?: DbClient) {
        const client = tx ?? this.db;
        return await client
            .select()
            .from(workspaces)
            .where(eq(workspaces.ownerAccountId, ownerAccountId));
    }

    async create(data: typeof workspaces.$inferInsert, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client.insert(workspaces).values(data).returning();
        return result[0];
    }

    async update(id: string, data: Partial<typeof workspaces.$inferInsert>, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client
            .update(workspaces)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(workspaces.id, id))
            .returning();
        return result[0];
    }

    async listProviders(options: {
        limit?: number;
        offset?: number;
        sortField?: string;
        orderDir?: 'asc' | 'desc';
    } = {}, tx?: DbClient) {
        const client = tx ?? this.db;
        const limit = options.limit || 24;
        const offset = options.offset || 0;

        let orderByClause = desc(workspaces.createdAt);
        if (options.sortField === 'title') {
            orderByClause = options.orderDir === 'asc' ? asc(workspaces.title) : desc(workspaces.title);
        }

        const whereClause = and(
            eq(workspaces.type, 'provider'),
            eq(workspaces.isActive, true)
        );

        const data = await client
            .select()
            .from(workspaces)
            .where(whereClause)
            .limit(limit)
            .offset(offset)
            .orderBy(orderByClause);

        return { data, total: data.length };
    }

    // ═══════════════════════════════════════════════════════════════
    // WORKSPACE GRAPH (CONNECTIONS)
    // ═══════════════════════════════════════════════════════════════

    /**
     * Finds a connection between two workspaces
     */
    async findConnection(fromWorkspaceId: string, toWorkspaceId: string, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client
            .select()
            .from(workspaceToWorkspace)
            .where(
                and(
                    eq(workspaceToWorkspace.fromWorkspaceId, fromWorkspaceId),
                    eq(workspaceToWorkspace.toWorkspaceId, toWorkspaceId)
                )
            )
            .limit(1);
        return result[0] || null;
    }

    /**
     * Connects two workspaces (e.g. Student -> School)
     */
    async connectWorkspaces(data: typeof workspaceToWorkspace.$inferInsert, tx?: DbClient) {
        const client = tx ?? this.db;
        // Upsert logic could be added here to handle existing connections
        const result = await client.insert(workspaceToWorkspace).values(data).returning();
        return result[0];
    }

    // ═══════════════════════════════════════════════════════════════
    // QUERIES
    // ═══════════════════════════════════════════════════════════════

    /**
     * Lists workspaces that are connected to the user's "Home Base" (if applicable)
     * Or simply lists workspaces owned by the user for the dashboard
     */
    /**
     * Lists all workspaces the account has access to.
     * Includes workspaces they own AND workspaces they are members of (linked via W2W).
     */
    async listUserWorkspaces(accountId: string, tx?: DbClient) {
        const client = tx ?? this.db;

        // 1. Get workspaces where user is the primary owner
        const owned = await client
            .select()
            .from(workspaces)
            .where(eq(workspaces.ownerAccountId, accountId));

        // 2. Get workspaces where user has a membership link (W2W connection)
        const memberships = await client
            .select({
                workspace: workspaces
            })
            .from(workspaceToWorkspace)
            .innerJoin(workspaces, eq(workspaceToWorkspace.toWorkspaceId, workspaces.id))
            .where(eq(workspaceToWorkspace.accountId, accountId));

        // Combine and de-duplicate by ID
        const allWorkspaces = [...owned];
        const ownedIds = new Set(allWorkspaces.map(w => w.id));

        for (const item of memberships) {
            if (!ownedIds.has(item.workspace.id)) {
                allWorkspaces.push(item.workspace);
            }
        }

        return allWorkspaces;
    }

    /**
     * Lists workspaces that the given workspace has access to (e.g. Student -> Schools)
     */
    async listConnectedWorkspaces(fromWorkspaceId: string, relationType?: string, tx?: DbClient) {
        const client = tx ?? this.db;

        const conditions = [eq(workspaceToWorkspace.fromWorkspaceId, fromWorkspaceId)];

        if (relationType) {
            conditions.push(eq(workspaceToWorkspace.relationType, relationType));
        }

        return await client
            .select({
                connection: workspaceToWorkspace,
                workspace: workspaces
            })
            .from(workspaceToWorkspace)
            .innerJoin(workspaces, eq(workspaceToWorkspace.toWorkspaceId, workspaces.id))
            .where(and(...conditions));
    }

    /**
     * Finds workspaces of type student for a child identified by FIN
     */
    async findStudentWorkspacesByChildFin(fin: string, tx?: DbClient) {
        const client = tx ?? this.db;
        return await client
            .select({
                workspaceId: workspaces.id,
                workspaceTitle: workspaces.title,
                studentName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`
            })
            .from(workspaces)
            .innerJoin(accounts, eq(workspaces.ownerAccountId, accounts.id))
            .innerJoin(users, eq(accounts.userId, users.id))
            .where(
                and(
                    eq(users.fin, fin),
                    eq(workspaces.type, 'student')
                )
            );
    }
}
