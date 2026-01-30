import { NextResponse } from "next/server";
import { unifiedApiHandler } from "@/lib/app-access-control/interceptors";
import { ValidationService, Rules, Sanitizers } from '@/lib/app-core-modules/services/ValidationService';

export const GET = unifiedApiHandler(async (request, { module, params }) => {
  const workspaceId = params.workspaceId;
  const result = await module.learning.getWorkspaceSubjects(workspaceId);

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

  const validation = ValidationService.validate(body, {
    title: {
      rules: [Rules.required('title'), Rules.string('title')]
    },
    slug: {
      rules: [Rules.required('slug'), Rules.string('slug')],
      sanitizers: [Sanitizers.lowercase, Sanitizers.trim]
    },
    description: {
      rules: [Rules.string('description')],
      sanitizers: [Sanitizers.trim]
    }
  });

  if (!validation.isValid) {
    return NextResponse.json({
      success: false,
      error: validation.firstError?.message || "Validation failed"
    }, { status: 400 });
  }

  const result = await module.learning.createSubject({
    ...validation.sanitized,
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
