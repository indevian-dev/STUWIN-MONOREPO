
import { NextResponse } from 'next/server';
import { unifiedApiHandler } from '@/lib/app-access-control/interceptors';
import {
  ValidationService,
  Rules,
  Sanitizers
} from '@/lib/app-core-modules/services/ValidationService';

export const GET = unifiedApiHandler(async (request, { module, auth }) => {
  const { searchParams } = new URL(request.url);
  const workspaceId = (request as any).params?.workspaceId;
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

  const subjectId = searchParams.get('subjectId') || undefined;

  const complexity = searchParams.get('complexity') || undefined;
  const gradeLevelParam = searchParams.get('gradeLevel');
  const gradeLevel = gradeLevelParam ? parseInt(gradeLevelParam, 10) : undefined;

  const filterAuthorId = searchParams.get('authorAccountId') || undefined;

  const result = await module.learning.listQuestions({
    page,
    pageSize,
    subjectId,
    complexity,
    gradeLevel,
    authorAccountId: filterAuthorId,
    onlyPublished: false, // Providers need to see drafts
    workspaceId
  });

  if (!result.success || !result.data) {
    return NextResponse.json({ error: result.error || "Failed" }, { status: 500 });
  }

  const { questions, pagination } = result.data;

  return NextResponse.json({
    success: true,
    data: {
      questions,
      ...pagination
    }
  });
});

export const POST = unifiedApiHandler(async (request, { module, auth }) => {
  const accountId = auth.accountId;
  try {
    const body = await request.json();

    // Reuse ValidationService logic from legacy
    const validation = ValidationService.validate(body, {
      body: {
        rules: [
          Rules.required('body'),
          Rules.string('body'),
          Rules.minLength('body', 5)
        ],
        sanitizers: [Sanitizers.trim]
      },
      subject_id: {
        // Changed to allowing number or string but sanitized to number if possible
        rules: [Rules.required('subject_id')],
        sanitizers: []
      },
      grade_level: {
        rules: [Rules.required('grade_level')],
        sanitizers: [Sanitizers.toInt]
      },
      complexity: {
        rules: [
          Rules.required('complexity'),
          Rules.oneOf('complexity', ['easy', 'medium', 'hard', 'expert']) as any
        ],
        sanitizers: [Sanitizers.trim, Sanitizers.lowercase]
      },
      answers: {
        rules: [
          Rules.required('answers'),
          Rules.array('answers'),
          Rules.arrayMinLength('answers', 2)
        ],
        sanitizers: []
      },
      correct_answer: {
        rules: [Rules.required('correct_answer'), Rules.string('correct_answer') as any],
        sanitizers: [Sanitizers.trim]
      }
    });

    if (!validation.isValid) {
      return NextResponse.json({
        error: validation.firstError?.message || 'Validation failed',
        errorCount: validation.errors.length
      }, { status: 400 });
    }

    const sanitized = validation.sanitized as any;
    const {
      body: questionBody,
      subject_id,
      grade_level,
      complexity,
      answers,
      correct_answer,
      explanation_guide
    } = sanitized;

    // Verify correct_answer is in answers
    if (!answers.includes(correct_answer)) {
      return NextResponse.json({
        error: 'Correct answer must be one of the answer options'
      }, { status: 400 });
    }

    const workspaceId = (request as any).params?.workspaceId;

    // Create via service
    const result = await module.learning.createQuestion({
      question: questionBody,
      learningSubjectId: subject_id,
      gradeLevel: grade_level,
      complexity,
      answers,
      correctAnswer: correct_answer,
      explanationGuide: explanation_guide ? { content: explanation_guide } : null,
      language: 'az', // Default for now
      workspaceId
    }, accountId);

    if (!result.success || !result.data) {
      throw new Error(result.error);
    }

    return NextResponse.json({
      message: 'Question created successfully',
      question: result.data
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating question:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to create question'
    }, { status: 500 });
  }
});
