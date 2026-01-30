import type { ApiRouteHandler, ApiHandlerContext } from '@/types/next';
import { NextRequest, NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/app-access-control/interceptors';
import { PAGES } from '@/lib/app-infrastructure/database';
export const PATCH: ApiRouteHandler = withApiHandler(async (request: NextRequest, { authData, log, db }: ApiHandlerContext) => {
  if (!authData) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // Get type from search params
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  // Get authenticated account ID from authData
  const authAccId = authData.account.id;
  if (!type) {
    return NextResponse.json({ error: 'Valid page type is required' }, { status: 400 });
  }
  try {
    // Parse request body
    const body = await request.json();
    const {
      type: bodyType,
      content_az,
      content_ru,
      content_en,
      meta_title
    } = body;
    // Use type from search params, not from body
    const pageType = type;
    // Validate that at least one field is provided for update
    if (!bodyType && !content_az && !content_ru && !content_en && !meta_title) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }
    // Check if page exists first
    const [existingPage] = await db.query(
      `SELECT id FROM ${PAGES} WHERE type = $type LIMIT 1`,
      { type: pageType }
    );

    if (!existingPage) {
      throw new Error('Page not found');
    }

    // If type is being updated, check for uniqueness constraint
    if (bodyType) {
      const [typeExists] = await db.query(
        `SELECT id FROM ${PAGES} WHERE type = $type AND id != $currentId LIMIT 1`,
        { type: bodyType, currentId: existingPage.id }
      );

      if (typeExists) {
        throw new Error('Page type already exists');
      }
    }

    // Build the update object dynamically
    const updateData: Record<string, unknown> = {};
    if (bodyType !== undefined) {
      updateData.type = bodyType;
    }
    if (content_az !== undefined) {
      updateData.contentAz = content_az;
    }
    if (content_ru !== undefined) {
      updateData.contentRu = content_ru;
    }
    if (content_en !== undefined) {
      updateData.contentEn = content_en;
    }
    if (meta_title !== undefined) {
      updateData.metaTitle = meta_title;
    }
    updateData.updatedAt = new Date();

    const updated = await db.query(
      'UPDATE $record SET $data RETURN AFTER',
      { record: existingPage.id, data: updateData }
    );
    const result = updated[0];
    return NextResponse.json({
      message: 'Page updated successfully',
      doc: result
    }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update page';
    const errorObj = error as { code?: string; constraint?: string };
    if (errorMessage === 'Page not found') {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }
    if (errorMessage === 'Page type already exists') {
      return NextResponse.json({ error: 'Page type already exists' }, { status: 409 });
    }
    // Handle unique constraint violation from database
    if (errorObj.code === '23505' && errorObj.constraint === 'pages_type_key') {
      return NextResponse.json({ error: 'Page type already exists' }, { status: 409 });
    }
    return NextResponse.json({
      error: errorMessage
    }, { status: 500 });
  }
});
