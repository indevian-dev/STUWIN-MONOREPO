import { NextRequest, NextResponse } from "next/server";
import { unifiedApiHandler } from "@/lib/app-access-control/interceptors";

export const POST = unifiedApiHandler(
  async (request: NextRequest, { params, module, isValidSlimId }) => {
    const subjectId = params?.id as string;

    if (!subjectId || !isValidSlimId(subjectId)) {
      return NextResponse.json({ success: false, error: "Invalid subject ID" }, { status: 400 });
    }

    const { fileName, fileType } = await request.json();
    const result = await module.learning.getSubjectPdfUploadUrl(subjectId, fileName, fileType);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: (result as any).code || 500 });
    }

    return NextResponse.json(result.data, { status: 200 });
  }
);