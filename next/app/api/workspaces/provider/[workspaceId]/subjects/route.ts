import { NextResponse } from "next/server";
import { unifiedApiHandler } from "@/lib/middleware/handlers";
import { SubjectCreateSchema } from "@/lib/domain/learning/learning.inputs";

export const GET = unifiedApiHandler(async (request, { module, params }) => {
  const workspaceId = params.workspaceId;
  const result = await module.subject.getWorkspaceSubjects(workspaceId);

  if (!result.success || !result.data) {
    return NextResponse.json({ success: false, error: result.error || "Failed" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    data: result.data
  });
});

export const POST = unifiedApiHandler(async (request, { module, params }) => {
  const workspaceId = params.workspaceId;
  const body = await request.json();

  const parsed = SubjectCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({
      success: false,
      error: parsed.error.errors[0]?.message || "Validation failed"
    }, { status: 400 });
  }

  const result = await module.subject.create({
    ...parsed.data,
    description: parsed.data.description || '',
    language: parsed.data.language || 'az',
    gradeLevel: parsed.data.gradeLevel || 1,
    workspaceId
  });

  if (!result.success || !result.data) {
    return NextResponse.json({ success: false, error: result.error || "Failed" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    data: result.data
  });
});
