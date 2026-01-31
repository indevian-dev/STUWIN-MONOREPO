import { NextRequest, NextResponse } from "next/server";
import { unifiedApiHandler } from "@/lib/app-access-control/interceptors";

export const POST = unifiedApiHandler(
  async (req: NextRequest) => {
    return NextResponse.json(
      { error: "Endpoint temporarily disabled for refactoring" },
      { status: 503 }
    );
  }
);
