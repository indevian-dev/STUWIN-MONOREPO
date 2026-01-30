import { withApiHandler } from "@/lib/app-access-control/interceptors";
import { ModuleFactory } from "@/lib/app-core-modules/factory";
import { NextResponse } from "next/server";

/**
 * GET /api/workspaces/student/[workspaceId]/learning/session
 * Fetch active learning session for a specific context
 */
export const GET = withApiHandler(
    async (req: any, { ctx, log, params }) => {
        try {
            const { searchParams } = new URL(req.url);
            const contextType = searchParams.get('contextType') as 'quiz' | 'homework' | 'topic';
            const contextId = searchParams.get('contextId');

            if (!contextType || !contextId) {
                return NextResponse.json({
                    success: false,
                    error: "contextType and contextId are required"
                }, { status: 400 }) as any;
            }

            const modules = new ModuleFactory(ctx);
            const result = await modules.activity.getSession(
                ctx.accountId,
                contextId,
                contextType
            );

            if (!result.success) {
                log.error("Failed to fetch learning session", { contextType, contextId, error: result.error });
                return NextResponse.json({ success: false, error: result.error }) as any;
            }

            return NextResponse.json({
                success: true,
                data: result.data,
            }) as any;

        } catch (error) {
            log.error("Learning session fetch error", error);
            return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 }) as any;
        }
    },
    {
        method: "GET",
        authRequired: true,
    }
);
