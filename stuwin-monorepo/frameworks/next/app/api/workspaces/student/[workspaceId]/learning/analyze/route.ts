import { NextRequest, NextResponse } from "next/server";
import { unifiedApiHandler, type UnifiedContext } from "@/lib/app-access-control/interceptors/ApiInterceptor";

/**
 * POST /api/workspaces/student/[workspaceId]/learning/analyze
 * Generic learning session analysis/exploration
 */
export const POST = unifiedApiHandler(
    async (request: NextRequest, { module, auth, log, params }: UnifiedContext) => {
        try {
            const body = await request.json();
            const { contextType, contextId, question, locale } = body;

            if (!contextType || !contextId || !question) {
                return NextResponse.json({
                    success: false,
                    error: "contextType, contextId, and question are required"
                }, { status: 400 });
            }

            const result = await module.activity.analyzeLearningContext({
                ...body,
                locale: locale || 'en', // Fallback to English
                accountId: auth.accountId,
                workspaceId: params?.workspaceId as string
            });

            if (!result.success) {
                log.error("Failed to analyze learning context", { contextType, contextId, error: result.error });
                return NextResponse.json({ success: false, error: result.error });
            }

            return NextResponse.json({
                success: true,
                data: result.data,
            });

        } catch (error) {
            log.error("Learning analysis error", error);
            return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
        }
    },
);
