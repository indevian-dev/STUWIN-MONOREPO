import type { NextRequest } from 'next/server';
import type { ApiRouteHandler, ApiHandlerContext } from '@/types/next';
import { NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/app-access-control/interceptors';
export const POST: ApiRouteHandler = withApiHandler(async (request: NextRequest, { authData, log, db, isValidSlimId, generateSlimId }: ApiHandlerContext) => {
  try {
    if (!authData) {
      return NextResponse.json({
        error: 'Unauthorized'
      }, { status: 401 });
    }
    const accountId = authData.account.id;
    const body = await request.json();
    const {
      name,
      body: topicBody,
      ai_summary,
      grade_level,
      subject_id
    } = body;
    if (!name) {
      return NextResponse.json({
        error: 'Topic name is required'
      }, { status: 400 });
    }
    const insertData: any = {
      id: generateSlimId(),
      name,
      createdAt: new Date().toISOString(),
    };
    if (topicBody) {
      insertData.body = topicBody;
    }
    if (ai_summary) {
      insertData.aiSummary = ai_summary;
    }
    if (grade_level) {
      insertData.gradeLevel = parseInt(grade_level);
    }
    if (subject_id) {
      if (!isValidSlimId(String(subject_id))) {
        return NextResponse.json(
          { error: "Subject ID is invalid" },
          { status: 400 },
        );
      }
      insertData.subjectId = String(subject_id);
    }

    const topicResult = await db.query(
      'CREATE topics CONTENT $data',
      { data: insertData }
    );

    const topic = topicResult[0];
    return NextResponse.json({
      topic
    }, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create topic';
    return NextResponse.json({
      error: errorMessage
    }, { status: 500 });
  }
});
