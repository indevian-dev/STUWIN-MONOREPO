import { NextRequest, NextResponse } from "next/server";
import { unifiedApiHandler } from "@/lib/app-access-control/interceptors";

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
