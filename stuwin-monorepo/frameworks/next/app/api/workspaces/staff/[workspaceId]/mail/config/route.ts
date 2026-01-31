import { NextRequest, NextResponse } from "next/server";
import { unifiedApiHandler } from "@/lib/app-access-control/interceptors";

export const GET = unifiedApiHandler(async (request: NextRequest, { module }) => {
  const result = await module.mail.getConfig();
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json(result.data);
});

export const POST = unifiedApiHandler(async (request: NextRequest, { module }) => {
  const body = await request.json();
  const result = await module.mail.updateConfig(body);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: (result as any).code || 500 });
  }

  return NextResponse.json({
    success: true,
    message: result.message
  });
});
