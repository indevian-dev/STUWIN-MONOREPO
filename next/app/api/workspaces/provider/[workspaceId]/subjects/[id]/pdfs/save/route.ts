
import { NextResponse } from "next/server";
import { unifiedApiHandler } from "@/lib/middleware/handlers";

export const POST = unifiedApiHandler(async (request, { module, auth, params }) => {
  const { id: subjectId, workspaceId } = await params;

  if (!subjectId) {
    return NextResponse.json(
      { success: false, error: "Invalid subject ID" },
      { status: 400 },
    );
  }

  const body = await request.json();
  const { pdfFileName, name, language } = body;

  if (!pdfFileName) {
    return NextResponse.json(
      { error: "pdfFileName is required" },
      { status: 400 },
    );
  }

  const result = await module.subject.savePdf({
    subjectId: subjectId as string,
    pdfFileName,
    uploadAccountId: auth.accountId,
    workspaceId: workspaceId as string,
    name,
    language,
  });

  if (!result.success) {
    return NextResponse.json(
      { success: false, error: result.error || "Failed to save PDF metadata" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    data: result.data,
    message: "PDF uploaded successfully",
  });
});
