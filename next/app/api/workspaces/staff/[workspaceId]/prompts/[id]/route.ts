import { NextRequest, NextResponse } from "next/server";
import { unifiedApiHandler } from "@/lib/middleware/handlers";

export const GET = unifiedApiHandler(async (request: NextRequest, { params, module }) => {
  if (!params) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Invalid prompt ID" }, { status: 400 });
  }

  const result = await module.content.getPromptDetails(id);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: (result as any).code || 500 });
  }

  return NextResponse.json(result.data, { status: 200 });
});

export const PUT = unifiedApiHandler(async (request: NextRequest, { params, authData, module }) => {
  if (!authData) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!params) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Invalid prompt ID" }, { status: 400 });
  }

  const body = await request.json();
  const result = await module.content.updatePrompt(id, body);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: (result as any).code || 500 });
  }

  return NextResponse.json(result.data, { status: 200 });
});

export const DELETE = unifiedApiHandler(async (request: NextRequest, { params, authData, module }) => {
  if (!authData) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!params) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Invalid prompt ID" }, { status: 400 });
  }

  const result = await module.content.deletePrompt(id);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: (result as any).code || 500 });
  }

  return NextResponse.json({ message: result.message }, { status: 200 });
});
