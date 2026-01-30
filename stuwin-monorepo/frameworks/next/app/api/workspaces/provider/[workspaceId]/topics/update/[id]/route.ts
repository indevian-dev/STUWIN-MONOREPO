import type { NextRequest } from "next/server";
import type {
  ApiRouteHandler,
  ApiHandlerContext,
} from "@/types/next";
import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/app-access-control/interceptors";
import { TOPICS } from "@/lib/app-infrastructure/database";
export const PUT: ApiRouteHandler = withApiHandler(
  async (
    request: NextRequest,
    { authData, params, log, db, isValidSlimId }: ApiHandlerContext,
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
    if (!topicId || !isValidSlimId(topicId)) {
      return NextResponse.json(
        {
          error: "Topic ID is required",
        },
        { status: 400 },
      );
    }
    try {
      const body = await request.json();
      const {
        name,
        body: topicBody,
        ai_summary,
        grade_level,
        subject_id,
        is_active_for_ai,
        topic_estimated_questions_capacity,
        topic_questions_ramaining_to_generate,
      } = body;
      if (
        name === undefined &&
        topicBody === undefined &&
        ai_summary === undefined &&
        grade_level === undefined &&
        subject_id === undefined &&
        is_active_for_ai === undefined &&
        topic_estimated_questions_capacity === undefined &&
        topic_questions_ramaining_to_generate === undefined
      ) {
        return NextResponse.json(
          {
            error: "No fields to update",
          },
          { status: 400 },
        );
      }
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

      const updateData: Record<string, unknown> = {};
      if (name !== undefined) {
        updateData.name = name;
      }
      if (topicBody !== undefined) {
        updateData.body = topicBody;
      }
      if (ai_summary !== undefined) {
        updateData.aiSummary = ai_summary;
      }
      if (grade_level !== undefined) {
        updateData.gradeLevel = grade_level ? parseInt(grade_level) : null;
      }
      if (subject_id !== undefined) {
        if (subject_id && !isValidSlimId(String(subject_id))) {
          return NextResponse.json(
            { error: "Subject ID is invalid" },
            { status: 400 },
          );
        }
        updateData.subjectId = subject_id ? String(subject_id) : null;
      }
      if (is_active_for_ai !== undefined) {
        updateData.isActiveForAi = is_active_for_ai;
      }
      if (topic_estimated_questions_capacity !== undefined) {
        updateData.topicEstimatedQuestionsCapacity =
          topic_estimated_questions_capacity
            ? parseInt(topic_estimated_questions_capacity)
            : null;
      }
      if (topic_questions_ramaining_to_generate !== undefined) {
        updateData.topicQuestionsRemainingToGenerate =
          topic_questions_ramaining_to_generate
            ? parseInt(topic_questions_ramaining_to_generate)
            : null;
      }

      const updated = await db.query(
        "UPDATE $record SET $data RETURN AFTER",
        { record: topicRecordId, data: updateData }
      );
      const topic = updated[0];
      return NextResponse.json(
        {
          topic,
        },
        { status: 200 },
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update topic";
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
          error: "Failed to update topic",
        },
        { status: 500 },
      );
    }
  },
);
