
import { withApiHandler } from "@/lib/app-access-control/interceptors";
import { ModuleFactory } from "@/lib/app-core-modules/factory";
import { NextResponse } from "next/server";

/**
 * PUT | DELETE /api/workspaces/staff/[workspaceId]/payments/coupons/[id]
 * Update or Delete a coupon
 */
export const PUT = withApiHandler(
    async (req: any, { ctx, log, params }) => {
        try {
            const body = await req.json();
            const modules = new ModuleFactory(ctx);
            const coupon = await modules.payment.updateCoupon(params.id, body);
            return NextResponse.json({ success: true, data: coupon }) as any;
        } catch (error: any) {
            log.error("Failed to update coupon", error);
            return NextResponse.json({ success: false, error: error.message }, { status: 400 }) as any;
        }
    },
    {
        method: "PUT",
        authRequired: true,
        permission: "STAFF_PAYMENT_MANAGE"
    }
);

export const DELETE = withApiHandler(
    async (req: any, { ctx, log, params }) => {
        try {
            const modules = new ModuleFactory(ctx);
            await modules.payment.deleteCoupon(params.id);
            return NextResponse.json({ success: true }) as any;
        } catch (error: any) {
            log.error("Failed to delete coupon", error);
            return NextResponse.json({ success: false, error: error.message }, { status: 400 }) as any;
        }
    },
    {
        method: "DELETE",
        authRequired: true,
        permission: "STAFF_PAYMENT_MANAGE"
    }
);
