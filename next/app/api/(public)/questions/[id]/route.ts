import { NextResponse } from 'next/server';
import { unifiedApiHandler } from '@/lib/middleware/handlers';

export const GET = unifiedApiHandler(async (request, { module, params }) => {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Valid question ID is required" }, { status: 400 });
  }

  const questionResult = await module.question.getById(id as string);

  if (!questionResult.success || !questionResult.data) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  const questionData = questionResult.data;

  // Check if active (published)
  // The repo result includes { question: ..., subject: ... } structure now
  const { question } = questionData as any; // Type assertion as repo returns joined object now

  if (!question.isPublished) {
    return NextResponse.json({ error: "Question not found or not active" }, { status: 404 });
  }

  // Map to legacy format
  const legacyQuestion = module.question.mapToLegacy(questionData);

  return NextResponse.json({
    question: legacyQuestion
  }, { status: 200 });
});
