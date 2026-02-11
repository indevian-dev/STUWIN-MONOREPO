import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { unifiedApiHandler } from "@/lib/middleware/handlers";

export const POST = unifiedApiHandler(
  async (request: NextRequest, { module }) => {
    const body = await request.json();
    const { filename, filePath } = body;

    if (!filename || !filePath) {
      return NextResponse.json(
        { error: "Filename and filePath are required" },
        { status: 400 },
      );
    }

    const result = await module.workspace.deleteUserMedia(filename, filePath);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: (result as any).code || 500 });
    }

    return NextResponse.json(
      { message: result.message },
      { status: 200 },
    );
  }
);
