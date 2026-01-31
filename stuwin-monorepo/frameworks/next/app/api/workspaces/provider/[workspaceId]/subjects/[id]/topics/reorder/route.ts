import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { unifiedApiHandler, type UnifiedContext } from "@/lib/app-access-control/interceptors/ApiInterceptor";

export const PUT = unifiedApiHandler(
  async (request: NextRequest, context: UnifiedContext) => {
    const { authData, module, params, log } = context;

    if (!authData) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const subjectId = params?.id as string;
      if (!subjectId) {
        return NextResponse.json(
          { success: false, error: "Invalid subject ID" },
          { status: 400 },
        );
      }

      // Parse request body
      const body = await request.json();
      let { topicIds, subjectPdfId: bodySubjectPdfId } = body;

      // Backward compatibility: if old format with 'topics' array is sent, convert it
      if (!topicIds && body.topics && Array.isArray(body.topics)) {
        topicIds = body.topics
          .map((t: any) => {
            return typeof t === "object" && t.id ? String(t.id) : String(t as any);
          });
      }

      if (!Array.isArray(topicIds)) {
        return NextResponse.json(
          { success: false, error: "Missing 'topicIds' array in request body" },
          { status: 400 },
        );
      }

      // Determine subjectPdfId
      let pdfId = bodySubjectPdfId;

      if (!pdfId) {
        // Fallback: Try to get it from the subject's PDF list
        const pdfsResult = await module.learning.getSubjectPdfs(subjectId);
        if (pdfsResult.success && pdfsResult.data && pdfsResult.data.length > 0) {
          // If there's only one PDF, use it. If multiple, try to find active one or just take first.
          if (pdfsResult.data.length === 1) {
            pdfId = pdfsResult.data[0].id;
          } else {
            const activePdf = pdfsResult.data.find(p => p.isActive);
            pdfId = activePdf?.id || pdfsResult.data[0].id;
          }
        }
      }

      if (!pdfId) {
        return NextResponse.json(
          { success: false, error: "Unable to determine subjectPdfId. Please provide it explicitly." },
          { status: 400 },
        );
      }

      // Perform reorder
      const result = await module.learning.reorderTopics(pdfId, topicIds);

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 400 },
        );
      }

      return NextResponse.json({
        success: true,
        message: "Topics reordered successfully",
      });
    } catch (error) {
      log.error("Failed to reorder topics", error);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to reorder topics",
          details: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : String(error)) : undefined,
        },
        { status: 500 },
      );
    }
  },
);
