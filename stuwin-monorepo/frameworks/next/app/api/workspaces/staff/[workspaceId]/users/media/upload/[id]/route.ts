import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { unifiedApiHandler } from '@/lib/app-access-control/interceptors';

export const POST = unifiedApiHandler(async (request: NextRequest, { params, module }) => {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  const body = await request.json();
  const { fileType, fileName } = body;

  const result = await module.workspace.getUserMediaUploadUrl(id, fileName, fileType);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: (result as any).code || 500 });
  }

  return NextResponse.json(result.data, { status: 200 });
});
