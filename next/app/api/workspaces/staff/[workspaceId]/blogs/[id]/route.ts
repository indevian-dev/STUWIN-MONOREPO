import { NextRequest, NextResponse } from "next/server";
import { unifiedApiHandler } from "@/lib/middleware/handlers";
import slugify from 'slugify';

export const GET = unifiedApiHandler(async (request: NextRequest, { params, module, log }) => {
  if (!params) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Invalid blog ID' }, { status: 400 });
  }

  try {
    const blog = await module.content.contentRepo.findBlogById(id);

    if (!blog) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }
    return NextResponse.json({ blog }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch blog';
    if (log) log.error("Failed to fetch blog", error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
});

