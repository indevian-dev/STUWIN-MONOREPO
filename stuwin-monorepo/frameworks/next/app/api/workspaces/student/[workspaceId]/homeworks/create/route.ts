import { NextRequest, NextResponse } from "next/server";
import { unifiedApiHandler } from "@/lib/app-access-control/interceptors";

/**
 * POST /api/workspaces/student/[workspaceId]/homeworks/create
 * Create a new homework submission
 */
export const POST = unifiedApiHandler(
  async (request: NextRequest, { module, auth, log, params }) => {
    try {
      const body = await request.json();
      const { title, description, topicId, media, textContent } = body;

      if (!title) {
        return NextResponse.json({ error: "title is required" }, { status: 400 });
      }

      log.info('Creating homework', { accountId: auth.accountId, title });

      const result = await module.activity.submitHomework(auth.accountId, {
        title,
        workspaceId: params.workspaceId as string,
        topicId,
        description,
        textContent,
        media: media || [],
      });

      if (!result.success || !result.data) {
        log.error("Failed to create homework", { error: result.error });
        return NextResponse.json({ error: result.error || "Failed to create homework" }, { status: 500 });
      }

      return NextResponse.json(
        {
          success: true,
          homework: result.data,
        },
        { status: 201 },
      );
    } catch (error) {
      log.error("POST homework error", error);
      return NextResponse.json({ error: "Failed to create homework" }, { status: 500 });
    }
  },
);
