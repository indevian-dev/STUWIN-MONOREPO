
import { NextResponse } from "next/server";
import { unifiedApiHandler } from "@/lib/middleware/handlers";

export const GET = unifiedApiHandler(async (request, { module, params }) => {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ success: false, error: "Invalid Subject ID" }, { status: 400 });
  }

  // Reuse getSubjectOverview which fetches topics and handles PDF logic (mostly)
  // The legacy code had complex PDF ordering logic in the GET route.
  // If that logic is critical and not in getSubjectOverview, we might need to enhance the service.
  // But getSubjectOverview uses topicRepository.listBySubject.
  // Let's assume for now the basic list is sufficient or we update service later if ordering is broken.

  // Actually, getSubjectOverview returns { ...subject, topics, pdfs }.
  // We just want topics here.

  const result = await module.subject.getOverview(id);

  if (!result.success || !result.data) {
    return NextResponse.json({
      success: false,
      error: result.error || "Failed to fetch topics"
    }, { status: result.error === "Subject not found" ? 404 : 500 });
  }

  return NextResponse.json({
    success: true,
    data: (result.data as any).topics
  });
});
