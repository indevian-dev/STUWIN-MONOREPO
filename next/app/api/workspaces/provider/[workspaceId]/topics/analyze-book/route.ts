import { NextRequest, NextResponse } from "next/server";
import { unifiedApiHandler } from "@/lib/middleware/handlers";

export const POST = unifiedApiHandler(
  async (request: NextRequest, { module }) => {
    const body = await request.json();
    const { pdfKey, subjectId, gradeLevel } = body;

    if (!pdfKey || !subjectId || !gradeLevel) {
      return NextResponse.json(
        { error: "pdfKey, subjectId, and gradeLevel are required" },
        { status: 400 },
      );
    }

    const result = await module.topic.analyzeBook({ pdfKey, subjectId, gradeLevel });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: (result as any).code || 500 });
    }

    return NextResponse.json(result, { status: 200 });
  }
);
