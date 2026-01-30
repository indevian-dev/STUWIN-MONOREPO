
import { NextResponse } from "next/server";
import { unifiedApiHandler } from "@/lib/app-access-control/interceptors";

export const POST = unifiedApiHandler(async (request, { module, params }) => {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ success: false, error: "Invalid Subject ID" }, { status: 400 });
  }
  const subjectId = id as string;

  const body = await request.json();
  const { topics } = body;

  if (!Array.isArray(topics) || topics.length === 0) {
    return NextResponse.json({ success: false, error: "No topics provided" }, { status: 400 });
  }

  const result = await module.learning.bulkCreateTopics(subjectId, topics);

  if (!result.success || !result.data) {
    return NextResponse.json({ success: false, error: result.error || "Failed to create topics" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: `Successfully created ${result.data.length} topics`,
    data: result.data
  });
});
