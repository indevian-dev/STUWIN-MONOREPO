import { NextRequest } from 'next/server';
import { unifiedApiHandler } from "@/lib/middleware/handlers";
import { errorResponse, okResponse } from '@/lib/middleware/responses/ApiResponse';

// POST: Get presigned URL for cover upload
// Deterministic path: {workspaceId}/subjects/{subjectId}/covers/cover.webp
// No PUT needed — no DB storage. Frontend constructs the URL from workspaceId + subjectId.
export const POST = unifiedApiHandler(
  async (request: NextRequest, { params, module }) => {
    const subjectId = params?.id as string;
    const workspaceId = params?.workspaceId as string;
    if (!subjectId || !workspaceId) {
      return errorResponse("Invalid subject or workspace ID", 400);
    }

    const { fileType } = await request.json();
    const result = await module.subject.getCoverUploadUrl(subjectId, fileType, workspaceId);

    if (!result.success) {
      return errorResponse(result.error, 200);
    }

    return okResponse(result.data);
  }
);
