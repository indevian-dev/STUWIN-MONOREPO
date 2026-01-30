
import { withApiHandler } from "@/lib/app-access-control/interceptors";
import { ModuleFactory } from "@/lib/app-core-modules/factory";
import { NextResponse } from "next/server";

/**
 * GET /api/workspaces/root/billing/tiers
 * Get available subscription tiers
 */
export const GET = withApiHandler(
    async (req: any, { ctx, log }) => {
        try {
            const modules = new ModuleFactory(ctx);
            const tiers = await modules.payment.getAvailableTiers();

            return NextResponse.json({
                success: true,
                data: tiers,
            }) as any;
        } catch (error) {
            log.error("Failed to fetch billing tiers", error);
            return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 }) as any;
        }
    },
    {
        method: "GET",
        authRequired: true,
    }
);
