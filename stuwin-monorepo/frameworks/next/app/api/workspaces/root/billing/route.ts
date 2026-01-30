
import { withApiHandler } from "@/lib/app-access-control/interceptors";
import { ModuleFactory } from "@/lib/app-core-modules/factory";
import { NextResponse } from "next/server";

/**
 * GET /api/workspaces/root/billing
 * Get current subscription status
 */
export const GET = withApiHandler(
    async (req: any, { ctx, log }) => {
        try {
            const modules = new ModuleFactory(ctx);
            const status = await modules.payment.getSubscriptionStatus();

            return NextResponse.json({
                success: true,
                data: status,
            }) as any;
        } catch (error) {
            log.error("Billing status fetch error", error);
            return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 }) as any;
        }
    },
    {
        method: "GET",
        authRequired: true,
    }
);

/**
 * POST /api/workspaces/root/billing/pay
 * Initiate a payment
 */
export const POST = withApiHandler(
    async (req: any, { ctx, log }) => {
        try {
            const body = await req.json();
            const { tierId, couponCode, language } = body;

            if (!tierId) {
                return NextResponse.json({ success: false, error: "tierId is required" }, { status: 400 }) as any;
            }

            const modules = new ModuleFactory(ctx);
            // workspaceId is passed as undefined for account-level billing
            const result = await modules.payment.initiatePayment(tierId, undefined, couponCode, language || 'az');

            return NextResponse.json({
                success: true,
                data: result,
            }) as any;
        } catch (error: any) {
            log.error("Payment initiation error", error);
            return NextResponse.json({ success: false, error: error.message || "Payment failed" }, { status: 400 }) as any;
        }
    },
    {
        method: "POST",
        authRequired: true,
    }
);
