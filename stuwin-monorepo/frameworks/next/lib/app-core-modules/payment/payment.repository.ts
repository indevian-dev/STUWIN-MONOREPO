
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { eq, and, desc } from "drizzle-orm";
import * as schema from "@/lib/app-infrastructure/database/schema";
import { workspaceSubscriptionTransactions, paymentSubscriptions, activeSubscriptions, workspaceSubscriptionCoupons, accounts, workspaces } from "@/lib/app-infrastructure/database/schema";

export class PaymentRepository {
    constructor(private readonly db: PostgresJsDatabase<typeof schema>) { }

    async getSubscriptions() {
        return await this.db.select().from(paymentSubscriptions).where(eq(paymentSubscriptions.isActive, true));
    }

    async getCouponByCode(code: string) {
        const result = await this.db.select().from(workspaceSubscriptionCoupons).where(and(eq(workspaceSubscriptionCoupons.code, code), eq(workspaceSubscriptionCoupons.isActive, true))).limit(1);
        return result[0];
    }

    async createTransaction(data: any) {
        const result = await this.db.insert(workspaceSubscriptionTransactions).values(data).returning();
        return result[0];
    }

    async updateTransactionStatus(id: string, status: string, metadata?: any) {
        return await this.db.update(workspaceSubscriptionTransactions)
            .set({ status, statusMetadata: metadata })
            .where(eq(workspaceSubscriptionTransactions.id, id))
            .returning();
    }

    async getLatestTransactionByAccount(accountId: string) {
        const result = await this.db.select().from(workspaceSubscriptionTransactions)
            .where(eq(workspaceSubscriptionTransactions.accountId, accountId))
            .orderBy(desc(workspaceSubscriptionTransactions.createdAt))
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

    async getActiveSubscriptionByWorkspace(workspaceId: string) {
        const now = new Date();
        const subs = await this.db.select().from(activeSubscriptions)
            .where(and(
                eq(activeSubscriptions.workspaceId, workspaceId),
                eq(activeSubscriptions.status, 'active')
            ));

        return subs.filter(s => !s.endsAt || new Date(s.endsAt) > now);
    }

    // Legacy Support (Optional)
    async updateWorkspaceSubscription(workspaceId: string, type: string, until: Date) {
        return await this.db.update(workspaces)
            .set({ studentSubscribedUntill: until } as any) // Assuming type-wide subscription is removed, but we keep the date
            .where(eq(workspaces.id, workspaceId))
            .returning();
    }

    // Staff Coupon Management
    async getAllCoupons() {
        return await this.db.select().from(workspaceSubscriptionCoupons).orderBy(desc(workspaceSubscriptionCoupons.createdAt));
    }

    async createCoupon(data: typeof workspaceSubscriptionCoupons.$inferInsert) {
        const result = await this.db.insert(workspaceSubscriptionCoupons).values(data).returning();
        return result[0];
    }

    async updateCoupon(id: string, data: Partial<typeof workspaceSubscriptionCoupons.$inferInsert>) {
        const result = await this.db.update(workspaceSubscriptionCoupons)
            .set(data)
            .where(eq(workspaceSubscriptionCoupons.id, id))
            .returning();
        return result[0];
    }

    async deleteCoupon(id: string) {
        return await this.db.delete(workspaceSubscriptionCoupons).where(eq(workspaceSubscriptionCoupons.id, id)).returning();
    }
}
