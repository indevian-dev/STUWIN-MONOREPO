import { NextRequest, NextResponse } from "next/server";
import { unifiedApiHandler } from "@/lib/app-access-control/interceptors";

export const POST = unifiedApiHandler(
  async (request: NextRequest, { params, module }) => {
    const subjectId = params?.id as string;
    if (!subjectId) {
      return NextResponse.json({ success: false, error: "Invalid subject ID" }, { status: 400 });
    }

    const { fileName, fileType } = await request.json();
    const result = await module.learning.getSubjectCoverUploadUrl(subjectId, fileName, fileType);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: (result as any).code || 500 });
    }

    return NextResponse.json({ success: true, ...result.data }, { status: 200 });
  }
);

export const PUT = unifiedApiHandler(
  async (request: NextRequest, { module, params }) => {
    const subjectId = params?.id as string;
    if (!subjectId) {
      return NextResponse.json({ success: false, error: "Invalid subject ID" }, { status: 400 });
    }

    const { coverUrl } = await request.json();
    const result = await module.learning.updateSubject(subjectId, { cover: coverUrl });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Cover updated successfully",
    });
  }
);
