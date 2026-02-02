import { NextRequest, NextResponse } from "next/server";
import { unifiedApiHandler, type UnifiedContext } from "@/lib/app-access-control/interceptors/ApiInterceptor";

export const GET = unifiedApiHandler(
    async (request: NextRequest, { module, auth }: UnifiedContext) => {
        const { searchParams } = new URL(request.url);
        const subjectId = searchParams.get("subjectId") || undefined;
        const accountId = auth.accountId;

        const result = await module.activity.getStudentProgress(accountId, subjectId);

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json({ data: result.data });
    }
);
