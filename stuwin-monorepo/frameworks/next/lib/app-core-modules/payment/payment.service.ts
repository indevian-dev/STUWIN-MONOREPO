
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
        scope: 'WORKSPACE_TYPE' | 'WORKSPACE',
        scopeId: string, // workspaceId or workspaceType (e.g. 'student')
        couponCode?: string,
        language?: string
    }) {
        const { tierId, scope, scopeId, couponCode, language = 'az' } = params;

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
            workspaceId: scope === 'WORKSPACE' ? scopeId : this.ctx.activeWorkspaceId, // Link to active if Type scope
            paidAmount: amount,
            status: "pending",
            metadata: {
                tierId,
                tierType: tier.type,
                couponCode,
                scope,
                scopeId
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
        const transaction = await this.db.query.paymentTransactions.findFirst({
            where: (t, { eq }) => eq(t.id, transactionId)
        });

        if (!transaction) throw new Error("Transaction not found");
        if (transaction.status === 'completed') return { success: true, alreadyCompleted: true };

        await this.paymentRepo.updateTransactionStatus(transactionId, "completed");


        const metadata = transaction.metadata as any;
        const tierType = metadata?.tierType || "pro";
        const scope = metadata?.scope || (transaction.workspaceId ? 'WORKSPACE' : 'WORKSPACE_TYPE'); // Fallback for old transactions
        const scopeId = metadata?.scopeId || (scope === 'WORKSPACE' ? transaction.workspaceId : 'student'); // Default to student type if unknown

        // Calculate end date (default 30 days)
        const until = new Date();
        until.setDate(until.getDate() + 30);

        // CREATE ACTIVE SUBSCRIPTION
        await this.paymentRepo.createActiveSubscription({
            accountId: transaction.accountId as string,
            scope: scope,
            scopeId: scopeId,
            planType: tierType,
            startsAt: new Date(),
            endsAt: until,
            status: 'active',
            metadata: { transactionId: transaction.id },
            paymentTransactionId: transaction.id
        });

        // LEGACY SYNC (Keep old tables updated for backward compatibility if needed)
        if (scope === 'WORKSPACE' && transaction.workspaceId) {
            const workspace = await this.db.query.workspaces.findFirst({
                where: (w, { eq }) => eq(w.id, transaction.workspaceId!)
            });
            if (workspace) {
                await this.paymentRepo.updateWorkspaceSubscription(transaction.workspaceId, tierType, until);
            }
        } else if (scope === 'WORKSPACE_TYPE') {
            // For Type scope, we typically update the account or a flag.
            if (transaction.accountId) {
                await this.paymentRepo.updateAccountSubscription(transaction.accountId, tierType, until);
            }
        }

        return { success: true, subscribedUntil: until };
    }

    async verifyWebhookSignature(data: string, signature: string): Promise<boolean> {
        const expectedSignature = this.generateEpointSignature(data);
        return expectedSignature === signature;
    }

    async getEffectiveSubscriptionStatus(workspaceId: string, workspaceType: string) {
        // 1. Check Workspace Specific
        const workspaceSubs = await this.paymentRepo.getActiveSubscriptionByScope('WORKSPACE', workspaceId);
        if (workspaceSubs && workspaceSubs.length > 0) {
            return {
                type: workspaceSubs[0].planType,
                until: workspaceSubs[0].endsAt as Date,
                source: 'WORKSPACE',
                isActive: true
            };
        }

        // 2. Check Workspace Type
        const typeSubs = await this.paymentRepo.getActiveSubscriptionByScope('WORKSPACE_TYPE', workspaceType);
        if (typeSubs && typeSubs.length > 0) {
            return {
                type: typeSubs[0].planType,
                until: typeSubs[0].endsAt as Date,
                source: 'WORKSPACE_TYPE',
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
