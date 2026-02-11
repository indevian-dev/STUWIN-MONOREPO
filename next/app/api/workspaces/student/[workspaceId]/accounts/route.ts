import { NextRequest, NextResponse } from "next/server";
import { unifiedApiHandler } from "@/lib/middleware/handlers";

export const GET = unifiedApiHandler(
  async (request: NextRequest, { log }) => {
    log.info("Accounts list endpoint placeholder");
    return NextResponse.json({ message: "Not implemented" }, { status: 501 });
  },
);
