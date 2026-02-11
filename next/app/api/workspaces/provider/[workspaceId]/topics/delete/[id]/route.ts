import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { unifiedApiHandler, type UnifiedContext } from "@/lib/middleware/handlers/ApiInterceptor";

export const DELETE = unifiedApiHandler(
  async (request: NextRequest, { module, params, log }: UnifiedContext) => {
    const topicId = params?.id as string;

    if (!topicId) {
      return NextResponse.json({ error: "Topic ID is required" }, { status: 400 });
    }

    try {
      const result = await module.topic.delete(topicId);

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 404 });
      }

      return NextResponse.json({
        message: "Topic deleted successfully",
      }, { status: 200 });
    } catch (error) {
      log.error("Failed to delete topic", error);
      return NextResponse.json({ error: "Failed to delete topic" }, { status: 500 });
    }
  },
);
