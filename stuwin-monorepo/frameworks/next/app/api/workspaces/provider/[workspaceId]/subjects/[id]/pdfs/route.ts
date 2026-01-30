
import { NextResponse } from "next/server";
import { unifiedApiHandler } from "@/lib/app-access-control/interceptors";

export const GET = unifiedApiHandler(async (request, { module, params }) => {
  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { success: false, error: "Invalid subject ID" },
      { status: 400 },
    );
  }

  const result = await module.learning.getSubjectPdfs(id);

  if (!result.success) {
    return NextResponse.json(
      { success: false, error: result.error || "Failed to fetch subject PDFs" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    data: result.data,
  });
});
