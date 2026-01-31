import { NextRequest, NextResponse } from "next/server";
import { unifiedApiHandler } from "@/lib/app-access-control/interceptors";

export const GET = unifiedApiHandler(async (request: NextRequest, { module }) => {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const search = searchParams.get("search") || undefined;

  const result = await module.content.managePrompts({ page, limit, search });

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json(result.data, { status: 200 });
});

export const POST = unifiedApiHandler(async (request: NextRequest, { authData, module }) => {
  if (!authData) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const result = await module.content.createPrompt(body);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: (result as any).code || 500 });
  }

  return NextResponse.json({ prompt: result.data }, { status: 201 });
});
