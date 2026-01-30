
import { db } from "@/lib/app-infrastructure/database";
import { userSessions, users } from "@/lib/app-infrastructure/database/schema";
import { eq, and, gt } from "drizzle-orm";
import { ConsoleLogger } from "@/lib/app-infrastructure/loggers/ConsoleLogger";

export interface SessionData {
    id: string;
    sessionsGroupId: string;
    accountId: string;
    expireAt: Date;
    ip?: string;
    device?: string;
    browser?: string;
    os?: string;
    metadata?: any;
}

export class SessionAuthenticator {
    private static SESSION_TTL_DAYS = 14;
    private static ROLLOVER_THRESHOLD_DAYS = 7;

    /**
     * Creates a new stateful session in the database
     * Returns a combined session ID: sessionsGroupId + ":" + sessionId (uuid)
     */
    static async createSession(params: {
        accountId: string;
        sessionsGroupId: string;
        ip?: string;
        userAgent?: string;
        metadata?: any;
    }): Promise<{ sessionId: string; expireAt: Date } | null> {
        try {
            const expireAt = new Date();
            expireAt.setDate(expireAt.getDate() + this.SESSION_TTL_DAYS);

            // Parse user agent for device info if available (simplified for now)
            const device = params.userAgent || "unknown";

            const [session] = await db.insert(userSessions).values({
                sessionsGroupId: params.sessionsGroupId,
                accountId: params.accountId,
                ip: params.ip,
                device: device,
                expireAt: expireAt,
                metadata: params.metadata || {},
            }).returning();

            if (!session) return null;

            // Combined ID: group_id:session_uuid
            const combinedId = `${params.sessionsGroupId}:${session.id}`;

            return {
                sessionId: combinedId,
                expireAt: expireAt
            };
        } catch (error) {
            ConsoleLogger.error("SessionAuthenticator.createSession error:", error);
            return null;
        }
    }

    /**
     * Verifies a session ID and returns associated data
     * Handles rollover if needed
     */
    static async verifySession(combinedId: string): Promise<{
        isValid: boolean;
        session?: SessionData;
        needsRollover?: boolean
    }> {
        try {
            if (!combinedId || !combinedId.includes(':')) {
                return { isValid: false };
            }

            const [groupId, sessionId] = combinedId.split(':');

            const result = await db
                .select()
                .from(userSessions)
                .where(and(
                    eq(userSessions.id, sessionId),
                    eq(userSessions.sessionsGroupId, groupId),
                    gt(userSessions.expireAt, new Date())
                ))
                .limit(1);

            const session = result[0];
            if (!session) return { isValid: false };

            // Check for rollover
            const now = new Date();
            const threshold = new Date();
            threshold.setDate(threshold.getDate() + this.ROLLOVER_THRESHOLD_DAYS);

            const needsRollover = session.expireAt ? session.expireAt < threshold : false;

            return {
                isValid: true,
                session: session as SessionData,
                needsRollover
            };
        } catch (error) {
            ConsoleLogger.error("SessionAuthenticator.verifySession error:", error);
            return { isValid: false };
        }
    }

    /**
     * Updates session expiry (TTL rollover)
     */
    static async rolloverSession(sessionId: string): Promise<Date | null> {
        try {
            const newExpireAt = new Date();
            newExpireAt.setDate(newExpireAt.getDate() + this.SESSION_TTL_DAYS);

            await db.update(userSessions)
                .set({ expireAt: newExpireAt })
                .where(eq(userSessions.id, sessionId));

            return newExpireAt;
        } catch (error) {
            ConsoleLogger.error("SessionAuthenticator.rolloverSession error:", error);
            return null;
        }
    }

    /**
     * Deletes a session (Logout)
     */
    static async deleteSession(combinedId: string): Promise<boolean> {
        try {
            if (!combinedId || !combinedId.includes(':')) return false;
            const [, sessionId] = combinedId.split(':');

            await db.delete(userSessions).where(eq(userSessions.id, sessionId));
            return true;
        } catch (error) {
            ConsoleLogger.error("SessionAuthenticator.deleteSession error:", error);
            return false;
        }
    }
}
