import { NextResponse, NextRequest } from "next/server";
import { unifiedApiHandler } from "@/lib/app-access-control/interceptors";

/**
 * GET /api/workspaces/student/[workspaceId]/learning/session
 * Fetch active learning session for a specific context
 */
export const GET = unifiedApiHandler(
    async (request: NextRequest, { module, auth, log }) => {
        try {
            const { searchParams } = new URL(request.url);
            const contextType = searchParams.get('contextType') as 'quiz' | 'homework' | 'topic';
            const contextId = searchParams.get('contextId');

            if (!contextType || !contextId) {
                return NextResponse.json({
                    success: false,
                    error: "contextType and contextId are required"
                }, { status: 400 });
            }

            const result = await module.activity.getSession(
                auth.accountId,
                contextId,
                contextType
            );

            if (!result.success) {
                log.error("Failed to fetch learning session", { contextType, contextId, error: result.error });
                return NextResponse.json({ success: false, error: result.error });
            }

            return NextResponse.json({
                success: true,
                data: result.data,
            });

        } catch (error) {
            log.error("Learning session fetch error", error);
            return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
        }
    }
);
