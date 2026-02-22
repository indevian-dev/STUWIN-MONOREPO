import { eq, and, gt } from 'drizzle-orm';
import { accountOtps } from '@/lib/database/schema';
import { BaseRepository } from "../base/Base.repository";
import { type DbClient } from '@/lib/database';

import type { OtpType, OtpRecord, RecentOtpRecord, StoreOtpResult } from './Otp.types';

/**
 * OtpRepository — Database operations for OTP records
 */
export class OtpRepository extends BaseRepository {
    constructor(db: DbClient) {
        super(db);
    }

    /**
     * Insert a new OTP record
     */
    async store(params: {
        otpCode: string;
        accountId: string;
        type: OtpType;
        destination: string;
        ttlMinutes?: number;
    }): Promise<StoreOtpResult> {
        const { otpCode, accountId, type, destination, ttlMinutes = 2 } = params;
        const expireAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

        try {
            await this.db.insert(accountOtps).values({
                accountId,
                code: otpCode,
                expireAt,
                type,
                destination
            });

            return { storedOtp: otpCode, isOtpIssued: true };
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            return { storedOtp: null, isOtpIssued: false, error: err.message };
        }
    }

    /**
     * Find a valid (non-expired) OTP by account, type, and code
     */
    async findValid(params: {
        accountId: string;
        type: OtpType;
        code: string;
        destination?: string;
    }): Promise<OtpRecord | null> {
        const { accountId, type, code, destination } = params;

        const result = await this.db
            .select({
                id: accountOtps.id,
                accountId: accountOtps.accountId,
                code: accountOtps.code,
                type: accountOtps.type,
                expireAt: accountOtps.expireAt,
                createdAt: accountOtps.createdAt,
                destination: accountOtps.destination
            })
            .from(accountOtps)
            .where(and(
                eq(accountOtps.accountId, accountId),
                eq(accountOtps.type, type),
                eq(accountOtps.code, code),
                destination ? eq(accountOtps.destination, destination) : undefined,
                gt(accountOtps.expireAt, new Date())
            ))
            .limit(1);

        return result.length > 0 ? result[0] as unknown as OtpRecord : null;
    }

    /**
     * Check if a recent OTP exists (created less than 2 minutes ago)
     */
    async findRecent(params: {
        accountId: string;
        type: OtpType;
    }): Promise<RecentOtpRecord | null> {
        const { accountId, type } = params;
        const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);

        const result = await this.db
            .select({
                id: accountOtps.id,
                createdAt: accountOtps.createdAt,
                expireAt: accountOtps.expireAt
            })
            .from(accountOtps)
            .where(and(
                eq(accountOtps.accountId, accountId),
                eq(accountOtps.type, type),
                gt(accountOtps.createdAt, twoMinutesAgo),
                gt(accountOtps.expireAt, new Date())
            ))
            .orderBy(accountOtps.createdAt)
            .limit(1);

        return result.length > 0 ? result[0] : null;
    }

    /**
     * Check if any active (non-expired) OTP exists
     */
    async findActive(params: {
        accountId: string;
        type: OtpType;
    }): Promise<RecentOtpRecord | null> {
        const { accountId, type } = params;

        const result = await this.db
            .select({
                id: accountOtps.id,
                createdAt: accountOtps.createdAt,
                expireAt: accountOtps.expireAt
            })
            .from(accountOtps)
            .where(and(
                eq(accountOtps.accountId, accountId),
                eq(accountOtps.type, type),
                gt(accountOtps.expireAt, new Date())
            ))
            .orderBy(accountOtps.createdAt)
            .limit(1);

        return result.length > 0 ? result[0] : null;
    }

    /**
     * Delete (consume) an OTP by ID
     */
    async consume(otpId: string): Promise<void> {
        await this.db
            .delete(accountOtps)
            .where(eq(accountOtps.id, otpId));
    }
}
