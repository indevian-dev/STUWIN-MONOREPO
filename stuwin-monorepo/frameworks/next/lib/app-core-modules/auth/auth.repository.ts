import { eq, or, sql, and, ne } from "drizzle-orm";
import { users, accounts, workspaces, workspaceAccesses, userCredentials, workspaceRoles } from "@/lib/app-infrastructure/database/schema";
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

    async deleteUser(id: string, tx?: DbClient) {
        const client = tx ?? this.db;

        // 1. Disconnect accounts (set userId = null)
        const updatedAccounts = await client
            .update(accounts)
            .set({ userId: null, updatedAt: new Date() })
            .where(eq(accounts.userId, id))
            .returning();

        // 2. Delete user
        const deletedUser = await client
            .delete(users)
            .where(eq(users.id, id))
            .returning();

        return {
            deletedUser: deletedUser[0] || null,
            disconnectedAccounts: updatedAccounts.length
        };
    }

    async listUsersWithAccounts(params: { limit: number; offset: number }, tx?: DbClient) {
        const client = tx ?? this.db;

        // Fetch users first
        const usersList = await client
            .select()
            .from(users)
            .limit(params.limit)
            .offset(params.offset);

        if (usersList.length === 0) return [];

        const userIds = usersList.map(u => u.id);

        // Fetch accounts for these users
        const accountsList = await client
            .select()
            .from(accounts)
            .where(require("drizzle-orm").inArray(accounts.userId, userIds));

        // Group accounts by user ID
        const accountsMap = new Map<string, typeof accounts.$inferSelect[]>();
        accountsList.forEach(acc => {
            if (acc.userId) {
                const existing = accountsMap.get(acc.userId) || [];
                existing.push(acc);
                accountsMap.set(acc.userId, existing);
            }
        });

        // Combine
        return usersList.map(user => ({
            ...user,
            accounts: accountsMap.get(user.id) || []
        }));
    }

    async countUsers(tx?: DbClient) {
        const client = tx ?? this.db;
        const { count } = require("drizzle-orm");
        const result = await client.select({ count: count() }).from(users);
        return result[0].count;
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
        return result[0] || null;
    }

    async findAccountsByUserId(userId: string, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client
            .select()
            .from(accounts)
            .where(eq(accounts.userId, userId));
        return result;
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
     * Lists all workspaces owned by or accessible to the account
     */
    async listWorkspacesByAccountId(accountId: string, tx?: DbClient) {
        const client = tx ?? this.db;

        // Unified list via workspaceAccesses
        // Includes: Direct Ownership (viaWorkspace=targetWorkspace, Role=Manager/Student)
        // Includes: Membership (viaWorkspace=SomethingElse, or just direct access to other workspaces)

        const accesses = await client
            .selectDistinct({ // Distinct in case of multiple access paths? Accesses should be unique by actor-target pair ideally.
                workspace: workspaces,
                access: workspaceAccesses
            })
            .from(workspaceAccesses)
            .innerJoin(workspaces, eq(workspaceAccesses.targetWorkspaceId, workspaces.id))
            .where(eq(workspaceAccesses.actorAccountId, accountId));

        // Separating "Owned" vs "Connected" based on 'manager' role or 'student' role in 'student' workspace type?
        // Logic: 
        // Owned: Where you have 'manager' role on the workspace AND it's direct access? 
        // Or strictly separate by Type?
        // Let's mimic old behavior: Owned = Primary workspaces you created. Connected = Workspaces you access via others?

        // Actually, let's just return all as "available" workspaces.
        // But the Service separates them.

        // Let's loosely define "Owned" as: AccessRole = 'manager' OR (Role='student' AND WorkspaceType='student' and Via=Target)

        const owned: typeof workspaces.$inferSelect[] = [];
        const connected: any[] = [];

        accesses.forEach(({ workspace, access }) => {
            const isDirect = access.viaWorkspaceId === access.targetWorkspaceId;
            const isOwner = access.accessRole === 'manager' && isDirect;
            const isStudentOwner = access.accessRole === 'student' && workspace.type === 'student' && isDirect;
            const isParentOwner = access.accessRole === 'manager' && workspace.type === 'parent' && isDirect; // Parent Dashboard Owner

            if (isOwner || isStudentOwner || isParentOwner) {
                owned.push(workspace);
            } else {
                connected.push({
                    ...workspace,
                    relationType: access.accessRole // Map accessRole to relationType for compatibility
                });
            }
        });

        return {
            owned, // Primary Workspaces (e.g. your Student Account, your Parent Dashboard, your School Admin)
            connected // Linked Workspaces (e.g. School you are enrolled in, Student you monitor)
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

    async findUserByPhone(phone: string, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client
            .select({
                user: users,
                credentials: userCredentials
            })
            .from(users)
            .leftJoin(userCredentials, eq(users.id, userCredentials.id))
            .where(eq(users.phone, phone))
            .limit(1);

        if (!result[0]) return null;

        return {
            ...result[0].user,
            password: result[0].credentials?.password,
        };
    }

    async createUserWithAccount(params: {
        id: string;
        email: string;
        phone: string | null;
        firstName: string;
        lastName?: string;
        passwordHash: string;
        sessionsGroupId: string;
        accountId: string;
        workspaceId: string;
    }, tx?: DbClient) {
        const client = tx ?? this.db;

        return await client.transaction(async (trx) => {
            // 1. Create User
            const [user] = await trx.insert(users).values({
                id: params.id,
                email: params.email,
                phone: params.phone,
                firstName: params.firstName,
                lastName: params.lastName,
                sessionsGroupId: params.sessionsGroupId,
                emailIsVerified: false,
                phoneIsVerified: false,
            }).returning();

            // 2. Create Credentials
            await trx.insert(userCredentials).values({
                id: params.id,
                password: params.passwordHash,
            });

            // 3. Create Account
            const [account] = await trx.insert(accounts).values({
                id: params.accountId,
                userId: params.id,
            }).returning();

            // 4. (Removed) Personal Workspace creation.
            return { user, account, workspace: null };
        });
    }

    async findUserWithAccountByContact(contact: { email?: string; phone?: string }, tx?: DbClient) {
        const client = tx ?? this.db;
        const condition = contact.email
            ? eq(users.email, contact.email)
            : eq(users.phone, contact.phone!);

        const result = await client
            .select({
                user: users,
                account: accounts
            })
            .from(users)
            .leftJoin(accounts, eq(users.id, accounts.userId))
            .where(condition)
            .limit(1);

        if (!result[0]) return null;
        return {
            ...result[0].user,
            accountId: result[0].account?.id
        };
    }

    async updateUserPassword(userId: string, passwordHash: string, tx?: DbClient) {
        const client = tx ?? this.db;
        return await client
            .update(userCredentials)
            .set({ password: passwordHash })
            .where(eq(userCredentials.id, userId))
            .returning();
    }

    async findAccountProfile(accountId: string, workspaceId?: string, tx?: DbClient) {
        const client = tx ?? this.db;

        const query = client
            .select({
                account: accounts,
                user: users,
                role: workspaceRoles,
                access: workspaceAccesses
            })
            .from(accounts)
            .innerJoin(users, eq(accounts.userId, users.id))
            .leftJoin(workspaceAccesses, and(
                eq(workspaceAccesses.actorAccountId, accounts.id),
                workspaceId ? eq(workspaceAccesses.targetWorkspaceId, workspaceId) : sql`FALSE`
            ))
            .leftJoin(workspaceRoles, eq(workspaceAccesses.accessRole, workspaceRoles.name))
            .where(eq(accounts.id, accountId))
            .limit(1);

        const result = await query;
        return result[0] || null;
    }

    async checkContactAvailability(params: { email?: string; phone?: string; excludeUserId: string }, tx?: DbClient) {
        const client = tx ?? this.db;
        const conditions = [];
        if (params.email) {
            conditions.push(and(eq(users.email, params.email), eq(users.emailIsVerified, true), ne(users.id, params.excludeUserId)));
        }
        if (params.phone) {
            conditions.push(and(eq(users.phone, params.phone), eq(users.emailIsVerified, true), ne(users.id, params.excludeUserId)));
        }

        if (conditions.length === 0) return { emailTaken: false, phoneTaken: false };

        const result = await client
            .select({
                email: users.email,
                phone: users.phone,
            })
            .from(users)
            .where(or(...conditions));

        return {
            emailTaken: params.email ? result.some(u => u.email === params.email) : false,
            phoneTaken: params.phone ? result.some(u => u.phone === params.phone) : false,
        };
    }
}
