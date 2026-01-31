import { NextResponse } from "next/server";
import { unifiedApiHandler } from "@/lib/app-access-control/interceptors";

/**
 * GET /api/workspaces/root/billing/tiers
 * Get available subscription tiers
 */
export const GET = unifiedApiHandler(async (req, { module, log }) => {
    try {
        const tiers = await module.payment.getAvailableTiers();

        return NextResponse.json({
            success: true,
            data: tiers,
        });
    } catch (error) {
        if (log) log.error("Failed to fetch billing tiers", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
});
