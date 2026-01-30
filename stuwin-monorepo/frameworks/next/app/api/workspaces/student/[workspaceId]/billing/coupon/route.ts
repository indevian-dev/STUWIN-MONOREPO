
import { withApiHandler } from "@/lib/app-access-control/interceptors";
import { ModuleFactory } from "@/lib/app-core-modules/factory";
import { NextResponse } from "next/server";

/**
 * POST /api/workspaces/student/[workspaceId]/billing/coupon
 * Validate and apply a coupon
 */
export const POST = withApiHandler(
    async (req: any, { ctx, log, params }) => {
        try {
            const body = await req.json();
            const { code } = body;

            if (!code) {
                return NextResponse.json({ success: false, error: "Coupon code is required" }, { status: 400 }) as any;
            }

            const modules = new ModuleFactory(ctx);
            const coupon = await modules.payment.applyCoupon(code);

            return NextResponse.json({
                success: true,
                data: coupon,
            }) as any;
        } catch (error: any) {
            log.error("Coupon validation error", error);
            return NextResponse.json({ success: false, error: error.message || "Invalid coupon" }, { status: 400 }) as any;
        }
    },
    {
        method: "POST",
        authRequired: true,
    }
);
