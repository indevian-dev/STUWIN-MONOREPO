import { NextRequest, NextResponse } from 'next/server';
import { unifiedApiHandler } from '@/lib/middleware/handlers';

export const POST = unifiedApiHandler(async (request: NextRequest, { module, params }) => {
    try {
        const { categoryId } = params || {};

        if (!categoryId) {
            return NextResponse.json(
                { error: 'Valid category ID is required' },
                { status: 400 }
            );
        }

        const body = await request.json();
        const { fileName } = body;

        if (!fileName) {
            return NextResponse.json({ error: 'File name is required' }, { status: 400 });
        }

        const result = await module.subject.deleteMedia(categoryId, fileName);

        if (!result.success) {
            const status = result.error === 'Subject not found' ? 404 : 500;
            return NextResponse.json({ error: result.error }, { status });
        }

        return NextResponse.json({
            message: 'Media deleted successfully',
            categoryId
        }, { status: 200 });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error deleting media';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
});
