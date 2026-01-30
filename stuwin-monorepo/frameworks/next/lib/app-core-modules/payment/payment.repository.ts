
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { eq, and, desc } from "drizzle-orm";
import * as schema from "@/lib/app-infrastructure/database/schema";
import { paymentTransactions, paymentSubscriptions, activeSubscriptions, paymentCoupons, accounts, workspaces } from "@/lib/app-infrastructure/database/schema";

export class PaymentRepository {
    constructor(private readonly db: PostgresJsDatabase<typeof schema>) { }

    async getSubscriptions() {
        return await this.db.select().from(paymentSubscriptions).where(eq(paymentSubscriptions.isActive, true));
    }

    async getCouponByCode(code: string) {
        const result = await this.db.select().from(paymentCoupons).where(and(eq(paymentCoupons.code, code), eq(paymentCoupons.isActive, true))).limit(1);
        return result[0];
    }

    async createTransaction(data: any) {
        const result = await this.db.insert(paymentTransactions).values(data).returning();
        return result[0];
    }

    async updateTransactionStatus(id: string, status: string, metadata?: any) {
        return await this.db.update(paymentTransactions)
            .set({ status, statusMetadata: metadata })
            .where(eq(paymentTransactions.id, id))
            .returning();
    }

    async getLatestTransactionByAccount(accountId: string) {
        const result = await this.db.select().from(paymentTransactions)
            .where(eq(paymentTransactions.accountId, accountId))
            .orderBy(desc(paymentTransactions.createdAt))
            .limit(1);
        return result[0];
    }

    async updateAccountSubscription(accountId: string, type: string, until: Date) {
        return await this.db.update(accounts)
            .set({ subscriptionType: type, subscribedUntil: until })
            .where(eq(accounts.id, accountId))
            .returning();
    }


    async createActiveSubscription(data: typeof activeSubscriptions.$inferInsert) {
        // Upsert logic: if exists for same scope+scopeId+accountId, update it.
        // For simplicity, we just insert. A real production app might want to expire old ones first.
        const result = await this.db.insert(activeSubscriptions).values(data).returning();
        return result[0];
    }

    async getActiveSubscriptions(accountId: string) {
        return await this.db.select().from(activeSubscriptions)
            .where(eq(activeSubscriptions.accountId, accountId));
    }

    async getActiveSubscriptionByScope(scope: string, scopeId: string) {
        // Find any active subscription for this scope/id
        // Note: This query might return multiple if multiple accounts paid (unlikely for current model but possible)
        // We filter by isActive logic (e.g. endsAt > now) in service or here.
        const now = new Date();
        const subs = await this.db.select().from(activeSubscriptions)
            .where(and(
                eq(activeSubscriptions.scope, scope),
                eq(activeSubscriptions.scopeId, scopeId),
                eq(activeSubscriptions.status, 'active')
            ));

        // Filter in memory for date expiration to handle potential timezone nuances or DB specific date functions
        return subs.filter(s => !s.endsAt || new Date(s.endsAt) > now);
    }

    // Legacy Support (Optional)
    async updateWorkspaceSubscription(workspaceId: string, type: string, until: Date) {
        return await this.db.update(workspaces)
            .set({ subscriptionType: type, subscribedUntil: until })
            .where(eq(workspaces.id, workspaceId))
            .returning();
    }

    // Staff Coupon Management
    async getAllCoupons() {
        return await this.db.select().from(paymentCoupons).orderBy(desc(paymentCoupons.createdAt));
    }

    async createCoupon(data: typeof paymentCoupons.$inferInsert) {
        const result = await this.db.insert(paymentCoupons).values(data).returning();
        return result[0];
    }

    async updateCoupon(id: string, data: Partial<typeof paymentCoupons.$inferInsert>) {
        const result = await this.db.update(paymentCoupons)
            .set(data)
            .where(eq(paymentCoupons.id, id))
            .returning();
        return result[0];
    }

    async deleteCoupon(id: string) {
        return await this.db.delete(paymentCoupons).where(eq(paymentCoupons.id, id)).returning();
    }
}
