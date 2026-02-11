import { NextRequest, NextResponse } from "next/server";
import { unifiedApiHandler } from "@/lib/middleware/handlers";

export const POST = unifiedApiHandler(async (request: NextRequest, { module }) => {
  const body = await request.json();
  const { api_key, from_email } = body;

  const result = await module.mail.testConnection(api_key, from_email);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: (result as any).code || 400 }
    );
  }

  return NextResponse.json({
    success: true,
    message: result.message
  });
});
