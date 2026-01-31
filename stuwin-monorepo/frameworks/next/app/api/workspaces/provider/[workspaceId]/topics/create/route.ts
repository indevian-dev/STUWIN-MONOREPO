import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { unifiedApiHandler, type UnifiedContext } from '@/lib/app-access-control/interceptors';

export const POST = unifiedApiHandler(async (request: NextRequest, { module, auth }: UnifiedContext) => {
  try {
    const body = await request.json();
    const {
      name,
      description,
      body: topicBody, // compatibility 
      ai_summary,
      grade_level,
      subject_id,
      language,
      pdfId
    } = body;

    if (!name) {
      return NextResponse.json({
        error: 'Topic name is required'
      }, { status: 400 });
    }

    if (!subject_id) {
      return NextResponse.json({
        error: 'Subject ID is required'
      }, { status: 400 });
    }

    const result = await module.learning.createTopicWithContent(subject_id, {
      name,
      description: description || topicBody || '',
      gradeLevel: grade_level ? parseInt(String(grade_level)) : undefined,
      language,
      pdfId
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      topic: result.data
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to create topic'
    }, { status: 500 });
  }
});
