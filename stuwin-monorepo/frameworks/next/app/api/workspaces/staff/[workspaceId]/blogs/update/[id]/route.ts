import { NextRequest, NextResponse } from "next/server";
import { unifiedApiHandler } from "@/lib/app-access-control/interceptors";
import slugify from 'slugify';

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
