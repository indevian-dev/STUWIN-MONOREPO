import { NextRequest, NextResponse } from "next/server";
import { unifiedApiHandler } from "@/lib/app-access-control/interceptors";
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

export const PUT = unifiedApiHandler(async (request: NextRequest, { params, authData, module, log }) => {
  if (!params) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Invalid blog ID' }, { status: 400 });
  }

  try {
    if (!authData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    const updateData: any = {};
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

    // Update slug if title changed (prioritize ID, then EN)
    // Legacy logic used Az OR En. I'll stick to that.
    if (titleAz || titleEn) {
      updateData.slug = slugify(titleAz || titleEn, { lower: true, strict: true });
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const updatedBlog = await module.content.contentRepo.updateBlog(id, updateData);

    if (!updatedBlog) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }
    return NextResponse.json({ blog: updatedBlog }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update blog';
    if (log) log.error("Failed to update blog", error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
});

export const DELETE = unifiedApiHandler(async (request: NextRequest, { params, authData, module, log }) => {
  if (!params) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Invalid blog ID' }, { status: 400 });
  }

  try {
    if (!authData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const deletedBlog = await module.content.contentRepo.deleteBlog(id);

    if (!deletedBlog) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Blog deleted successfully' }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete blog';
    if (log) log.error("Failed to delete blog", error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
});
