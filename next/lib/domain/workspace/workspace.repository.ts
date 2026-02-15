
import { eq, ne, and, desc, asc, sql, count } from "drizzle-orm";
import { workspaces, workspaceAccesses, users, accounts, workspaceInvitations } from "@/lib/database/schema";
import { BaseRepository } from "../base/base.repository";
import { type DbClient } from "@/lib/database";
import { type ProviderListOptions } from "./workspace.types";

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

    async listProviders(options: ProviderListOptions = {}, tx?: DbClient) {
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
     * Includes both target workspaces (provider, staff) AND via workspaces (student personal).
     * Uses UNION to collect all unique workspace IDs from both columns.
     */
    async listUserWorkspaces(accountId: string, tx?: DbClient) {
        const client = tx ?? this.db;

        // Get all unique workspace IDs from both target_workspace_id and via_workspace_id
        const wsIds = await client
            .selectDistinct({ id: workspaceAccesses.targetWorkspaceId })
            .from(workspaceAccesses)
            .where(eq(workspaceAccesses.actorAccountId, accountId));

        const viaIds = await client
            .selectDistinct({ id: workspaceAccesses.viaWorkspaceId })
            .from(workspaceAccesses)
            .where(eq(workspaceAccesses.actorAccountId, accountId));

        // Merge and deduplicate
        const allIds = [...new Set([
            ...wsIds.map(r => r.id).filter(Boolean),
            ...viaIds.map(r => r.id).filter(Boolean),
        ])] as string[];

        if (allIds.length === 0) return [];

        // Fetch all workspaces by collected IDs
        const result = await client
            .select()
            .from(workspaces)
            .where(sql`${workspaces.id} IN (${sql.join(allIds.map(id => sql`${id}`), sql`, `)})`);

        return result;
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

    /**
     * Lists enrolled students (linked access) for a provider workspace.
     * Linked access: targetWorkspaceId = providerWorkspaceId, viaWorkspaceId != targetWorkspaceId
     */
    async listEnrolledStudents(
        providerWorkspaceId: string,
        params: { limit: number; offset: number } = { limit: 20, offset: 0 },
        tx?: DbClient
    ) {
        const client = tx ?? this.db;

        // Linked access: target = provider, via != target (student's own workspace)
        const linkedAccessFilter = and(
            eq(workspaceAccesses.targetWorkspaceId, providerWorkspaceId),
            ne(workspaceAccesses.viaWorkspaceId, workspaceAccesses.targetWorkspaceId)
        );

        const [countResult] = await client
            .select({ total: count() })
            .from(workspaceAccesses)
            .where(linkedAccessFilter);

        const total = countResult?.total ?? 0;

        const rows = await client
            .select({
                accessId: workspaceAccesses.id,
                accountId: workspaceAccesses.actorAccountId,
                targetWorkspaceId: workspaceAccesses.targetWorkspaceId,
                accessRole: workspaceAccesses.accessRole,
                subscribedUntil: workspaceAccesses.subscribedUntil,
                enrolledAt: workspaceAccesses.createdAt,
                userId: users.id,
                email: users.email,
                phone: users.phone,
                firstName: users.firstName,
                lastName: users.lastName,
                userCreatedAt: users.createdAt,
            })
            .from(workspaceAccesses)
            .innerJoin(accounts, eq(workspaceAccesses.actorAccountId, accounts.id))
            .innerJoin(users, eq(accounts.userId, users.id))
            .where(linkedAccessFilter)
            .orderBy(desc(workspaceAccesses.createdAt))
            .limit(params.limit)
            .offset(params.offset);

        return {
            students: rows.map(row => ({
                id: row.userId,
                accountId: row.accountId,
                accessId: row.accessId,
                email: row.email,
                phone: row.phone,
                fullName: [row.firstName, row.lastName].filter(Boolean).join(' ') || null,
                firstName: row.firstName,
                lastName: row.lastName,
                createdAt: row.userCreatedAt?.toISOString(),
                enrolledAt: row.enrolledAt?.toISOString(),
                accessRole: row.accessRole,
                subscribedUntil: row.subscribedUntil?.toISOString(),
                targetWorkspaceId: row.targetWorkspaceId,
            })),
            total,
            totalPages: Math.ceil(total / params.limit),
        };
    }

    /**
     * Lists direct members (direct access) of a workspace.
     * Direct access: targetWorkspaceId === viaWorkspaceId (member of this workspace)
     */
    async listDirectMembers(
        workspaceId: string,
        params: { limit: number; offset: number } = { limit: 20, offset: 0 },
        tx?: DbClient
    ) {
        const client = tx ?? this.db;

        // Direct access: target = via = workspaceId
        const directAccessFilter = and(
            eq(workspaceAccesses.targetWorkspaceId, workspaceId),
            eq(workspaceAccesses.viaWorkspaceId, workspaceId)
        );

        const [countResult] = await client
            .select({ total: count() })
            .from(workspaceAccesses)
            .where(directAccessFilter);

        console.log(`[WorkspaceRepository] listDirectMembers workspaceId=${workspaceId} count=${countResult?.total}`);

        const total = countResult?.total ?? 0;

        const rows = await client
            .select({
                accessId: workspaceAccesses.id,
                accountId: workspaceAccesses.actorAccountId,
                accessRole: workspaceAccesses.accessRole,
                createdAt: workspaceAccesses.createdAt,
                userId: users.id,
                email: users.email,
                phone: users.phone,
                firstName: users.firstName,
                lastName: users.lastName,
            })
            .from(workspaceAccesses)
            .leftJoin(accounts, eq(workspaceAccesses.actorAccountId, accounts.id))
            .leftJoin(users, eq(accounts.userId, users.id))
            .where(directAccessFilter)
            .orderBy(desc(workspaceAccesses.createdAt))
            .limit(params.limit)
            .offset(params.offset);

        return {
            members: rows.map(row => ({
                id: row.userId || 'unknown',
                accountId: row.accountId || 'unknown',
                accessId: row.accessId,
                email: row.email || 'no-email',
                phone: row.phone || 'no-phone',
                firstName: row.firstName || 'Unknown',
                lastName: row.lastName || '',
                accessRole: row.accessRole,
                createdAt: row.createdAt?.toISOString(),
            })),
            total,
            totalPages: Math.ceil(total / params.limit),
        };
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

    // ═══════════════════════════════════════════════════════════════
    // STAFF PROVIDER MANAGEMENT
    // ═══════════════════════════════════════════════════════════════

    /**
     * List ALL provider workspaces (active + inactive) for staff console
     */
    async listAllProviders(options: { page?: number; pageSize?: number; search?: string; searchType?: string } = {}, tx?: DbClient) {
        const client = tx ?? this.db;
        const page = options.page || 1;
        const pageSize = options.pageSize || 10;
        const offset = (page - 1) * pageSize;

        const conditions: ReturnType<typeof eq>[] = [eq(workspaces.type, 'provider')];

        if (options.search) {
            if (options.searchType === 'description') {
                conditions.push(sql`(${workspaces.profile}->>'providerProgramDescription' ILIKE ${'%' + options.search + '%'})`);
            } else {
                conditions.push(sql`(${workspaces.title} ILIKE ${'%' + options.search + '%'})`);
            }
        }

        const countResult = await client
            .select({ total: count() })
            .from(workspaces)
            .where(and(...conditions));
        const total = Number(countResult[0]?.total || 0);

        const data = await client
            .select()
            .from(workspaces)
            .where(and(...conditions))
            .limit(pageSize)
            .offset(offset)
            .orderBy(desc(workspaces.createdAt));

        return { data, total, page, pageSize };
    }

    /**
     * List provider applications (inactive/blocked provider workspaces)
     */
    async listProviderApplications(options: { page?: number; pageSize?: number; search?: string } = {}, tx?: DbClient) {
        const client = tx ?? this.db;
        const page = options.page || 1;
        const pageSize = options.pageSize || 10;
        const offset = (page - 1) * pageSize;

        const conditions: ReturnType<typeof eq>[] = [
            eq(workspaces.type, 'provider'),
            eq(workspaces.isActive, false),
        ];

        if (options.search) {
            conditions.push(sql`(${workspaces.title} ILIKE ${'%' + options.search + '%'})`);
        }

        const countResult = await client
            .select({ total: count() })
            .from(workspaces)
            .where(and(...conditions));
        const total = Number(countResult[0]?.total || 0);

        const data = await client
            .select()
            .from(workspaces)
            .where(and(...conditions))
            .limit(pageSize)
            .offset(offset)
            .orderBy(desc(workspaces.createdAt));

        return { applications: data, total, page, pageSize };
    }

    /**
     * Delete a workspace by ID
     */
    async deleteWorkspace(id: string, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client
            .delete(workspaces)
            .where(eq(workspaces.id, id))
            .returning();
        return result[0] || null;
    }

    // ═══════════════════════════════════════════════════════════════
    // INVITATIONS
    // ═══════════════════════════════════════════════════════════════

    async createInvitation(data: typeof workspaceInvitations.$inferInsert, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client.insert(workspaceInvitations).values(data).returning();
        return result[0];
    }

    async findInvitation(id: string, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client
            .select()
            .from(workspaceInvitations)
            .where(eq(workspaceInvitations.id, id))
            .limit(1);
        return result[0] || null;
    }

    async updateInvitation(id: string, data: Partial<typeof workspaceInvitations.$inferInsert>, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client
            .update(workspaceInvitations)
            .set(data)
            .where(eq(workspaceInvitations.id, id))
            .returning();
        return result[0];
    }

    async listInvitationsForAccount(accountId: string, tx?: DbClient) {
        const client = tx ?? this.db;
        return await client
            .select({
                invitation: workspaceInvitations,
                workspace: workspaces,
                invitedBy: {
                    firstName: users.firstName,
                    lastName: users.lastName,
                    email: users.email
                }
            })
            .from(workspaceInvitations)
            .innerJoin(workspaces, eq(workspaceInvitations.forWorkspaceId, workspaces.id))
            .leftJoin(accounts, eq(workspaceInvitations.invitedByAccountId, accounts.id))
            .leftJoin(users, eq(accounts.userId, users.id))
            .where(and(
                eq(workspaceInvitations.invitedAccountId, accountId),
                eq(workspaceInvitations.isApproved, false),
                eq(workspaceInvitations.isDeclined, false)
            ))
            .orderBy(desc(workspaceInvitations.createdAt));
    }

    async findAccountByEmail(email: string, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client
            .select({
                id: accounts.id,
                userId: users.id,
                email: users.email,
                firstName: users.firstName,
                lastName: users.lastName
            })
            .from(users)
            .innerJoin(accounts, eq(users.id, accounts.userId))
            .where(eq(users.email, email))
            .limit(1);
        return result[0] || null;
    }
}
