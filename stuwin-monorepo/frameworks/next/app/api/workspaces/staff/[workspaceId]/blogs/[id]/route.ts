import type { NextRequest } from 'next/server';
import type { ApiRouteHandler, ApiHandlerContext } from '@/types/next';
import { NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/app-access-control/interceptors';
import { BLOGS } from '@/lib/app-infrastructure/database';
import slugify from 'slugify';
export const GET: ApiRouteHandler = withApiHandler(async (request: NextRequest, { params, authData, log, db }: ApiHandlerContext) => {
  if (!params) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }
  const { id } = await params;
  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'Invalid blog ID' }, { status: 400 });
  }
  const blogRecordId = id.includes(':') ? id : `${BLOGS}:${id}`;
  try {
    const [blog] = await db.query(
      `SELECT * FROM ${BLOGS} WHERE id = $blogId LIMIT 1`,
      { blogId: blogRecordId }
    );
    if (!blog) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }
    return NextResponse.json({ blog }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch blog';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
});
export const PUT: ApiRouteHandler = withApiHandler(async (request: NextRequest, { params, authData, log, db }: ApiHandlerContext) => {
  if (!params) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }
  const { id } = await params;
  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'Invalid blog ID' }, { status: 400 });
  }
  const blogRecordId = id.includes(':') ? id : `${BLOGS}:${id}`;
  try {
    if (!authData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const accountId = authData.account.id;
    const body = await request.json();
    const {
      titleAz,
      titleEn,
      metaTitleAz,
      metaTitleEn,
      metaDescriptionAz,
      metaDescriptionEn,
      contentAz,
      contentEn,
      cover,
      isActive,
      isFeatured
    } = body;
    const updateData: any = {
      updatedAt: new Date(),
    };
    if (titleAz !== undefined) updateData.titleAz = titleAz;
    if (titleEn !== undefined) updateData.titleEn = titleEn;
    if (metaTitleAz !== undefined) updateData.metaTitleAz = metaTitleAz;
    if (metaTitleEn !== undefined) updateData.metaTitleEn = metaTitleEn;
    if (metaDescriptionAz !== undefined) updateData.metaDescriptionAz = metaDescriptionAz;
    if (metaDescriptionEn !== undefined) updateData.metaDescriptionEn = metaDescriptionEn;
    if (contentAz !== undefined) updateData.contentAz = contentAz;
    if (contentEn !== undefined) updateData.contentEn = contentEn;
    if (cover !== undefined) updateData.cover = cover;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured;
    // Update slug if title changed
    if (titleAz || titleEn) {
      updateData.slug = slugify(titleAz || titleEn, { lower: true, strict: true });
    }
    const updated = await db.query(
      'UPDATE $record SET $data RETURN AFTER',
      { record: blogRecordId, data: updateData }
    );
    const updatedBlog = updated[0];
    if (!updatedBlog) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }
    return NextResponse.json({ blog: updatedBlog }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update blog';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
});
export const DELETE: ApiRouteHandler = withApiHandler(async (request: NextRequest, { params, authData, log, db }: ApiHandlerContext) => {
  if (!params) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }
  const { id } = await params;
  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'Invalid blog ID' }, { status: 400 });
  }
  const blogRecordId = id.includes(':') ? id : `${BLOGS}:${id}`;
  try {
    if (!authData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const accountId = authData.account.id;
    const deleted = await db.query(
      'DELETE $record RETURN BEFORE',
      { record: blogRecordId }
    );
    const deletedBlog = deleted[0];
    if (!deletedBlog) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Blog deleted successfully' }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete blog';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
});
