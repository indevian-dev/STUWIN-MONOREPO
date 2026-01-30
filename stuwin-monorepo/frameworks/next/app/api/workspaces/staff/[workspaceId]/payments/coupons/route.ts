
import { withApiHandler } from "@/lib/app-access-control/interceptors";
import { ModuleFactory } from "@/lib/app-core-modules/factory";
import { NextResponse } from "next/server";

/**
 * GET | POST /api/workspaces/staff/[workspaceId]/payments/coupons
 * List or Create coupons
 */
export const GET = withApiHandler(
    async (req: any, { ctx, log }) => {
        try {
            const modules = new ModuleFactory(ctx);
            const coupons = await modules.payment.listCoupons();
            return NextResponse.json({ success: true, data: coupons }) as any;
        } catch (error) {
            log.error("Failed to list coupons", error);
            return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 }) as any;
        }
    },
    {
        method: "GET",
        authRequired: true,
        permission: "STAFF_PAYMENT_MANAGE"
    }
);

export const POST = withApiHandler(
    async (req: any, { ctx, log }) => {
        try {
            const body = await req.json();
            const modules = new ModuleFactory(ctx);
            const coupon = await modules.payment.createCoupon(body);
            return NextResponse.json({ success: true, data: coupon }) as any;
        } catch (error: any) {
            log.error("Failed to create coupon", error);
            return NextResponse.json({ success: false, error: error.message }, { status: 400 }) as any;
        }
    },
    {
        method: "POST",
        authRequired: true,
        permission: "STAFF_PAYMENT_MANAGE"
    }
);
