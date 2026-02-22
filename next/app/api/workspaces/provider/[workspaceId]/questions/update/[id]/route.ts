
import { unifiedApiHandler } from '@/lib/middleware/_Middleware.index';
import { okResponse, errorResponse, serverErrorResponse } from '@/lib/middleware/Response.Api.middleware';

export const PUT = unifiedApiHandler(async (request, { module, params, auth }) => {
  const { id } = await params;

  if (!id) {
    return errorResponse("Invalid ID", 400);
  }

  const questionId = id as string;
  const body = await request.json();
  const {
    body: questionBody,
    answers,
    correct_answer,
    subject_id,
    complexity,
    grade_level,
    explanation_guide,
    ai_guide,
    is_published
  } = body;

  const hasUpdates = [
    questionBody,
    answers,
    correct_answer,
    subject_id,
    complexity,
    grade_level,
    explanation_guide,
    ai_guide,
    is_published
  ].some(v => v !== undefined && v !== null);

  if (!hasUpdates) {
    return errorResponse('At least one field must be updated', 400);
  }

  // Prepare update data
  const updateData: any = {};
  if (questionBody !== undefined) updateData.question = questionBody.trim();
  if (answers !== undefined) updateData.answers = answers;
  if (correct_answer !== undefined) updateData.correctAnswer = correct_answer;
  if (subject_id !== undefined) updateData.providerSubjectId = String(subject_id);
  if (complexity !== undefined) updateData.complexity = complexity;
  if (grade_level !== undefined) updateData.gradeLevel = parseInt(String(grade_level));
  if (explanation_guide !== undefined) updateData.explanationGuide = explanation_guide;
  if (ai_guide !== undefined) updateData.aiGuide = ai_guide;
  if (is_published !== undefined) updateData.isPublished = is_published;

  const result = await module.question.update(questionId, updateData);

  if (!result.success || !result.data) {
    return serverErrorResponse(result.error || "Update failed");
  }

  return okResponse(result.data, 'Question updated successfully');
});
