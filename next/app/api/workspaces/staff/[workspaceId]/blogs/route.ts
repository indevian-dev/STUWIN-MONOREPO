import { unifiedApiHandler } from '@/lib/middleware/_Middleware.index';
import { okResponse, createdResponse, errorResponse, serverErrorResponse } from '@/lib/middleware/Response.Api.middleware';
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

  const result = await module.content.listBlogs({
    page,
    limit,
    search,
    isActive
  });

  if (!result.data) {
    return serverErrorResponse("Failed to fetch blogs");
  }

  return okResponse(result.data);
});

export const POST = unifiedApiHandler(async (request, { module }) => {
  try {
    const body = await request.json();
    const {
      localizedContent,
      cover,
      isActive = true,
      isFeatured = false
    } = body;

    if (!localizedContent || Object.keys(localizedContent).length === 0) {
      return errorResponse("Localized content is required");
    }

    // Use AZ title for slug if available, otherwise any available title
    const firstLocale = localizedContent.az || Object.values(localizedContent)[0] as any;
    const slugBase = firstLocale?.title || 'blog';
    const slug = slugify(slugBase, { lower: true, strict: true }) + '-' + Math.random().toString(36).substr(2, 5);

    const insertData: any = {
      localizedContent,
      slug,
      isActive,
      isFeatured,
      cover
    };

    const result = await module.content.createBlog(insertData);

    return createdResponse(result.data);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create blog';
    return serverErrorResponse(errorMessage);
  }
});

