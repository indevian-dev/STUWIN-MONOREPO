import { NextRequest, NextResponse } from "next/server";
import { unifiedApiHandler } from "@/lib/app-access-control/interceptors";

export const GET = unifiedApiHandler(async (request: NextRequest, { authData, module, log }) => {
  try {
    if (!authData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (!type) {
      return NextResponse.json({ error: 'Type parameter is required' }, { status: 400 });
    }

    const page = await module.content.getPage(type);

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    return NextResponse.json({ doc: page, success: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch page';
    if (log) log.error("Failed to fetch page", error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
});
