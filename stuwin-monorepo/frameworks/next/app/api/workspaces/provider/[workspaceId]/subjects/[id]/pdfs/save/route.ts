
import { NextResponse } from "next/server";
import { unifiedApiHandler } from "@/lib/app-access-control/interceptors";

export const POST = unifiedApiHandler(async (request, { module, auth, params }) => {
  const { id: subjectId, workspaceId } = await params;

  if (!subjectId) {
    return NextResponse.json(
      { success: false, error: "Invalid subject ID" },
      { status: 400 },
    );
  }

  const body = await request.json();
  const { pdfKey, name, language } = body;

  if (!pdfKey) {
    return NextResponse.json(
      { error: "pdfKey is required" },
      { status: 400 },
    );
  }

  // Construct the PDF URL using the S3 prefix and key
  const s3Prefix = process.env.NEXT_PUBLIC_S3_PREFIX || "";
  const pdfUrl = `${s3Prefix}${pdfKey}`;

  const result = await module.learning.saveSubjectPdf({
    subjectId: subjectId as string,
    pdfUrl,
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
