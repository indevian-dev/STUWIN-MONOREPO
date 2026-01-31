import { NextRequest, NextResponse } from "next/server";
import { unifiedApiHandler } from "@/lib/app-access-control/interceptors";

export const POST = unifiedApiHandler(
  async (request: NextRequest, { module, params }) => {
    const topicId = params?.id as string;

    if (!topicId) {
      return NextResponse.json({ error: "Valid topic ID is required" }, { status: 400 });
    }

    const { s3Key, pdfPageStart, pdfPageEnd, chapterNumber } = await request.json();

    if (!s3Key) {
      return NextResponse.json({ error: "s3Key is required" }, { status: 400 });
    }

    const result = await module.learning.saveTopicPdfMetadata(topicId, {
      s3Key,
      pdfPageStart,
      pdfPageEnd,
      chapterNumber
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: (result as any).code || 404 });
    }

    return NextResponse.json(
      {
        message: result.error,
        topic: result.data,
      },
      { status: 200 },
    );
  }
);
