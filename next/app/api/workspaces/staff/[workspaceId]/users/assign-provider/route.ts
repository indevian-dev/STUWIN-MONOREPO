import { NextRequest, NextResponse } from "next/server";
import { unifiedApiHandler } from "@/lib/middleware/handlers";

export const POST = unifiedApiHandler(
  async (req: NextRequest) => {
    return NextResponse.json(
      { error: "Endpoint temporarily disabled for refactoring" },
      { status: 503 }
    );
  }
);
