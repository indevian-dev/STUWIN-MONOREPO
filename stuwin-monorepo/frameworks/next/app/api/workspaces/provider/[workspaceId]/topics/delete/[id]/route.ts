import type { NextRequest } from "next/server";
import type {
  ApiRouteHandler,
  ApiHandlerContext,
} from "@/types/next";
import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/app-access-control/interceptors";
import { TOPICS } from "@/lib/app-infrastructure/database";
export const DELETE: ApiRouteHandler = withApiHandler(
  async (
    request: NextRequest,
    { authData, params, log, db }: ApiHandlerContext,
  ) => {
    if (!authData) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        { status: 401 },
      );
    }
    const resolvedParams = await params;
    const topicId = (resolvedParams as Record<string, string>)?.id;
    const accountId = authData.account.id;
    if (!topicId) {
      return NextResponse.json(
        {
          error: "Topic ID is required",
        },
        { status: 400 },
      );
    }
    try {
      const topicRecordId = topicId.includes(":")
        ? topicId
        : `${TOPICS}:${topicId}`;

      const [existingTopic] = await db.query(
        `SELECT id FROM ${TOPICS} WHERE id = $topicId LIMIT 1`,
        { topicId: topicRecordId }
      );

      if (!existingTopic) {
        throw new Error("TOPIC_NOT_FOUND");
      }

      await db.query("DELETE $record", { record: topicRecordId });
      return NextResponse.json(
        {
          message: "Topic deleted successfully",
        },
        { status: 200 },
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete topic";
      if (errorMessage === "TOPIC_NOT_FOUND") {
        return NextResponse.json(
          {
            error: "Topic not found",
          },
          { status: 404 },
        );
      }
      return NextResponse.json(
        {
          error: "Failed to delete topic",
        },
        { status: 500 },
      );
    }
  },
);
