import { db } from "@/lib/app-infrastructure/database";
import { users, accounts, userCredentials, workspaces, workspaceAccesses, workspaceRoles } from "@/lib/app-infrastructure/database/schema";
import { eq, or, and, sql } from "drizzle-orm";
import {
  validatePassword,
  hashPassword,
  verifyPassword,
} from "@/lib/utils/passwordUtility";
import argon2 from "argon2";
import crypto from "crypto";
import { generateSlimId } from "@/lib/utils/slimUlidUtility";
import { ConsoleLogger } from "@/lib/app-infrastructure/loggers/ConsoleLogger";

interface Session {
  id: string;
  expires_at: number;
  account_id?: string;
  ip: string;
  user_agent: string;
  timestamp: number;
}

// ═══════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════

type LookupType =
  | "email_password"
  | "phone_password"
  | "user_id"
  | "account_id"
  | "email"
  | "phone";

interface UserLookupParams {
  type: LookupType;
  email?: string;
  phone?: string;
  password?: string;
  userId?: string;
  accountId?: string;
  workspaceId?: string; // Optional workspace context
}

export interface UserData {
  id: string;
  email: string;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  emailVerified: boolean | null;
  phoneVerified: boolean | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  sessions?: Record<string, Session> | null;
  password?: string | null;
  facebookId?: string | null;
  googleId?: string | null;
  appleId?: string | null;
  sessionsGroupId?: string | null;
}

export interface AccountData {
  id: string;
  userId: string | null;
  suspended: boolean | null;
  createdAt: Date;
  updatedAt: Date | null;
  // Workspace context (from accountWorkspaces table)
  workspaceType?: string | null;
  workspaceId?: string | null;
  isPersonal?: boolean | null;
  isStaff?: boolean | null;
  role?: string | null;
  roleName?: string | null;
  permissions?: string[] | null;
  subscriptionType?: string | null;
  subscribedUntil?: Date | null;
  workspaceSubscriptionType?: string | null;
  workspaceSubscribedUntil?: Date | null;
}

interface Permissions {
  permissions: string[];
  role_name: string | null;
}

interface AuthData {
  account: {
    id: string;
    user_id: string | null;
    is_personal: boolean | null;
    role: string | null;
    suspended: boolean | null;
    created_at: Date;
    updated_at: Date | null;
  } | null;
  user: {
    id: string;
    email: string;
    phone: string | null;
    firstName: string | null;
    last_name: string | null;
    avatar_url: string | null;
    emailVerified: boolean | null;
    phoneVerified: boolean | null;
    created_at: Date | null;
    updated_at: Date | null;
  } | null;
  permissions: Permissions;
  cached_at: number | null;
}

interface UserExistsResult {
  existingUser: {
    id: string;
    email: string;
    phone: string | null;
    fin?: string | null;
  } | null;
  existingUserConflicts: {
    emailExists?: boolean;
    emailUserId?: string;
    phoneExists?: boolean;
    phoneUserId?: string;
    finExists?: boolean;
    finUserId?: string;
  };
  error: string | null;
}

interface CreateUserParams {
  name?: string;
  email: string;
  password?: string;
  phone?: string;
  fin?: string;
  studentFin?: string;
  createProvider?: boolean;
  provider?: "google" | "facebook" | "apple";
  providerId?: string;
  providerData?: {
    name?: string;
    avatar_url?: string;
    last_name?: string;
  };
}

interface CreateUserResult {
  success: boolean;
  createdUser: UserData | null;
  createdAccount: AccountData | null;
  error: string | null;
}

export interface GetUserDataResult {
  user: UserData | null;
  account: AccountData | null;
  error: string | null;
}

interface CacheConfig {
  useRedis: boolean;
  redisTTL: number;
  cachePrefix: string;
}

interface RedisClient {
  get(key: string): Promise<string | null>;
  setex(key: string, ttl: number, value: string): Promise<string>;
  del(...keys: string[]): Promise<number>;
  keys(pattern: string): Promise<string[]>;
}

// ═══════════════════════════════════════════════════════════════
// CACHE CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const CACHE_CONFIG: CacheConfig = {
  useRedis: process.env.AUTH_CACHE_TYPE === "redis",
  redisTTL: 300,
  cachePrefix: "auth:user:",
};

let redisClient: RedisClient | null = null;

async function getRedisClient(): Promise<RedisClient | null> {
  if (!redisClient && CACHE_CONFIG.useRedis) {
    try {
      const redis = await import("@/lib/integrations/cacheRedis");
      redisClient = redis.default as RedisClient;
    } catch (error) {
      ConsoleLogger.error(
        "Redis client not available, falling back to no cache",
      );
      CACHE_CONFIG.useRedis = false;
    }
  }
  return redisClient;
}

// ═══════════════════════════════════════════════════════════════
// AUTH DATA HELPERS
// ═══════════════════════════════════════════════════════════════

export function createEmptyAuthData(): AuthData {
  return {
    account: null,
    user: null,
    permissions: { permissions: [], role_name: null },
    cached_at: null,
  };
}

// ═══════════════════════════════════════════════════════════════
// CACHE MANAGEMENT
// ═══════════════════════════════════════════════════════════════

export async function invalidateAccount({
  accountId,
}: {
  accountId: string;
}): Promise<boolean> {
  const cacheKey = `${CACHE_CONFIG.cachePrefix}${accountId}`;

  if (CACHE_CONFIG.useRedis) {
    try {
      const redis = await getRedisClient();
      if (redis) {
        await redis.del(cacheKey);
        ConsoleLogger.log(`🗑️ Redis: Cleared cache for account ${accountId}`);
      }
    } catch (error) {
      ConsoleLogger.error("Redis invalidation error:", error);
    }
  }
  return true;
}

export async function invalidateMultipleAccounts({
  accountIds,
}: {
  accountIds: string[];
}): Promise<boolean> {
  for (const accountId of accountIds) {
    await invalidateAccount({ accountId });
  }
  return true;
}

export async function invalidateByRole({
  roleName,
}: {
  roleName: string;
}): Promise<boolean> {
  try {
    ConsoleLogger.warn("invalidateByRole: Role invalidation not implemented for new schema");
    return false;
  } catch (error) {
    ConsoleLogger.error("Role invalidation error:", error);
    return false;
  }
}

export async function invalidateByUserId({
  userId,
}: {
  userId: string;
}): Promise<boolean> {
  try {
    const result = await db
      .select({ id: accounts.id })
      .from(accounts)
      .where(eq(accounts.userId, userId));

    const accountIds = result.map((a) => a.id);
    return await invalidateMultipleAccounts({ accountIds });
  } catch (error) {
    ConsoleLogger.error("User invalidation error:", error);
    return false;
  }
}

export async function clearAllCache(): Promise<void> {
  if (CACHE_CONFIG.useRedis) {
    try {
      const redis = await getRedisClient();
      if (redis) {
        const keys = await redis.keys(`${CACHE_CONFIG.cachePrefix}*`);
        if (keys.length > 0) {
          await redis.del(...keys);
          ConsoleLogger.log(
            `🗑️ Redis: Cleared ${keys.length} auth cache entries`,
          );
        }
      }
    } catch (error) {
      ConsoleLogger.error("Redis clear error:", error);
    }
  }
}

export function getCacheStatus(): { strategy: string; redisTTL: number } {
  return {
    strategy: CACHE_CONFIG.useRedis ? "redis" : "none",
    redisTTL: CACHE_CONFIG.redisTTL,
  };
}

// ═══════════════════════════════════════════════════════════════
// USER VERIFICATION
// ═══════════════════════════════════════════════════════════════

export async function verifyUserExists({
  email,
  phone,
  fin,
}: {
  email?: string;
  phone?: string;
  fin?: string;
}): Promise<UserExistsResult> {
  ConsoleLogger.log(`verifyUserExists:`, { email, phone, fin });

  try {
    if (!email && !phone && !fin) {
      return {
        existingUser: null,
        existingUserConflicts: {},
        error: "No verification criteria provided",
      };
    }

    const conditions = [];

    if (email) conditions.push(eq(users.email, email));
    if (phone) conditions.push(eq(users.phone, phone));
    if (fin) conditions.push(eq(users.fin, fin));

    if (conditions.length === 0) {
      return { existingUser: null, existingUserConflicts: {}, error: null };
    }

    const existingUserResult = await db
      .select({
        id: users.id,
        email: users.email,
        phone: users.phone,
        fin: users.fin
      })
      .from(users)
      .where(or(...conditions))
      .limit(1);

    const existingUser = existingUserResult[0] as
      | { id: string; email: string; phone: string | null; fin: string | null }
      | undefined;

    const conflicts: UserExistsResult["existingUserConflicts"] = {};

    if (existingUser) {
      if (email && existingUser.email === email) {
        conflicts.emailExists = true;
        conflicts.emailUserId = existingUser.id;
      }
      if (phone && existingUser.phone === phone) {
        conflicts.phoneExists = true;
        conflicts.phoneUserId = existingUser.id;
      }
      if (fin && existingUser.fin === fin) {
        conflicts.finExists = true;
        conflicts.finUserId = existingUser.id;
      }
    }

    return {
      existingUser: existingUser || null,
      existingUserConflicts: conflicts,
      error: null,
    };
  } catch (error) {
    const err = error as Error;
    return {
      existingUser: null,
      existingUserConflicts: {},
      error: err.message,
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// USER + ACCOUNT CREATION
// ═══════════════════════════════════════════════════════════════

const PROVIDER_ID_MAP: Record<string, string> = {
  google: "googleId",
  facebook: "facebookId",
  apple: "appleId",
};

export async function createUserWithAccount(
  params: CreateUserParams,
): Promise<CreateUserResult> {
  const {
    name, email, password, phone, provider, providerId, providerData = {},
  } = params;

  try {
    if (!email) {
      return { success: false, createdUser: null, createdAccount: null, error: "Email is required" };
    }

    let hashedPassword = "";
    if (provider) {
      hashedPassword = await argon2.hash(crypto.randomBytes(16).toString("hex"));
    } else if (password) {
      hashedPassword = (await hashPassword({ password })).hashedPassword;
    }

    const userInsert: any = {
      id: generateSlimId(),
      email,
      firstName: name || (provider && providerData.name) || "User",
      phone: phone || null,
      fin: params.fin || null,
      emailIsVerified: !!provider,
      sessionsGroupId: generateSlimId(),
    };

    const { createdUser, createdAccount } = await db.transaction(async (tx) => {
      const users_res = await tx.insert(users).values(userInsert).returning();
      const user = users_res[0];
      await tx.insert(userCredentials).values({ id: user.id, password: hashedPassword });
      const accounts_res = await tx.insert(accounts).values({ userId: user.id }).returning();
      const account = accounts_res[0];
      // Workspace creation removed. User must onboard.
      return { createdUser: user, createdAccount: account };
    });

    return {
      success: true,
      createdUser: createdUser as unknown as UserData,
      createdAccount: createdAccount as unknown as AccountData,
      error: null,
    };
  } catch (error: any) {
    return { success: false, createdUser: null, createdAccount: null, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════
// UNIFIED USER DATA ACCESS
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// UNIFIED USER DATA ACCESS
// ═══════════════════════════════════════════════════════════════

export async function getUserData(
  params: UserLookupParams,
): Promise<GetUserDataResult> {
  const { type, email, phone, password, userId, accountId } = params;

  try {
    if (type === "account_id") {
      if (!accountId) {
        return { user: null, account: null, error: "Account ID is required" };
      }

      const result = await db.select({
        accountId: accounts.id,
        accountUserId: accounts.userId,
        suspended: accounts.suspended,
        accountCreatedAt: accounts.createdAt,
        accountUpdatedAt: accounts.updatedAt,
        subscriptionType: accounts.subscriptionType,
        subscribedUntil: accounts.subscribedUntil,
        userId: users.id,
        email: users.email,
        phone: users.phone,
        firstName: users.firstName,
        lastName: users.lastName,
        avatarUrl: users.avatarUrl,
        emailVerified: users.emailIsVerified,
        phoneVerified: users.phoneIsVerified,
        sessionsGroupId: users.sessionsGroupId,
        userCreatedAt: users.createdAt,
        userUpdatedAt: users.updatedAt,
      })
        .from(accounts)
        .innerJoin(users, eq(accounts.userId, users.id))
        .where(eq(accounts.id, accountId))
        .limit(1);

      const row = result[0];
      if (!row) {
        return { user: null, account: null, error: "Account not found" };
      }

      // 2. Resolve Role and Permissions
      const workspaceId = params.workspaceId;
      let activeRole = null;
      let permissions = new Set<string>();
      let isStaff = false;
      let workspaceType = null;
      let workspaceSubscriptionType = null;
      let workspaceSubscribedUntil = null;

      // 2.a Fetch permissions and subscription for specific workspace context
      if (workspaceId) {
        const membershipResult = await db.select({
          roleName: workspaceAccesses.accessRole,
          permissions: workspaceRoles.permissions,
          isStaff: workspaceRoles.isStaff,
          workspaceType: workspaceRoles.forWorkspaceType,
          workspaceSubscriptionType: workspaceAccesses.subscriptionTier,
          workspaceSubscribedUntil: workspaceAccesses.subscribedUntil
        })
          .from(workspaceAccesses)
          .leftJoin(workspaceRoles, eq(workspaceAccesses.accessRole, workspaceRoles.name))
          .leftJoin(workspaces, eq(workspaceAccesses.targetWorkspaceId, workspaces.id))
          .where(and(eq(workspaceAccesses.actorAccountId, row.accountId), eq(workspaceAccesses.targetWorkspaceId, workspaceId)))
          .limit(1);

        if (membershipResult[0]) {
          activeRole = membershipResult[0].roleName;
          isStaff = !!membershipResult[0].isStaff;
          workspaceType = membershipResult[0].workspaceType;
          workspaceSubscriptionType = membershipResult[0].workspaceSubscriptionType;
          workspaceSubscribedUntil = membershipResult[0].workspaceSubscribedUntil;

          const permsJson = membershipResult[0].permissions as Record<string, boolean> || {};
          Object.keys(permsJson).forEach(k => { if (permsJson[k]) permissions.add(k); });
        }
      }

      // 2.b Fetch Global Staff Permissions (Critical for super_staff access)
      const staffMemberships = await db.select({
        roleName: workspaceAccesses.accessRole,
        permissions: workspaceRoles.permissions,
        workspaceType: workspaceRoles.forWorkspaceType
      })
        .from(workspaceAccesses)
        .innerJoin(workspaceRoles, eq(workspaceAccesses.accessRole, workspaceRoles.name))
        .where(and(eq(workspaceAccesses.actorAccountId, row.accountId), eq(workspaceRoles.isStaff, true)));

      for (const membership of staffMemberships) {
        isStaff = true;
        if (!activeRole) activeRole = membership.roleName;
        if (!workspaceType) workspaceType = membership.workspaceType;

        const permsJson = membership.permissions as Record<string, boolean> || {};
        Object.keys(permsJson).forEach(k => { if (permsJson[k]) permissions.add(k); });
      }

      return {
        user: {
          id: row.userId,
          email: row.email,
          phone: row.phone,
          firstName: row.firstName,
          lastName: row.lastName,
          avatarUrl: row.avatarUrl,
          emailVerified: row.emailVerified,
          phoneVerified: row.phoneVerified,
          sessionsGroupId: row.sessionsGroupId,
          createdAt: row.userCreatedAt,
          updatedAt: row.userUpdatedAt,
        },
        account: {
          id: row.accountId,
          userId: row.accountUserId,
          suspended: row.suspended,
          createdAt: row.accountCreatedAt,
          updatedAt: row.accountUpdatedAt,
          role: activeRole,
          permissions: Array.from(permissions),
          workspaceId: workspaceId,
          isStaff,
          workspaceType: workspaceType as any,
          subscriptionType: row.subscriptionType,
          subscribedUntil: row.subscribedUntil,
          workspaceSubscriptionType,
          workspaceSubscribedUntil
        },
        error: null,
      };
    }

    // Other lookup types (email, phone, user_id)
    const needsPassword = type === "email_password" || type === "phone_password";
    let validationError: string | null = null;

    switch (type) {
      case "email_password": if (!email || !password) validationError = "Email and password are required"; break;
      case "phone_password": if (!phone || !password) validationError = "Phone and password are required"; break;
      case "user_id": if (!userId) validationError = "User ID is required"; break;
      case "email": if (!email) validationError = "Email is required"; break;
      case "phone": if (!phone) validationError = "Phone is required"; break;
      default: return { user: null, account: null, error: "Invalid lookup type" };
    }

    if (validationError) return { user: null, account: null, error: validationError };

    let queryBuilder = db.select({
      id: users.id,
      email: users.email,
      phone: users.phone,
      firstName: users.firstName,
      lastName: users.lastName,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      avatarUrl: users.avatarUrl,
      emailVerified: users.emailIsVerified,
      phoneVerified: users.phoneIsVerified,
      sessionsGroupId: users.sessionsGroupId,
      password: userCredentials.password,
    })
      .from(users)
      .leftJoin(userCredentials, eq(users.id, userCredentials.id));

    const conditions = [];
    if (type === "email_password" || type === "email") conditions.push(eq(users.email, email!));
    if (type === "phone_password" || type === "phone") conditions.push(eq(users.phone, phone!));
    if (type === "user_id") conditions.push(eq(users.id, userId!));

    if (conditions.length > 0) queryBuilder.where(or(...conditions));

    const userResult = await queryBuilder.limit(1);
    const user = userResult[0];
    if (!user) return { user: null, account: null, error: "User not found" };

    if (needsPassword) {
      const storedPasswordHash = user.password;
      if (!storedPasswordHash) return { user: null, account: null, error: "Invalid credentials" };
      const { isPasswordValid } = await verifyPassword({ inputPassword: password!, storedPassword: storedPasswordHash.trim() });
      if (!isPasswordValid) return { user: null, account: null, error: "Invalid password" };
    }

    const accountResult = await getAccountByUserId({ userId: user.id, workspaceId: params.workspaceId });
    const { password: _, ...safeUser } = user as any;

    return { user: safeUser as UserData, account: accountResult, error: null };
  } catch (error: any) {
    ConsoleLogger.error("getUserData error:", error.message);
    return { user: null, account: null, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════
// ACCOUNT DATA ACCESS
// ═══════════════════════════════════════════════════════════════

export async function getAccountData({
  userId,
  accountId,
}: {
  userId?: string;
  accountId?: string;
}): Promise<{ account: AccountData | null; error: string | null }> {
  try {
    let account = null;
    if (accountId) {
      const res = await db.select().from(accounts).where(eq(accounts.id, accountId)).limit(1);
      if (res[0]) account = await getAccountByUserId({ userId: res[0].userId as string });
    } else if (userId) {
      account = await getAccountByUserId({ userId });
    }
    return { account, error: account ? null : "Account not found" };
  } catch (error: any) {
    return { account: null, error: error.message };
  }
}

async function getAccountByUserId({
  userId,
  workspaceId,
}: {
  userId: string;
  workspaceId?: string;
}): Promise<AccountData | null> {
  const result = await db.select().from(accounts).where(eq(accounts.userId, userId)).limit(1);
  const account = result[0];
  if (!account) return null;

  // Fetch role and permissions
  let activeRole = null;
  let permissions = new Set<string>();
  let isStaff = false;
  let workspaceType = null;

  // 1. Fetch permissions for specific workspace context (if provided)
  if (workspaceId) {
    const contextMembership = await db.select({
      roleName: workspaceAccesses.accessRole,
      permissions: workspaceRoles.permissions,
      isStaff: workspaceRoles.isStaff,
      workspaceType: workspaceRoles.forWorkspaceType
    })
      .from(workspaceAccesses)
      .leftJoin(workspaceRoles, eq(workspaceAccesses.accessRole, workspaceRoles.name))
      .where(and(eq(workspaceAccesses.actorAccountId, account.id), eq(workspaceAccesses.targetWorkspaceId, workspaceId)))
      .limit(1);

    if (contextMembership[0]) {
      activeRole = contextMembership[0].roleName;
      isStaff = !!contextMembership[0].isStaff;
      workspaceType = contextMembership[0].workspaceType;

      const permsJson = contextMembership[0].permissions as Record<string, boolean> || {};
      Object.keys(permsJson).forEach(k => { if (permsJson[k]) permissions.add(k); });
    }
  }

  // 2. Fetch Global Staff Permissions (If user has a staff role anywhere, it might grant global access)
  const staffMemberships = await db.select({
    roleName: workspaceAccesses.accessRole,
    permissions: workspaceRoles.permissions,
    workspaceType: workspaceRoles.forWorkspaceType
  })
    .from(workspaceAccesses)
    .innerJoin(workspaceRoles, eq(workspaceAccesses.accessRole, workspaceRoles.name))
    .where(and(eq(workspaceAccesses.actorAccountId, account.id), eq(workspaceRoles.isStaff, true)));

  for (const membership of staffMemberships) {
    isStaff = true;
    if (!activeRole) activeRole = membership.roleName;
    if (!workspaceType) workspaceType = membership.workspaceType;

    const permsJson = membership.permissions as Record<string, boolean> || {};
    Object.keys(permsJson).forEach(k => { if (permsJson[k]) permissions.add(k); });
  }

  return {
    id: account.id, userId: account.userId, suspended: account.suspended,
    createdAt: account.createdAt, updatedAt: account.updatedAt,
    role: activeRole,
    permissions: Array.from(permissions),
    isStaff,
    workspaceType,
    workspaceId
  } as AccountData;
}

// ═════ SESSIONS (Simplified for brevity as requested by current scope) ═════
export async function verifyUserSession({ sessionId, authData }: { sessionId: string; authData: { user: UserData; account: AccountData } }): Promise<boolean> {
  return !!(authData.user.sessions && authData.user.sessions[sessionId]);
}

export async function createUserSession({ user, session }: { user: UserData; session: any }): Promise<{ createdSession: any; sessionCreationError: string | null }> {
  try {
    const userResult = await db.select({ sessions: users.sessions }).from(users).where(eq(users.id, user.id)).limit(1);
    const sessions = { ...(userResult[0]?.sessions as any || {}), [session.id]: session };
    await db.update(users).set({ sessions }).where(eq(users.id, user.id));
    return { createdSession: session, sessionCreationError: null };
  } catch (error: any) { return { createdSession: null, sessionCreationError: error.message }; }
}

export async function removeSession({ userId, sessionId }: { userId: string; sessionId: string }): Promise<boolean> {
  try {
    const userResult = await db.select({ sessions: users.sessions }).from(users).where(eq(users.id, userId)).limit(1);
    const sessions = { ...(userResult[0]?.sessions as any || {}) };
    delete sessions[sessionId];
    await db.update(users).set({ sessions }).where(eq(users.id, userId));
    return true;
  } catch { return false; }
}
