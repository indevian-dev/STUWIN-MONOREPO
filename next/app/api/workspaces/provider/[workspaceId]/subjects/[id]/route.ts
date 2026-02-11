
import { NextResponse } from "next/server";
import { unifiedApiHandler } from "@/lib/middleware/handlers";

export const GET = unifiedApiHandler(async (request, { module, params }) => {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ success: false, error: "Invalid ID" }, { status: 400 });
  }

  const result = await module.subject.getOverview(id);

  if (!result.success || !result.data) {
    return NextResponse.json({ success: false, error: result.error || "Subject not found" }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    data: result.data
  });
});
