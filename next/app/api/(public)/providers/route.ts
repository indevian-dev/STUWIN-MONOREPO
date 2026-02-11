
import { NextResponse } from "next/server";
import { unifiedApiHandler } from "@/lib/middleware/handlers";

export const GET = unifiedApiHandler(async (request, { module }) => {
    const { searchParams } = new URL(request.url);
    const hasAnyParam = Array.from(searchParams.keys()).length > 0;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = Math.min(
        parseInt(searchParams.get("pageSize") || "24", 10),
        100,
    );
    const sortField = searchParams.get("sort") || "createdAt";
    const orderDir = (searchParams.get("order") || "desc") as 'asc' | 'desc';
    const offset = (page - 1) * pageSize;

    const result = await module.workspace.listProviders({
        limit: pageSize,
        offset,
        sortField,
        orderDir
    });

    if (!result.success || !result.data) {
        return NextResponse.json({ error: result.error || "Failed to fetch providers" }, { status: 500 });
    }

    const { data, total } = result.data;

    // Backward-compatible response for callers without query params
    if (!hasAnyParam) {
        return NextResponse.json({ providers: data });
    }

    return NextResponse.json({
        providers: data,
        total,
        page,
        pageSize,
    });
});
