import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/app-access-control/interceptors';
import { SUBJECTS, ORG_PLATFORM } from '@/lib/app-infrastructure/database';
import slugify from 'slugify';
import type { ApiRouteHandler, ApiHandlerContext } from '@/types/next';
export const POST: ApiRouteHandler = withApiHandler(async (request: NextRequest, { authData, log, db }: ApiHandlerContext) => {
  try {
    if (!authData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const accountId = authData.account.id;
    const body = await request.json();
    const { title, description, cover, aiLabel } = body;
    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      );
    }
    const slug = slugify(title, { lower: true, strict: true });
    const insertData: Record<string, unknown> = {
      title,
      description,
      slug,
      isActive: true,
      organizationId: ORG_PLATFORM,
      isGlobal: true,
      createdAt: new Date(),
    };
    if (cover) {
      insertData.cover = cover;
    }
    if (aiLabel) {
      insertData.aiLabel = aiLabel;
    }
    const created = await db.query(`CREATE ${SUBJECTS} CONTENT $data`, {
      data: insertData,
    });
    const subject = created[0];
    return NextResponse.json({ subject }, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create subject';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
});
