
import { NextRequest, NextResponse } from "next/server";
import { withApiHandler } from "@/lib/app-access-control/interceptors";
import { workspaces } from "@/lib/app-infrastructure/database/schema";
import { and, eq, count, isNotNull, ne } from "drizzle-orm";

// GET /api/providers/stats
// Returns statistics about educational providers
export const GET = withApiHandler(
    async (request: NextRequest, { log, db }) => {
        try {
            // Get total count of active providers
            const totalResult = await db
                .select({ value: count() })
                .from(workspaces)
                .where(
                    and(
                        eq(workspaces.type, 'provider'),
                        eq(workspaces.isActive, true)
                    )
                );
            const total = totalResult[0]?.value || 0;

            // Get count with location (cityId is not null as proxy for location?) 
            // The original code checked `address` in `ORGANIZATIONS` table.
            // `workspaces` table has `cityId`. Or maybe checking metadata?
            // Let's check `cityId` for now as a proxy for "with location".

            const withLocationResult = await db
                .select({ value: count() })
                .from(workspaces)
                .where(
                    and(
                        eq(workspaces.type, 'provider'),
                        eq(workspaces.isActive, true),
                        isNotNull(workspaces.cityId)
                    )
                );
            const withLocation = withLocationResult[0]?.value || 0;

            return NextResponse.json({
                total,
                active: total,
                withLocation,
            });
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "Failed to fetch stats";
            return NextResponse.json({ error: message }, { status: 500 });
        }
    },
    {
        method: "GET",
        authRequired: false
    }
);
