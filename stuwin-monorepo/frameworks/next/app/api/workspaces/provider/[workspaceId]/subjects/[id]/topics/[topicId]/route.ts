
import { NextResponse } from "next/server";
import { unifiedApiHandler } from "@/lib/app-access-control/interceptors";

export const GET = unifiedApiHandler(async (request, { module, params }) => {
  const { id, topicId } = await params;

  if (!id || !topicId) {
    return NextResponse.json(
      { success: false, error: "Invalid subject ID or topic ID" },
      { status: 400 },
    );
  }

  const result = await module.learning.getTopicDetail(topicId, id);

  if (!result.success) {
    return NextResponse.json(
      { success: false, error: result.error || "Failed to fetch topic" },
      { status: result.error === "Topic not found" ? 404 : 500 },
    );
  }

  return NextResponse.json({
    success: true,
    data: result.data,
  });
});
