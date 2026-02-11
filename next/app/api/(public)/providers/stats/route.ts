import { NextRequest, NextResponse } from "next/server";
import { unifiedApiHandler } from "@/lib/middleware/handlers";

// GET /api/providers/stats
// Returns statistics about educational providers
export const GET = unifiedApiHandler(
    async (request: NextRequest, { module }) => {
        const result = await module.support.getPublicProviderStats();

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json(result.data);
    },
    {
        authRequired: false
    }
);
