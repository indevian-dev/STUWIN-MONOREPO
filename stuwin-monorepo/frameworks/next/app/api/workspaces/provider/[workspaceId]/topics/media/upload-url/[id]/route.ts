import { NextRequest, NextResponse } from "next/server";
import { unifiedApiHandler } from "@/lib/app-access-control/interceptors";

export const POST = unifiedApiHandler(
  async (request: NextRequest, { module, params }) => {
    const { id: topicId } = params ?? {};
    if (!topicId) {
      return NextResponse.json({ error: "Valid topic ID is required" }, { status: 400 });
    }

    const { fileName, fileType } = await request.json();
    const result = await module.learning.getTopicMediaUploadUrl(topicId, fileName, fileType);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: (result as any).code || 500 });
    }

    return NextResponse.json(result.data, { status: 200 });
  }
);
