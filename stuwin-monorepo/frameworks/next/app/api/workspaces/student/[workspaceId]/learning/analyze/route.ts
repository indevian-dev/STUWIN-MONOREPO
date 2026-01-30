import { withApiHandler } from "@/lib/app-access-control/interceptors";
import { ModuleFactory } from "@/lib/app-core-modules/factory";
import { NextResponse } from "next/server";

/**
 * POST /api/workspaces/student/[workspaceId]/learning/analyze
 * Generic learning session analysis/exploration
 */
export const POST = withApiHandler(
    async (req: any, { ctx, log, params }) => {
        try {
            const body = await req.json();
            const { contextType, contextId, question, locale } = body;
            const modules = new ModuleFactory(ctx);

            if (!contextType || !contextId || !question) {
                return NextResponse.json({
                    success: false,
                    error: "contextType, contextId, and question are required"
                }, { status: 400 }) as any;
            }

            const result = await modules.activity.analyzeLearningContext({
                ...body,
                locale: locale || 'en', // Fallback to English
                accountId: ctx.accountId,
                workspaceId: params.workspaceId
            });

            if (!result.success) {
                log.error("Failed to analyze learning context", { contextType, contextId, error: result.error });
                return NextResponse.json({ success: false, error: result.error }) as any;
            }

            return NextResponse.json({
                success: true,
                data: result.data,
            }) as any;

        } catch (error) {
            log.error("Learning analysis error", error);
            return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 }) as any;
        }
    },
    {
        method: "POST",
        authRequired: true,
    }
);
