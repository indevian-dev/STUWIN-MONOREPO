import { NextRequest, NextResponse } from "next/server";
import { unifiedApiHandler } from "@/lib/middleware/handlers";

export const POST = unifiedApiHandler(
  async (request: NextRequest, { module }) => {
    const { topicId, fileName, fileType } = await request.json();

    if (!topicId || !fileName || !fileType) {
      return NextResponse.json(
        { error: "topicId, fileName, and fileType are required" },
        { status: 400 },
      );
    }

    const result = await module.topic.getMediaUploadUrl(topicId, fileName, fileType);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: (result as any).code || 500 });
    }

    return NextResponse.json(result.data, { status: 200 });
  }
);
