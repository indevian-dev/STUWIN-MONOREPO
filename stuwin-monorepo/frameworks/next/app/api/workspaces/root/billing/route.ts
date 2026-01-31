import { NextResponse } from "next/server";
import { unifiedApiHandler } from "@/lib/app-access-control/interceptors";

/**
 * GET /api/workspaces/root/billing
 * Get current subscription status
 */
export const GET = unifiedApiHandler(async (req, { module, log }) => {
    try {
        const status = await module.payment.getSubscriptionStatus();

        return NextResponse.json({
            success: true,
            data: status,
        });
    } catch (error) {
        if (log) log.error("Billing status fetch error", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
});

/**
 * POST /api/workspaces/root/billing/pay
 * Initiate a payment
 */
export const POST = unifiedApiHandler(async (req, { module, log }) => {
    try {
        const body = await req.json();
        const { tierId, couponCode, language } = body;

        if (!tierId) {
            return NextResponse.json({ success: false, error: "tierId is required" }, { status: 400 });
        }

        // workspaceId is undefined for account-level billing (Root), so we assume 'student' type scope
        // This makes it a general subscription for the user account (student features)
        const result = await module.payment.initiatePayment({
            tierId,
            scope: 'WORKSPACE_TYPE',
            scopeId: 'student',
            couponCode,
            language: language || 'az'
        });

        return NextResponse.json({
            success: true,
            data: result,
        });
    } catch (error: any) {
        if (log) log.error("Payment initiation error", error);
        return NextResponse.json({ success: false, error: error.message || "Payment failed" }, { status: 400 });
    }
});
