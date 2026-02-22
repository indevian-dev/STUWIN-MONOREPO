
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { eq, and, desc } from "drizzle-orm";
import * as schema from "@/lib/database/schema";
import { workspaceSubscriptionTransactions, paymentSubscriptions, workspaceSubscriptionCoupons, accounts, workspaces } from "@/lib/database/schema";

export class PaymentRepository {
    constructor(private readonly db: PostgresJsDatabase<typeof schema>) { }

    async getSubscriptions() {
        try {
            return await this.db.select().from(paymentSubscriptions).where(eq(paymentSubscriptions.isActive, true));
        } catch (error) {
            console.warn("Table paymentSubscriptions might be missing, returning empty list.", error);
            // Return dummy tiers if DB fails, to allow UI to render 'Free' at least
            return [
                {
                    id: "free_tier",
                    title: "Free Account",
                    type: "free",
                    price: 0,
                    isActive: true,
                    subscriptionPeriod: "month",
                    metadata: {},
                    createdAt: new Date()
                }
            ] as any[];
        }
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

    async listTransactions(accountId: string) {
        return await this.db.select().from(workspaceSubscriptionTransactions)
            .where(eq(workspaceSubscriptionTransactions.accountId, accountId))
            .orderBy(desc(workspaceSubscriptionTransactions.createdAt));
    }

    async getTransactionById(id: string) {
        const result = await this.db.select().from(workspaceSubscriptionTransactions)
            .where(eq(workspaceSubscriptionTransactions.id, id))
            .limit(1);
        return result[0];
    }

    async updateAccountSubscription(accountId: string, type: string, until: Date) {
        return await this.db.update(accounts)
            .set({ subscriptionType: type, subscribedUntil: until })
            .where(eq(accounts.id, accountId))
            .returning();
    }




    // Legacy Support (Optional)
    async updateWorkspaceSubscription(workspaceId: string, type: string, until: Date) {
        return await this.db.update(workspaces)
            .set({ studentSubscribedUntill: until } as any) // Assuming type-wide subscription is removed, but we keep the date
            .where(eq(workspaces.id, workspaceId))
            .returning();
    }

    async updateWorkspaceAccessSubscription(actorAccountId: string, targetWorkspaceId: string, viaWorkspaceId: string | undefined, until: Date) {
        const conditions = [
            eq(schema.workspaceAccesses.actorAccountId, actorAccountId),
            eq(schema.workspaceAccesses.targetWorkspaceId, targetWorkspaceId)
        ];
        if (viaWorkspaceId) {
            conditions.push(eq(schema.workspaceAccesses.viaWorkspaceId, viaWorkspaceId));
        }

        return await this.db.update(schema.workspaceAccesses)
            .set({ subscribedUntil: until })
            .where(and(...conditions))
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
