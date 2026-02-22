
import { unifiedApiHandler } from "@/lib/middleware/_Middleware.index";
import { okResponse, errorResponse, serverErrorResponse } from '@/lib/middleware/Response.Api.middleware';

export const POST = unifiedApiHandler(async (request, { module, auth, params }) => {
  const { id: subjectId, workspaceId } = await params;

  if (!subjectId) {
    return errorResponse("Invalid subject ID", 400);
  }

  const body = await request.json();
  const { pdfFileName, name, language } = body;

  if (!pdfFileName) {
    return errorResponse("pdfFileName is required", 400);
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
    return serverErrorResponse(result.error || "Failed to save PDF metadata");
  }

  return okResponse(result.data, "PDF uploaded successfully");
});
