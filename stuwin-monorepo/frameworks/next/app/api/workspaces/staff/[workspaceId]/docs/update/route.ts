import { NextRequest, NextResponse } from "next/server";
import { unifiedApiHandler } from "@/lib/app-access-control/interceptors";

export const PATCH = unifiedApiHandler(async (request: NextRequest, { authData, module }) => {
  if (!authData) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  if (!type) {
    return NextResponse.json({ error: 'Valid page type is required' }, { status: 400 });
  }

  const body = await request.json();
  const result = await module.content.updatePageContent(type, body);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: (result as any).code || 500 });
  }

  return NextResponse.json({
    message: 'Page updated successfully',
    doc: result.data
  });
});
