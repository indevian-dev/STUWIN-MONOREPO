import { NextRequest, NextResponse } from "next/server";
import { unifiedApiHandler, type UnifiedContext } from "@/lib/app-access-control/interceptors/ApiInterceptor";

/**
 * GET /api/workspaces/student/[workspaceId]/homeworks
 * List all student's homeworks using Service layer
 */
export const GET = unifiedApiHandler(
  async (request: NextRequest, { module, auth, log }: UnifiedContext) => {
    const result = await module.activity.listHomeworks(auth.accountId);

    if (!result.success) {
      log.error("Failed to list homeworks", { error: result.error });
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  },
);

/**
 * POST /api/workspaces/student/[workspaceId]/homeworks
 * Create a new homework submission using Service layer
 */
export const POST = unifiedApiHandler(
  async (request: NextRequest, { module, auth, log, params }: UnifiedContext) => {
    try {
      const body = await request.json();

      if (!body.title) {
        return NextResponse.json({ success: false, error: "Title is required" }, { status: 400 });
      }

      const result = await module.activity.submitHomework(auth.accountId, {
        title: body.title,
        workspaceId: params?.workspaceId as string,
        topicId: body.topicId,
        description: body.description,
        textContent: body.textContent,
        media: body.media || [],
      });

      if (!result.success) {
        log.error("Failed to submit homework", { error: result.error });
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
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
);
