import { NextRequest, NextResponse } from "next/server";
import { unifiedApiHandler } from "@/lib/app-access-control/interceptors";

export const GET = unifiedApiHandler(async (request: NextRequest, { module }) => {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');

        if (!type) {
            return NextResponse.json({ error: 'Type parameter is required' }, { status: 400 });
        }

        const result = await module.content.getPage(type);

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: (result as any).code || 404 });
        }

        return NextResponse.json({ doc: result.data, success: true });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch doc';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
});
