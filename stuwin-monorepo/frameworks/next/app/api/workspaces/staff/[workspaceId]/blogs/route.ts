import { NextResponse } from 'next/server';
import { unifiedApiHandler } from '@/lib/app-access-control/interceptors';
import slugify from 'slugify';

export const GET = unifiedApiHandler(async (request, { module }) => {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const search = searchParams.get('search') || undefined;
  const isActiveStr = searchParams.get('is_active');

  let isActive: boolean | undefined = undefined;
  if (isActiveStr === 'true') isActive = true;
  if (isActiveStr === 'false') isActive = false;

  const result = await module.blogs.listBlogs({
    page,
    limit,
    search,
    isActive
  });

  if (!result.data) {
    return NextResponse.json({ error: 'Failed to fetch blogs' }, { status: 500 });
  }

  return NextResponse.json(result.data, { status: 200 });
});

export const POST = unifiedApiHandler(async (request, { module, auth }) => {
  try {
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
      isActive = true,
      isFeatured = false
    } = body;

    if (!titleAz && !titleEn) {
      return NextResponse.json(
        { error: 'At least one title (AZ or EN) is required' },
        { status: 400 }
      );
    }

    const slug = slugify(titleAz || titleEn || '', { lower: true, strict: true });

    const insertData: any = {
      titleAz,
      titleEn,
      metaTitleAz,
      metaTitleEn,
      metaDescriptionAz,
      metaDescriptionEn,
      contentAz,
      contentEn,
      slug,
      isActive,
      isFeatured,
      cover
    };

    const result = await module.blogs.createBlog(insertData);

    return NextResponse.json({ blog: result.data }, { status: 201 });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create blog';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
});
