
import { withApiHandler } from "@/lib/app-access-control/interceptors";
import { ModuleFactory } from "@/lib/app-core-modules/factory";
import { NextResponse } from "next/server";

/**
 * GET /api/workspaces/student/[workspaceId]/billing/tiers
 * Get available subscription tiers
 */
export const GET = withApiHandler(
    async (req: any, { ctx, log, params }) => {
        try {
            const modules = new ModuleFactory(ctx);
            const tiers = await modules.payment.getAvailableTiers();

            return NextResponse.json({
                success: true,
                data: tiers,
            }) as any;
        } catch (error) {
            log.error("Tiers fetch error", error);
            return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 }) as any;
        }
    },
    {
        method: "GET",
        authRequired: true,
    }
);
