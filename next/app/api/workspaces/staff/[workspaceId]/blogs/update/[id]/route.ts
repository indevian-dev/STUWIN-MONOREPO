import { NextRequest } from 'next/server';
import { okResponse, errorResponse, serverErrorResponse } from '@/lib/middleware/responses/ApiResponse';
import { unifiedApiHandler } from "@/lib/middleware/handlers";
import slugify from 'slugify';

export const PUT = unifiedApiHandler(async (request: NextRequest, { params, authData, module, log }) => {
    if (!params) {
        return errorResponse("Missing parameters");
    }
    const { id } = await params;
    if (!id) {
        return errorResponse("Invalid blog ID");
    }

    try {
        if (!authData) {
            return errorResponse("Unauthorized", 401, "UNAUTHORIZED");
        }

        const body = await request.json();
        const {
            localizedContent,
            cover,
            isActive,
            isFeatured
        } = body;

        const updateData: any = {};
        if (localizedContent !== undefined) {
            updateData.localizedContent = localizedContent;

            // Update slug if localizedContent provided
            const firstLocale = localizedContent.az || Object.values(localizedContent)[0] as any;
            if (firstLocale?.title) {
                updateData.slug = slugify(firstLocale.title, { lower: true, strict: true });
            }
        }

        if (cover !== undefined) updateData.cover = cover;
        if (isActive !== undefined) updateData.isActive = isActive;
        if (isFeatured !== undefined) updateData.isFeatured = isFeatured;

        if (Object.keys(updateData).length === 0) {
            return errorResponse("No fields to update");
        }

        const updatedBlog = await module.content.contentRepo.updateBlog(id, updateData);

        if (!updatedBlog) {
            return errorResponse("Blog not found", 404, "NOT_FOUND");
        }
        return okResponse(updatedBlog);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update blog';
        if (log) log.error("Failed to update blog", error);
        return serverErrorResponse(errorMessage);
    }
});
