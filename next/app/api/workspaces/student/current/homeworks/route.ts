import { NextRequest, NextResponse } from "next/server";
import { unifiedApiHandler, type UnifiedContext } from "@/lib/middleware/handlers/ApiInterceptor";

/**
 * GET /api/workspaces/student/current/homeworks
 * List all homeworks for the student's active workspace
 */
export const GET = unifiedApiHandler(
    async (req: NextRequest, { module, auth, log }: UnifiedContext) => {
        const result = await module.homework.list(auth.accountId!);

        if (!result.success) {
            log.error("Failed to list homeworks", { error: result.error });
            return NextResponse.json({ success: false, error: result.error });
        }

        return NextResponse.json({
            success: true,
            data: result.data,
        });
    },
    {
        method: "GET",
        authRequired: true,
    },
);

/**
 * POST /api/workspaces/student/current/homeworks
 * Create a new homework submission
 */
export const POST = unifiedApiHandler(
    async (req: NextRequest, { module, auth, log }: UnifiedContext) => {
        try {
            const body = await req.json();

            if (!body.title) {
                return NextResponse.json({ success: false, error: "Title is required" }, { status: 400 });
            }

            const result = await module.homework.submit(auth.accountId!, {
                title: body.title,
                workspaceId: auth.activeWorkspaceId!,
                topicId: body.topicId,
                description: body.description,
                textContent: body.textContent,
                media: body.media || [],
            });

            if (!result.success) {
                log.error("Failed to submit homework", { error: result.error });
                return NextResponse.json({ success: false, error: result.error });
            }

            return NextResponse.json({
                success: true,
                data: result.data,
            }, { status: 201 });
        } catch (error) {
            log.error("POST homework error", error);
            return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
        }
    },
    {
        method: "POST",
        authRequired: true,
    }
);
