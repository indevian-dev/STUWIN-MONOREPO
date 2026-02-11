import { NextRequest, NextResponse } from "next/server";
import { unifiedApiHandler } from "@/lib/middleware/handlers";

export const POST = unifiedApiHandler(
  async (request: NextRequest, { log }) => {
    if (log) log.info("User create endpoint placeholder");
    return NextResponse.json({ message: "Not implemented" }, { status: 501 });
  }
);
