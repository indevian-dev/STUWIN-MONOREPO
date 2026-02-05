
import { eq, and, desc, asc, sql, count } from "drizzle-orm";
import { workspaces, workspaceAccesses, users, accounts } from "@/lib/app-infrastructure/database/schema";
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

    // Deprecated? Workspaces don't have ownerId anymore. Used via Access.
    // Kept for specific logic if needed, but implementation changes to query access.
    async findByOwnerId(ownerAccountId: string, tx?: DbClient) {
        const client = tx ?? this.db;
        // Find workspaces where account has 'owner' or 'manager' role directly
        return await client
            .select({
                workspace: workspaces
            })
            .from(workspaceAccesses)
            .innerJoin(workspaces, eq(workspaceAccesses.targetWorkspaceId, workspaces.id))
            .where(and(
                eq(workspaceAccesses.actorAccountId, ownerAccountId),
                eq(workspaceAccesses.viaWorkspaceId, workspaces.id) // Direct access
            ))
            .then(res => res.map(r => r.workspace));
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
        search?: string;
    } = {}, tx?: DbClient) {
        const client = tx ?? this.db;
        const limit = options.limit || 100;
        const offset = options.offset || 0;

        let orderByClause = desc(workspaces.createdAt);
        if (options.sortField === 'title') {
            orderByClause = options.orderDir === 'asc' ? asc(workspaces.title) : desc(workspaces.title);
        } else if (options.sortField === 'price') {
            const pricePath = sql<number>`(${workspaces.profile}->>'providerSubscriptionPrice')::numeric`;
            orderByClause = options.orderDir === 'asc' ? asc(pricePath) : desc(pricePath);
        }

        const conditions = [
            eq(workspaces.type, 'provider'),
            eq(workspaces.isActive, true)
        ];

        if (options.search) {
            conditions.push(sql`(${workspaces.title} ILIKE ${'%' + options.search + '%'})`);
        }

        // Fetch total count for pagination
        const countQuery = await client
            .select({ total: count() })
            .from(workspaces)
            .where(and(...conditions));
        const total = Number(countQuery[0]?.total || 0);

        const data = await client
            .select()
            .from(workspaces)
            .where(and(...conditions))
            .limit(limit)
            .offset(offset)
            .orderBy(orderByClause);

        return { data, total };
    }

    // ═══════════════════════════════════════════════════════════════
    // ACCESS & MEMBERSHIP (Replaces Graph)
    // ═══════════════════════════════════════════════════════════════

    /**
     * Check if access already exists
     */
    async findAccess(actorAccountId: string, targetWorkspaceId: string, viaWorkspaceId?: string, tx?: DbClient) {
        const client = tx ?? this.db;
        const conditions = [
            eq(workspaceAccesses.actorAccountId, actorAccountId),
            eq(workspaceAccesses.targetWorkspaceId, targetWorkspaceId)
        ];

        if (viaWorkspaceId) {
            conditions.push(eq(workspaceAccesses.viaWorkspaceId, viaWorkspaceId));
        }

        const result = await client
            .select()
            .from(workspaceAccesses)
            .where(and(...conditions))
            .limit(1);
        return result[0] || null;
    }

    /**
     * Grants access (Membership / Enrollment)
     */
    async addAccess(data: typeof workspaceAccesses.$inferInsert, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client.insert(workspaceAccesses).values(data).returning();
        return result[0];
    }

    // ═══════════════════════════════════════════════════════════════
    // QUERIES
    // ═══════════════════════════════════════════════════════════════

    /**
     * Lists all workspaces the account has access to.
     * Unified query via workspace_accesses.
     */
    async listUserWorkspaces(accountId: string, tx?: DbClient) {
        const client = tx ?? this.db;

        // JOIN workspace_accesses -> workspaces
        // We want unique workspaces.
        const result = await client
            .selectDistinct({
                workspace: workspaces
            })
            .from(workspaceAccesses)
            .innerJoin(workspaces, eq(workspaceAccesses.targetWorkspaceId, workspaces.id))
            .where(eq(workspaceAccesses.actorAccountId, accountId));

        return result.map(r => r.workspace);
    }

    /**
     * Finds student workspaces for a child identified by FIN
     * Logic: User(Child) -> Account -> Access(Direct to StudentNode) -> Workspace
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
            .innerJoin(workspaceAccesses, eq(workspaceAccesses.targetWorkspaceId, workspaces.id)) // From Access
            .innerJoin(accounts, eq(workspaceAccesses.actorAccountId, accounts.id)) // To Account
            .innerJoin(users, eq(accounts.userId, users.id)) // To User
            .where(
                and(
                    eq(users.fin, fin),
                    eq(workspaces.type, 'student'),
                    eq(workspaceAccesses.viaWorkspaceId, workspaces.id) // Direct Owner Access
                )
            );
    }

    async findEnrolledAccesses(accountId: string, tx?: DbClient) {
        const client = tx ?? this.db;
        return await client
            .select({
                access: workspaceAccesses,
                workspace: workspaces
            })
            .from(workspaceAccesses)
            .innerJoin(workspaces, eq(workspaceAccesses.targetWorkspaceId, workspaces.id))
            .where(and(
                eq(workspaceAccesses.actorAccountId, accountId),
                eq(workspaces.type, 'provider')
            ));
    }

    async listConnections(viaWorkspaceId: string, tx?: DbClient) {
        const client = tx ?? this.db;
        return await client
            .select({
                connection: workspaceAccesses,
                workspace: workspaces
            })
            .from(workspaceAccesses)
            .innerJoin(workspaces, eq(workspaceAccesses.targetWorkspaceId, workspaces.id))
            .where(eq(workspaceAccesses.viaWorkspaceId, viaWorkspaceId));
    }
}
