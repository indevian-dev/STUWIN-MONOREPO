
import { NextResponse } from 'next/server';
import { unifiedApiHandler } from '@/lib/app-access-control/interceptors';

export const PUT = unifiedApiHandler(async (request, { module, params, auth }) => {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
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
    explanation_guide
  } = body;

  const hasUpdates = [
    questionBody,
    answers,
    correct_answer,
    subject_id,
    complexity,
    grade_level,
    explanation_guide
  ].some(v => v !== undefined && v !== null);

  if (!hasUpdates) {
    return NextResponse.json({ error: 'At least one field must be updated' }, { status: 400 });
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

  const result = await module.learning.updateQuestion(questionId, updateData);

  if (!result.success || !result.data) {
    return NextResponse.json({ error: result.error || "Update failed" }, { status: 500 });
  }

  return NextResponse.json({
    message: 'Question updated successfully',
    question: result.data
  }, { status: 200 });
});
