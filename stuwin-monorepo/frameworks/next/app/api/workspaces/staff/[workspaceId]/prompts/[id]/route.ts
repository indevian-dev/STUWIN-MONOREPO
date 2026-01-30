import type { NextRequest } from 'next/server';
import type { ApiRouteHandler, ApiHandlerContext } from '@/types/next';
import { NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/app-access-control/interceptors';
import { PROMPTS } from '@/lib/app-infrastructure/database';
export const GET: ApiRouteHandler = withApiHandler(async (request: NextRequest, { params, authData, log, db }: ApiHandlerContext) => {
  if (!params) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }
  const { id } = await params;
  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'Invalid prompt ID' }, { status: 400 });
  }
  const promptRecordId = id.includes(':') ? id : `${PROMPTS}:${id}`;
  try {
    const [prompt] = await db.query(
      `SELECT * FROM ${PROMPTS} WHERE id = $promptId LIMIT 1`,
      { promptId: promptRecordId }
    );
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }
    return NextResponse.json({ prompt }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch prompt';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
});
export const PUT: ApiRouteHandler = withApiHandler(async (request: NextRequest, { params, authData, log, db }: ApiHandlerContext) => {
  if (!params) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }
  const { id } = await params;
  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'Invalid prompt ID' }, { status: 400 });
  }
  const promptRecordId = id.includes(':') ? id : `${PROMPTS}:${id}`;
  try {
    if (!authData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const accountId = authData.account.id;
    const body = await request.json();
    const { body: promptBody, title } = body;
    const updateData: any = {};
    if (promptBody !== undefined) updateData.body = promptBody;
    if (title !== undefined) updateData.title = title;
    const updated = await db.query(
      'UPDATE $record SET $data RETURN AFTER',
      { record: promptRecordId, data: updateData }
    );
    const updatedPrompt = updated[0];
    if (!updatedPrompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }
    return NextResponse.json({ prompt: updatedPrompt }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update prompt';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
});
export const DELETE: ApiRouteHandler = withApiHandler(async (request: NextRequest, { params, authData, log, db }: ApiHandlerContext) => {
  if (!params) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }
  const { id } = await params;
  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'Invalid prompt ID' }, { status: 400 });
  }
  const promptRecordId = id.includes(':') ? id : `${PROMPTS}:${id}`;
  try {
    if (!authData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const accountId = authData.account.id;
    const deleted = await db.query(
      'DELETE $record RETURN BEFORE',
      { record: promptRecordId }
    );
    const deletedPrompt = deleted[0];
    if (!deletedPrompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Prompt deleted successfully' }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete prompt';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
});
