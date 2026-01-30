import { withApiHandler } from "@/lib/app-access-control/interceptors";
import { ModuleFactory } from "@/lib/app-core-modules/factory";
import { NextResponse } from "next/server";

/**
 * GET /api/workspaces/student/[workspaceId]/homeworks
 * List all student's homeworks using Service layer
 */
export const GET = withApiHandler(
  async (req: any, { ctx, log }) => {
    const modules = new ModuleFactory(ctx);
    const result = await modules.activity.listHomeworks(ctx.accountId!);

    if (!result.success) {
      log.error("Failed to list homeworks", { error: result.error });
      return NextResponse.json({ success: false, error: result.error }) as any;
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    }) as any;
  },
  {
    method: "GET",
    authRequired: true,
  },
);

/**
 * POST /api/workspaces/student/[workspaceId]/homeworks
 * Create a new homework submission using Service layer
 */
export const POST = withApiHandler(
  async (req: any, { ctx, log }) => {
    try {
      const body = await req.json();

      if (!body.title) {
        return NextResponse.json({ success: false, error: "Title is required" }, { status: 400 }) as any;
      }

      const modules = new ModuleFactory(ctx);
      const result = await modules.activity.submitHomework(ctx.accountId!, {
        title: body.title,
        workspaceId: ctx.activeWorkspaceId!,
        topicId: body.topicId,
        description: body.description,
        textContent: body.textContent,
        media: body.media || [],
      });

      if (!result.success) {
        log.error("Failed to submit homework", { error: result.error });
        return NextResponse.json({ success: false, error: result.error }) as any;
      }

      return NextResponse.json({
        success: true,
        data: result.data,
      }, { status: 201 }) as any;
    } catch (error) {
      log.error("POST homework error", error);
      return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 }) as any;
    }
  },
  {
    method: "POST",
    authRequired: true,
  }
);
