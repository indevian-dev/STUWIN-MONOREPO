import { NextRequest } from 'next/server';
import { okResponse, errorResponse, serverErrorResponse } from '@/lib/middleware/responses/ApiResponse';
import { unifiedApiHandler } from "@/lib/middleware/handlers";
import slugify from 'slugify';

export const GET = unifiedApiHandler(async (request: NextRequest, { params, module, log }) => {
  if (!params) {
    return errorResponse("Missing parameters");
  }
  const { id } = await params;
  if (!id) {
    return errorResponse("Invalid blog ID");
  }

  try {
    const blog = await module.content.contentRepo.findBlogById(id);

    if (!blog) {
      return errorResponse("Blog not found", 404, "NOT_FOUND");
    }
    return okResponse(blog);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch blog';
    if (log) log.error("Failed to fetch blog", error);
    return serverErrorResponse(errorMessage);
  }
});

