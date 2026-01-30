import type { NextRequest } from "next/server";
import type { ApiRouteHandler, ApiHandlerContext } from "@/types/next";
import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/app-access-control/interceptors";

export const GET: ApiRouteHandler = withApiHandler(
  async (request: NextRequest, { authData, db, log }: ApiHandlerContext) => {
    log.info("Accounts list endpoint placeholder");
    return NextResponse.json({ message: "Not implemented" }, { status: 501 });
  },
);
