
import { PaymentRepository } from "./payment.repository";
import { AuthContext } from "@/lib/app-core-modules/types";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "@/lib/app-infrastructure/database/schema";
import crypto from 'crypto';
import axios from 'axios';

export class PaymentService {
    constructor(
        private readonly paymentRepo: PaymentRepository,
        private readonly ctx: AuthContext,
        private readonly db: PostgresJsDatabase<typeof schema>
    ) { }

    async getAvailableTiers() {
        return await this.paymentRepo.getSubscriptions();
    }

    async applyCoupon(code: string) {
        const coupon = await this.paymentRepo.getCouponByCode(code);
        if (!coupon) {
            throw new Error("Invalid or inactive coupon");
        }
        return coupon;
    }

    private generateEpointSignature(data: string): string {
        const privateKey = process.env.EPOINT_PRIVATE_KEY || '';
        const hash = crypto.createHash('sha1')
            .update(privateKey + data + privateKey)
            .digest();
        return hash.toString('base64');
    }

    async initiatePayment(params: {
        tierId: string,
        workspaceId: string,
        couponCode?: string,
        language?: string
    }) {
        const { tierId, workspaceId, couponCode, language = 'az' } = params;

        const tiers = await this.paymentRepo.getSubscriptions();
        const tier = tiers.find(t => t.id === tierId);

        if (!tier) {
            throw new Error("Tier not found");
        }

        let amount = tier.price || 0;
        if (couponCode) {
            const coupon = await this.applyCoupon(couponCode);
            amount = amount * (1 - ((coupon.discountPercent || 0) / 100));
        }

        const transaction = await this.paymentRepo.createTransaction({
            accountId: this.ctx.accountId,
            workspaceId: workspaceId,
            paidAmount: amount,
            status: "pending",
            metadata: {
                tierId,
                tierType: tier.type,
                couponCode,
                workspaceId
            }
        });

        // ═══════════════════════════════════════════════════════════════
        // EPOINT INTEGRATION
        // ═══════════════════════════════════════════════════════════════

        const publicKey = process.env.EPOINT_PUBLIC_KEY;
        if (!publicKey) {
            throw new Error("Payment provider not configured (missing public key)");
        }

        const paymentParams = {
            public_key: publicKey,
            amount: amount,
            currency: "AZN",
            language: language,
            order_id: transaction.id,
            description: `Subscription: ${tier.title || tier.type} for ${this.ctx.accountId}`,
        };

        const data = Buffer.from(JSON.stringify(paymentParams)).toString('base64');
        const signature = this.generateEpointSignature(data);

        try {
            const response = await axios.post('https://epoint.az/api/1/request', new URLSearchParams({
                data: data,
                signature: signature
            }).toString(), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            if (response.data && response.data.status === 'success' && response.data.redirect_url) {
                return {
                    transactionId: transaction.id,
                    amount,
                    status: transaction.status,
                    redirectUrl: response.data.redirect_url,
                    message: "Payment initiated"
                };
            } else {
                console.error("Epoint error response:", response.data);
                throw new Error(response.data?.error || "Failed to get redirect URL from payment provider");
            }
        } catch (error: any) {
            console.error("Epoint request failed:", error.response?.data || error.message);
            throw new Error("Failed to communicate with payment provider");
        }
    }

    async completePayment(transactionId: string) {
        const transaction = await this.db.query.workspaceSubscriptionTransactions.findFirst({
            where: (t, { eq }) => eq(t.id, transactionId)
        });

        if (!transaction) throw new Error("Transaction not found");
        if (transaction.status === 'completed') return { success: true, alreadyCompleted: true };

        await this.paymentRepo.updateTransactionStatus(transactionId, "completed");


        const metadata = transaction.metadata as any;
        const tierType = metadata?.tierType || "pro";
        const workspaceId = transaction.workspaceId;

        if (!workspaceId) throw new Error("Workspace ID missing in transaction");

        // Calculate end date (default 30 days)
        const until = new Date();
        until.setDate(until.getDate() + 30);

        // Legacy active_subscriptions table creation removed

        // Update Workspace Subscription Date
        await this.paymentRepo.updateWorkspaceSubscription(workspaceId, tierType, until);

        return { success: true, subscribedUntil: until };
    }

    async verifyWebhookSignature(data: string, signature: string): Promise<boolean> {
        const expectedSignature = this.generateEpointSignature(data);
        return expectedSignature === signature;
    }

    async getEffectiveSubscriptionStatus(workspaceId: string, workspaceType: string) {
        // Refactored to check workspace table directly instead of legacy active_subscriptions
        const workspace = await this.db.query.workspaces.findFirst({
            where: (w, { eq }) => eq(w.id, workspaceId)
        });

        if (workspace && workspace.studentSubscribedUntill && new Date(workspace.studentSubscribedUntill) > new Date()) {
            return {
                type: 'pro', // Defaulting to pro as plan type isn't clearly stored on workspace yet besides potentially metadata, or simplified model
                until: workspace.studentSubscribedUntill,
                source: 'WORKSPACE',
                isActive: true
            };
        }

        return null;
    }

    // Deprecated method for backward compatibility
    async getSubscriptionStatus() {
        const accountId = this.ctx.accountId;
        // Return basic account status from DB column (Legacy)
        if (!accountId) return null;
        const account = await this.db.query.accounts.findFirst({
            where: (a, { eq }) => eq(a.id, accountId)
        });
        return {
            type: account?.subscriptionType,
            until: account?.subscribedUntil,
            isActive: account?.subscribedUntil ? new Date(account.subscribedUntil) > new Date() : false
        };
    }

    // Staff Coupon Management
    async listCoupons() {
        return await this.paymentRepo.getAllCoupons();
    }

    async createCoupon(data: any) {
        return await this.paymentRepo.createCoupon(data);
    }

    async updateCoupon(id: string, data: any) {
        return await this.paymentRepo.updateCoupon(id, data);
    }

    async deleteCoupon(id: string) {
        return await this.paymentRepo.deleteCoupon(id);
    }
}
