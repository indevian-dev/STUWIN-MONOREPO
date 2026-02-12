import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { unifiedApiHandler } from "@/lib/middleware/handlers";

export const PUT = unifiedApiHandler(async (request, { module, params, isValidSlimId, log, auth }) => {
  const subjectId = params?.id as string;
  const topicId = params?.topicId as string;

  if (!subjectId || !topicId || !isValidSlimId(subjectId) || !isValidSlimId(topicId)) {
    return NextResponse.json(
      { success: false, error: "Invalid subject ID or topic ID" },
      { status: 400 },
    );
  }

  try {
    // Parse request body
    const body = await request.json();

    // Prepare update data (only include fields that are provided)
    const updateData: any = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.gradeLevel !== undefined)
      updateData.gradeLevel = body.gradeLevel;
    if (body.language !== undefined)
      updateData.language = body.language;
    if (body.aiSummary !== undefined) updateData.aiSummary = body.aiSummary;
    if (body.chapterNumber !== undefined)
      updateData.chapterNumber = body.chapterNumber;
    if (body.topicEstimatedQuestionsCapacity !== undefined) {
      updateData.topicEstimatedQuestionsCapacity =
        body.topicEstimatedQuestionsCapacity;
    }
    if (body.pdfPageStart !== undefined)
      updateData.pdfPageStart = body.pdfPageStart;
    if (body.pdfPageEnd !== undefined)
      updateData.pdfPageEnd = body.pdfPageEnd;
    if (body.estimatedEducationStartDate !== undefined) {
      updateData.estimatedEducationStartDate =
        body.estimatedEducationStartDate;
    }
    if (body.isActiveAiGeneration !== undefined) {
      updateData.isActiveAiGeneration = body.isActiveAiGeneration;
    }
    if (body.aiAssistantCrib !== undefined) {
      updateData.aiAssistantCrib = body.aiAssistantCrib;
    }

    const result = await module.topic.update(topicId, updateData);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to update topic" },
        { status: 500 }
      );
    }

    log.info("Topic updated successfully", {
      subjectId,
      topicId,
      accountId: auth.accountId,
      updatedFields: Object.keys(updateData),
    });

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error: any) {
    log.error("Failed to update topic", {
      error: error.message,
      stack: error.stack,
      subjectId,
      topicId,
      accountId: auth.accountId,
    });

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update topic",
      },
      { status: 500 },
    );
  }
});
