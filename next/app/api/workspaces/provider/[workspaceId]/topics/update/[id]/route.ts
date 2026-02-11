import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { unifiedApiHandler, type UnifiedContext } from "@/lib/middleware/handlers/ApiInterceptor";

export const PUT = unifiedApiHandler(
  async (request: NextRequest, { module, params, log }: UnifiedContext) => {
    const topicId = params?.id as string;

    if (!topicId) {
      return NextResponse.json({ error: "Topic ID is required" }, { status: 400 });
    }

    try {
      const body = await request.json();
      const {
        name,
        description,
        body: topicBody, // compatibility
        ai_summary,
        grade_level,
        subject_id,
        is_active_for_ai,
        topic_estimated_questions_capacity,
        topic_questions_ramaining_to_generate,
        topic_questions_remaining_to_generate,
        language
      } = body;

      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined || topicBody !== undefined) {
        updateData.description = description || topicBody;
      }
      if (ai_summary !== undefined) updateData.aiSummary = ai_summary;
      if (grade_level !== undefined) updateData.gradeLevel = grade_level ? parseInt(String(grade_level)) : null;
      if (subject_id !== undefined) updateData.providerSubjectId = subject_id;
      if (is_active_for_ai !== undefined) updateData.isActiveForAi = is_active_for_ai;
      if (topic_estimated_questions_capacity !== undefined) {
        updateData.topicEstimatedQuestionsCapacity = topic_estimated_questions_capacity ? parseInt(String(topic_estimated_questions_capacity)) : null;
      }
      if (topic_questions_ramaining_to_generate !== undefined || topic_questions_remaining_to_generate !== undefined) {
        updateData.topicQuestionsRemainingToGenerate = (topic_questions_ramaining_to_generate || topic_questions_remaining_to_generate)
          ? parseInt(String(topic_questions_ramaining_to_generate || topic_questions_remaining_to_generate))
          : null;
      }
      if (language !== undefined) updateData.language = language;

      if (Object.keys(updateData).length === 0) {
        return NextResponse.json({ error: "No fields to update" }, { status: 400 });
      }

      const result = await module.topic.update(topicId, updateData);

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({
        topic: result.data,
      }, { status: 200 });
    } catch (error) {
      log.error("Failed to update topic", error);
      return NextResponse.json({ error: "Failed to update topic" }, { status: 500 });
    }
  },
);
